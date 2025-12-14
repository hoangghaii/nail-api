import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  UpdateBookingStatusDto,
  BookingStatus,
} from './dto/update-booking-status.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';

describe('BookingsService', () => {
  let service: BookingsService;
  let model: Model<BookingDocument>;

  const mockServiceId = new Types.ObjectId('507f1f77bcf86cd799439011');
  const mockBookingId = new Types.ObjectId('507f1f77bcf86cd799439012');

  const mockBooking = {
    _id: mockBookingId,
    serviceId: mockServiceId,
    date: new Date('2025-12-20'),
    timeSlot: '10:00',
    customerInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    },
    notes: 'Please use organic products',
    status: 'pending',
  };

  const mockBookingModel = {
    new: jest.fn(),
    constructor: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getModelToken(Booking.name),
          useValue: mockBookingModel,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    model = module.get<Model<BookingDocument>>(getModelToken(Booking.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking successfully', async () => {
      const createDto: CreateBookingDto = {
        serviceId: mockServiceId.toString(),
        date: '2025-12-20',
        timeSlot: '10:00',
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
        notes: 'Test booking',
      };

      const savedBooking = {
        ...mockBooking,
        serviceId: mockServiceId,
      };

      const saveMock = jest.fn().mockResolvedValue(savedBooking);
      const mockInstance = { save: saveMock };

      // Mock findOne to return null directly (no .exec() chain for validateTimeSlot)
      const findOneMock = jest.fn().mockResolvedValue(null);

      // Temporarily mock the model constructor while preserving/mocking other methods
      const originalModel = (service as any).bookingModel;

      // Create a constructor function that also has model methods
      const mockConstructor: any = jest.fn().mockReturnValue(mockInstance);
      mockConstructor.findOne = findOneMock;
      mockConstructor.find = model.find;
      mockConstructor.findById = model.findById;
      mockConstructor.findByIdAndUpdate = model.findByIdAndUpdate;
      mockConstructor.countDocuments = model.countDocuments;

      (service as any).bookingModel = mockConstructor;

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(saveMock).toHaveBeenCalled();

      // Restore original
      (service as any).bookingModel = originalModel;
    });

    it('should throw BadRequestException for invalid service ID', async () => {
      const createDto: CreateBookingDto = {
        serviceId: 'invalid-id',
        date: '2025-12-20',
        timeSlot: '10:00',
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if time slot already booked', async () => {
      const createDto: CreateBookingDto = {
        serviceId: mockServiceId.toString(),
        date: '2025-12-20',
        timeSlot: '10:00',
        customerInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+0987654321',
        },
      };

      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockBooking),
      } as any);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated bookings', async () => {
      const query: QueryBookingsDto = { page: 1, limit: 10 };
      const bookings = [mockBooking];

      const findChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(bookings),
      };

      jest.spyOn(model, 'find').mockReturnValue(findChain as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValueOnce(1 as never);

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: bookings,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should filter by status', async () => {
      const query: QueryBookingsDto = {
        status: 'pending',
        page: 1,
        limit: 10,
      };

      const findChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockBooking]),
      };

      jest.spyOn(model, 'find').mockReturnValue(findChain as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValueOnce(1 as never);

      const result = await service.findAll(query);

      expect(model.find).toHaveBeenCalledWith({ status: 'pending' });
      expect(result.data).toHaveLength(1);
    });

    it('should filter by date', async () => {
      const query: QueryBookingsDto = {
        date: '2025-12-20',
        page: 1,
        limit: 10,
      };

      const findChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockBooking]),
      };

      jest.spyOn(model, 'find').mockReturnValue(findChain as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValueOnce(1 as never);

      await service.findAll(query);

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.objectContaining({
            $gte: expect.any(Date),
            $lt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw BadRequestException for invalid service ID filter', async () => {
      const query: QueryBookingsDto = {
        serviceId: 'invalid-id',
        page: 1,
        limit: 10,
      };

      await expect(service.findAll(query)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return a booking by id', async () => {
      const findByIdChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBooking),
      };

      jest.spyOn(model, 'findById').mockReturnValue(findByIdChain as any);

      const result = await service.findOne(mockBookingId.toString());

      expect(result).toEqual(mockBooking);
      expect(model.findById).toHaveBeenCalledWith(mockBookingId.toString());
    });

    it('should throw BadRequestException for invalid booking ID', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if booking not found', async () => {
      const findByIdChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      jest.spyOn(model, 'findById').mockReturnValue(findByIdChain as any);

      await expect(service.findOne(mockBookingId.toString())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update booking status successfully', async () => {
      const updateDto: UpdateBookingStatusDto = {
        status: BookingStatus.CONFIRMED,
      };
      const updatedBooking = { ...mockBooking, status: 'confirmed' };

      const updateChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(updatedBooking),
      };

      jest
        .spyOn(model, 'findByIdAndUpdate')
        .mockReturnValue(updateChain as any);

      const result = await service.updateStatus(
        mockBookingId.toString(),
        updateDto,
      );

      expect(result).toEqual(updatedBooking);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        mockBookingId.toString(),
        { status: BookingStatus.CONFIRMED },
        { new: true },
      );
    });

    it('should throw BadRequestException for invalid booking ID', async () => {
      const updateDto: UpdateBookingStatusDto = {
        status: BookingStatus.CONFIRMED,
      };

      await expect(
        service.updateStatus('invalid-id', updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if booking not found', async () => {
      const updateDto: UpdateBookingStatusDto = {
        status: BookingStatus.CONFIRMED,
      };

      const updateChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      jest
        .spyOn(model, 'findByIdAndUpdate')
        .mockReturnValue(updateChain as any);

      await expect(
        service.updateStatus(mockBookingId.toString(), updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
