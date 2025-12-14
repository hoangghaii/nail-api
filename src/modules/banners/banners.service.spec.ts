import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { BannersService } from './banners.service';
import { Banner, BannerDocument } from './schemas/banner.schema';
import { CreateBannerDto, BannerType } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { QueryBannersDto } from './dto/query-banners.dto';
import { StorageService } from '../storage/storage.service';

describe('BannersService', () => {
  let service: BannersService;
  let model: Model<BannerDocument>;

  const mockBanner = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Welcome Banner',
    imageUrl: 'https://example.com/banner.jpg',
    type: BannerType.IMAGE,
    isPrimary: true,
    active: true,
    sortIndex: 1,
  };

  const mockBannerModel = {
    new: jest.fn().mockResolvedValue(mockBanner),
    constructor: jest.fn().mockResolvedValue(mockBanner),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    exec: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannersService,
        {
          provide: getModelToken(Banner.name),
          useValue: mockBannerModel,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<BannersService>(BannersService);
    model = module.get<Model<BannerDocument>>(getModelToken(Banner.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new banner successfully', async () => {
      const createBannerDto: CreateBannerDto = {
        title: 'New Banner',
        imageUrl: 'https://example.com/new-banner.jpg',
        type: BannerType.IMAGE,
      };

      const savedBanner = {
        ...createBannerDto,
        _id: '507f1f77bcf86cd799439012',
      };

      const saveMock = jest.fn().mockResolvedValue(savedBanner);
      const mockInstance = { save: saveMock };

      // Temporarily mock the model constructor while preserving other methods
      const originalModel = (service as any).bannerModel;
      const mockConstructor = Object.assign(
        jest.fn().mockReturnValue(mockInstance),
        {
          find: model.find,
          findById: model.findById,
          findByIdAndUpdate: model.findByIdAndUpdate,
          findByIdAndDelete: model.findByIdAndDelete,
          countDocuments: model.countDocuments,
        },
      );
      (service as any).bannerModel = mockConstructor;

      const result = await service.create(createBannerDto);

      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual(savedBanner);

      // Restore original
      (service as any).bannerModel = originalModel;
    });
  });

  describe('findAll', () => {
    it('should return paginated banners', async () => {
      const query: QueryBannersDto = { page: 1, limit: 10 };
      const mockData = [mockBanner];

      const mockExec = jest.fn().mockResolvedValue(mockData);
      const mockSort = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({ exec: mockExec }),
        }),
      });

      jest.spyOn(model, 'find').mockReturnValue({ sort: mockSort } as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValue(1 as never);

      const result = await service.findAll(query);

      expect(result.data).toEqual(mockData);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a banner by id', async () => {
      const mockExec = jest.fn().mockResolvedValue(mockBanner);
      jest.spyOn(model, 'findById').mockReturnValue({ exec: mockExec } as any);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockBanner);
    });

    it('should throw NotFoundException if banner not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      jest.spyOn(model, 'findById').mockReturnValue({ exec: mockExec } as any);

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a banner', async () => {
      const updateBannerDto: UpdateBannerDto = { title: 'Updated Banner' };
      const updatedBanner = { ...mockBanner, ...updateBannerDto };

      const mockExec = jest.fn().mockResolvedValue(updatedBanner);
      jest
        .spyOn(model, 'findByIdAndUpdate')
        .mockReturnValue({ exec: mockExec } as any);

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateBannerDto,
      );

      expect(result).toEqual(updatedBanner);
    });

    it('should throw NotFoundException if banner not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      jest
        .spyOn(model, 'findByIdAndUpdate')
        .mockReturnValue({ exec: mockExec } as any);

      await expect(
        service.update('507f1f77bcf86cd799439011', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a banner', async () => {
      const mockFindByIdExec = jest.fn().mockResolvedValue(mockBanner);
      jest
        .spyOn(model, 'findById')
        .mockReturnValue({ exec: mockFindByIdExec } as any);

      const mockDeleteExec = jest.fn().mockResolvedValue(mockBanner);
      jest
        .spyOn(model, 'findByIdAndDelete')
        .mockReturnValue({ exec: mockDeleteExec } as any);

      await expect(
        service.remove('507f1f77bcf86cd799439011'),
      ).resolves.not.toThrow();

      expect(model.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });

    it('should throw NotFoundException if banner not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      jest.spyOn(model, 'findById').mockReturnValue({ exec: mockExec } as any);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
