import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Service, ServiceDocument } from './schemas/service.schema';
import { CreateServiceDto, ServiceCategory } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';

describe('ServicesService', () => {
  let service: ServicesService;
  let model: Model<ServiceDocument>;

  const mockService = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Manicure',
    description: 'Classic manicure service',
    price: 25,
    duration: 30,
    category: ServiceCategory.MANICURE,
    featured: true,
    isActive: true,
    sortIndex: 1,
  };

  const mockServiceModel = {
    new: jest.fn().mockResolvedValue(mockService),
    constructor: jest.fn().mockResolvedValue(mockService),
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getModelToken(Service.name),
          useValue: mockServiceModel,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    model = module.get<Model<ServiceDocument>>(getModelToken(Service.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new service successfully', async () => {
      const createServiceDto: CreateServiceDto = {
        name: 'Pedicure',
        description: 'Relaxing pedicure service',
        price: 35,
        duration: 45,
        category: ServiceCategory.MANICURE,
      };

      const savedService = {
        ...createServiceDto,
        _id: '507f1f77bcf86cd799439012',
      };

      const saveMock = jest.fn().mockResolvedValue(savedService);
      const mockInstance = { save: saveMock };

      // Mock findOne to return null (no duplicate)
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);

      // Temporarily mock the model constructor while preserving other methods
      const originalModel = (service as any).serviceModel;
      const mockConstructor = Object.assign(
        jest.fn().mockReturnValue(mockInstance),
        {
          findOne: model.findOne,
          find: model.find,
          findById: model.findById,
          findByIdAndUpdate: model.findByIdAndUpdate,
          findByIdAndDelete: model.findByIdAndDelete,
          countDocuments: model.countDocuments,
        },
      );
      (service as any).serviceModel = mockConstructor;

      const result = await service.create(createServiceDto);

      expect(result).toBeDefined();
      expect(saveMock).toHaveBeenCalled();

      // Restore original
      (service as any).serviceModel = originalModel;
    });

    it('should throw ConflictException if service with same name exists', async () => {
      const createServiceDto: CreateServiceDto = {
        name: 'Manicure',
        description: 'Classic manicure',
        price: 25,
        duration: 30,
        category: ServiceCategory.MANICURE,
      };

      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockService as any);

      await expect(service.create(createServiceDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated services', async () => {
      const query: QueryServicesDto = { page: 1, limit: 10 };
      const services = [mockService];

      const findChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(services),
      };

      jest.spyOn(model, 'find').mockReturnValue(findChain as any);
      jest
        .spyOn(model, 'countDocuments')
        .mockResolvedValueOnce(1 as never);

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: services,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should filter by category', async () => {
      const query: QueryServicesDto = { category: ServiceCategory.MANICURE, page: 1, limit: 10 };

      const findChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockService]),
      };

      jest.spyOn(model, 'find').mockReturnValue(findChain as any);
      jest
        .spyOn(model, 'countDocuments')
        .mockResolvedValueOnce(1 as never);

      const result = await service.findAll(query);

      expect(model.find).toHaveBeenCalledWith({ category: 'manicure' });
      expect(result.data).toHaveLength(1);
    });

    it('should filter by featured status', async () => {
      const query: QueryServicesDto = { featured: true, page: 1, limit: 10 };

      const findChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockService]),
      };

      jest.spyOn(model, 'find').mockReturnValue(findChain as any);
      jest
        .spyOn(model, 'countDocuments')
        .mockResolvedValueOnce(1 as never);

      await service.findAll(query);

      expect(model.find).toHaveBeenCalledWith({ featured: true });
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockService),
      } as any);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockService);
      expect(model.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if service not found', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a service successfully', async () => {
      const updateDto: UpdateServiceDto = { price: 30 };
      const updatedService = { ...mockService, ...updateDto };

      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedService),
      } as any);

      const result = await service.update('507f1f77bcf86cd799439011', updateDto);

      expect(result).toEqual(updatedService);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateDto,
        { new: true },
      );
    });

    it('should throw NotFoundException if service not found', async () => {
      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.update('507f1f77bcf86cd799439011', { price: 30 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a service successfully', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockService),
      } as any);

      await service.remove('507f1f77bcf86cd799439011');

      expect(model.findByIdAndDelete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });

    it('should throw NotFoundException if service not found', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
