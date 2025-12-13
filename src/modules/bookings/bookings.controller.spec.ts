import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  UpdateBookingStatusDto,
  BookingStatus,
} from './dto/update-booking-status.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: BookingsService;

  const mockBooking = {
    _id: '507f1f77bcf86cd799439012',
    serviceId: '507f1f77bcf86cd799439011',
    date: new Date('2025-12-20'),
    timeSlot: '10:00',
    customerInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    },
    notes: 'Test booking',
    status: 'pending',
  };

  const mockBookingsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking', async () => {
      const createDto: CreateBookingDto = {
        serviceId: '507f1f77bcf86cd799439011',
        date: '2025-12-20',
        timeSlot: '10:00',
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
      };

      mockBookingsService.create.mockResolvedValue(mockBooking);

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated bookings', async () => {
      const query: QueryBookingsDto = { page: 1, limit: 10 };
      const expected = {
        data: [mockBooking],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockBookingsService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(result).toEqual(expected);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a single booking', async () => {
      mockBookingsService.findOne.mockResolvedValue(mockBooking);

      const result = await controller.findOne('507f1f77bcf86cd799439012');

      expect(result).toEqual(mockBooking);
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });
  });

  describe('updateStatus', () => {
    it('should update booking status', async () => {
      const updateDto: UpdateBookingStatusDto = {
        status: BookingStatus.CONFIRMED,
      };
      const updatedBooking = { ...mockBooking, status: 'confirmed' };

      mockBookingsService.updateStatus.mockResolvedValue(updatedBooking);

      const result = await controller.updateStatus(
        '507f1f77bcf86cd799439012',
        updateDto,
      );

      expect(result).toEqual(updatedBooking);
      expect(service.updateStatus).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        updateDto,
      );
    });
  });
});
