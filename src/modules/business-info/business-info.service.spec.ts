import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { BusinessInfoService } from './business-info.service';
import {
  BusinessInfo,
  BusinessInfoDocument,
} from './schemas/business-info.schema';
import {
  UpdateBusinessInfoDto,
  DayOfWeek,
} from './dto/update-business-info.dto';

describe('BusinessInfoService', () => {
  let service: BusinessInfoService;
  let model: Model<BusinessInfoDocument>;

  const mockBusinessInfo = {
    _id: '507f1f77bcf86cd799439011',
    phone: '+1 (555) 123-4567',
    email: 'info@nailsalon.com',
    address: '123 Main St, City, State 12345',
    businessHours: [
      { day: 'monday', openTime: '09:00', closeTime: '18:00', closed: false },
    ],
  };

  const mockBusinessInfoModel = {
    new: jest.fn().mockResolvedValue(mockBusinessInfo),
    constructor: jest.fn().mockResolvedValue(mockBusinessInfo),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessInfoService,
        {
          provide: getModelToken(BusinessInfo.name),
          useValue: mockBusinessInfoModel,
        },
      ],
    }).compile();

    service = module.get<BusinessInfoService>(BusinessInfoService);
    model = module.get<Model<BusinessInfoDocument>>(
      getModelToken(BusinessInfo.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return existing business info', async () => {
      const mockExec = jest.fn().mockResolvedValue(mockBusinessInfo);
      jest.spyOn(model, 'findOne').mockReturnValue({ exec: mockExec } as any);

      const result = await service.findOne();

      expect(result).toEqual(mockBusinessInfo);
    });

    it('should create default business info if not exists', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      jest.spyOn(model, 'findOne').mockReturnValue({ exec: mockExec } as any);

      const saveMock = jest.fn().mockResolvedValue(mockBusinessInfo);
      const mockInstance = { save: saveMock };

      // Temporarily mock the model constructor while preserving other methods
      const originalModel = (service as any).businessInfoModel;
      const mockConstructor = Object.assign(
        jest.fn().mockReturnValue(mockInstance),
        {
          findOne: model.findOne,
          findByIdAndUpdate: model.findByIdAndUpdate,
        },
      );
      (service as any).businessInfoModel = mockConstructor;

      const result = await service.findOne();

      expect(saveMock).toHaveBeenCalled();
      expect(result).toBeDefined();

      // Restore original
      (service as any).businessInfoModel = originalModel;
    });
  });

  describe('update', () => {
    it('should update business info', async () => {
      const updateDto: UpdateBusinessInfoDto = {
        phone: '+1 (555) 999-8888',
      };

      const mockFindOneExec = jest.fn().mockResolvedValue(mockBusinessInfo);
      jest
        .spyOn(model, 'findOne')
        .mockReturnValue({ exec: mockFindOneExec } as any);

      const updatedInfo = { ...mockBusinessInfo, ...updateDto };
      const mockUpdateExec = jest.fn().mockResolvedValue(updatedInfo);
      jest
        .spyOn(model, 'findByIdAndUpdate')
        .mockReturnValue({ exec: mockUpdateExec } as any);

      const result = await service.update(updateDto);

      expect(result).toEqual(updatedInfo);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        mockBusinessInfo._id,
        updateDto,
        { new: true },
      );
    });

    it('should throw NotFoundException if business info not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      jest.spyOn(model, 'findOne').mockReturnValue({ exec: mockExec } as any);

      await expect(service.update({})).rejects.toThrow(NotFoundException);
    });
  });
});
