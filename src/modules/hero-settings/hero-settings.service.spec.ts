import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { HeroSettingsService } from './hero-settings.service';
import {
  HeroSettings,
  HeroSettingsDocument,
} from './schemas/hero-settings.schema';
import {
  UpdateHeroSettingsDto,
  HeroDisplayMode,
} from './dto/update-hero-settings.dto';

describe('HeroSettingsService', () => {
  let service: HeroSettingsService;
  let model: Model<HeroSettingsDocument>;

  const mockHeroSettings = {
    _id: '507f1f77bcf86cd799439011',
    displayMode: 'carousel',
    carouselInterval: 5000,
    showControls: true,
  };

  const mockHeroSettingsModel = {
    new: jest.fn().mockResolvedValue(mockHeroSettings),
    constructor: jest.fn().mockResolvedValue(mockHeroSettings),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HeroSettingsService,
        {
          provide: getModelToken(HeroSettings.name),
          useValue: mockHeroSettingsModel,
        },
      ],
    }).compile();

    service = module.get<HeroSettingsService>(HeroSettingsService);
    model = module.get<Model<HeroSettingsDocument>>(
      getModelToken(HeroSettings.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return existing hero settings', async () => {
      const mockExec = jest.fn().mockResolvedValue(mockHeroSettings);
      jest.spyOn(model, 'findOne').mockReturnValue({ exec: mockExec } as any);

      const result = await service.findOne();

      expect(result).toEqual(mockHeroSettings);
    });

    it('should create default hero settings if not exists', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      jest.spyOn(model, 'findOne').mockReturnValue({ exec: mockExec } as any);

      const saveMock = jest.fn().mockResolvedValue(mockHeroSettings);
      const mockInstance = { save: saveMock };

      // Temporarily mock the model constructor while preserving other methods
      const originalModel = (service as any).heroSettingsModel;
      const mockConstructor = Object.assign(
        jest.fn().mockReturnValue(mockInstance),
        {
          findOne: model.findOne,
          findByIdAndUpdate: model.findByIdAndUpdate,
        },
      );
      (service as any).heroSettingsModel = mockConstructor;

      const result = await service.findOne();

      expect(saveMock).toHaveBeenCalled();
      expect(result).toBeDefined();

      // Restore original
      (service as any).heroSettingsModel = originalModel;
    });
  });

  describe('update', () => {
    it('should update hero settings', async () => {
      const updateDto: UpdateHeroSettingsDto = {
        displayMode: HeroDisplayMode.VIDEO,
        carouselInterval: 3000,
      };

      const mockFindOneExec = jest.fn().mockResolvedValue(mockHeroSettings);
      jest
        .spyOn(model, 'findOne')
        .mockReturnValue({ exec: mockFindOneExec } as any);

      const updatedSettings = { ...mockHeroSettings, ...updateDto };
      const mockUpdateExec = jest.fn().mockResolvedValue(updatedSettings);
      jest
        .spyOn(model, 'findByIdAndUpdate')
        .mockReturnValue({ exec: mockUpdateExec } as any);

      const result = await service.update(updateDto);

      expect(result).toEqual(updatedSettings);
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        mockHeroSettings._id,
        updateDto,
        { new: true },
      );
    });

    it('should throw NotFoundException if hero settings not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      jest.spyOn(model, 'findOne').mockReturnValue({ exec: mockExec } as any);

      await expect(service.update({})).rejects.toThrow(NotFoundException);
    });
  });
});
