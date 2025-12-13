import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { CreateServiceDto, ServiceCategory } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: ServicesService;

  const mockService = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Manicure',
    description: 'Classic manicure service',
    price: 25,
    duration: 30,
    category: 'nails',
    featured: true,
    isActive: true,
    sortIndex: 1,
  };

  const mockServicesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    service = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a service', async () => {
      const createDto: CreateServiceDto = {
        name: 'Pedicure',
        description: 'Relaxing pedicure',
        price: 35,
        duration: 45,
        category: ServiceCategory.MANICURE,
      };

      mockServicesService.create.mockResolvedValue({
        ...createDto,
        _id: '507f1f77bcf86cd799439012',
      });

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated services', async () => {
      const query: QueryServicesDto = { page: 1, limit: 10 };
      const expected = {
        data: [mockService],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockServicesService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(result).toEqual(expected);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a single service', async () => {
      mockServicesService.findOne.mockResolvedValue(mockService);

      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockService);
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      const updateDto: UpdateServiceDto = { price: 30 };
      const updatedService = { ...mockService, ...updateDto };

      mockServicesService.update.mockResolvedValue(updatedService);

      const result = await controller.update('507f1f77bcf86cd799439011', updateDto);

      expect(result).toEqual(updatedService);
      expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a service', async () => {
      mockServicesService.remove.mockResolvedValue(undefined);

      await controller.remove('507f1f77bcf86cd799439011');

      expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
