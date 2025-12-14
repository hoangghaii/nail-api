import { Test, TestingModule } from '@nestjs/testing';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { CreateBannerDto, BannerType } from './dto/create-banner.dto';
import { StorageService } from '../storage/storage.service';

describe('BannersController', () => {
  let controller: BannersController;
  let service: BannersService;

  const mockBannersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BannersController],
      providers: [
        {
          provide: BannersService,
          useValue: mockBannersService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    controller = module.get<BannersController>(BannersController);
    service = module.get<BannersService>(BannersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a banner', async () => {
      const createBannerDto: CreateBannerDto = {
        title: 'Test Banner',
        imageUrl: 'https://example.com/banner.jpg',
        type: BannerType.IMAGE,
      };
      const result = { id: '1', ...createBannerDto };

      jest.spyOn(service, 'create').mockResolvedValue(result as any);

      expect(await controller.create(createBannerDto)).toBe(result);
      expect(service.create).toHaveBeenCalledWith(createBannerDto);
    });
  });

  describe('findAll', () => {
    it('should return all banners', async () => {
      const result = { data: [], pagination: {} };
      jest.spyOn(service, 'findAll').mockResolvedValue(result as any);

      expect(await controller.findAll({})).toBe(result);
    });
  });

  describe('findOne', () => {
    it('should return a single banner', async () => {
      const result = { id: '1', title: 'Test' };
      jest.spyOn(service, 'findOne').mockResolvedValue(result as any);

      expect(await controller.findOne('1')).toBe(result);
    });
  });

  describe('update', () => {
    it('should update a banner', async () => {
      const updateDto = { title: 'Updated' };
      const result = { id: '1', ...updateDto };

      jest.spyOn(service, 'update').mockResolvedValue(result as any);

      expect(await controller.update('1', updateDto)).toBe(result);
    });
  });

  describe('remove', () => {
    it('should remove a banner', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await expect(controller.remove('1')).resolves.toBeUndefined();
    });
  });
});
