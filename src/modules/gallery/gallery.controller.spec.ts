import { Test, TestingModule } from '@nestjs/testing';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto, GalleryCategory } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { QueryGalleryDto } from './dto/query-gallery.dto';
import { StorageService } from '../storage/storage.service';

describe('GalleryController', () => {
  let controller: GalleryController;
  let service: GalleryService;

  const mockGallery = {
    _id: '507f1f77bcf86cd799439011',
    imageUrl: 'https://example.com/image.jpg',
    title: 'Beautiful Nails',
    description: 'Artistic nail design',
    categoryId: '507f1f77bcf86cd799439099',
    category: 'designs',
    price: '$45',
    duration: '60 minutes',
    featured: true,
    isActive: true,
    sortIndex: 1,
  };

  const mockGalleryService = {
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
      controllers: [GalleryController],
      providers: [
        {
          provide: GalleryService,
          useValue: mockGalleryService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    controller = module.get<GalleryController>(GalleryController);
    service = module.get<GalleryService>(GalleryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a gallery item', async () => {
      const createDto: CreateGalleryDto = {
        imageUrl: 'https://example.com/new-image.jpg',
        title: 'Elegant Design',
        description: 'French manicure',
        category: GalleryCategory.NAIL_ART,
        price: '$45',
        duration: '60 minutes',
      };

      mockGalleryService.create.mockResolvedValue({
        ...createDto,
        _id: '507f1f77bcf86cd799439012',
      });

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated gallery items', async () => {
      const query: QueryGalleryDto = { page: 1, limit: 10 };
      const expected = {
        data: [mockGallery],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockGalleryService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(result).toEqual(expected);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a single gallery item', async () => {
      mockGalleryService.findOne.mockResolvedValue(mockGallery);

      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockGallery);
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('update', () => {
    it('should update a gallery item', async () => {
      const updateDto: UpdateGalleryDto = { title: 'Updated Title' };
      const updatedGallery = { ...mockGallery, ...updateDto };

      mockGalleryService.update.mockResolvedValue(updatedGallery);

      const result = await controller.update(
        '507f1f77bcf86cd799439011',
        updateDto,
      );

      expect(result).toEqual(updatedGallery);
      expect(service.update).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete a gallery item', async () => {
      mockGalleryService.remove.mockResolvedValue(undefined);

      await controller.remove('507f1f77bcf86cd799439011');

      expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
