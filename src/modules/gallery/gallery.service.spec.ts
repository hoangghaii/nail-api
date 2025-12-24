import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { Gallery, GalleryDocument } from './schemas/gallery.schema';
import { CreateGalleryDto, GalleryCategory } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { QueryGalleryDto } from './dto/query-gallery.dto';
import { StorageService } from '../storage/storage.service';
import { GalleryCategoryService } from '../gallery-category/gallery-category.service';

describe('GalleryService', () => {
  let service: GalleryService;
  let model: Model<GalleryDocument>;

  const mockGallery = {
    _id: '507f1f77bcf86cd799439011',
    imageUrl: 'https://example.com/image.jpg',
    title: 'Beautiful Nails',
    description: 'Artistic nail design',
    categoryId: '507f1f77bcf86cd799439099',
    category: GalleryCategory.NAIL_ART,
    price: '$45',
    duration: '60 minutes',
    featured: true,
    isActive: true,
    sortIndex: 1,
  };

  const mockAllCategory = {
    _id: '507f1f77bcf86cd799439099',
    name: 'All',
    slug: 'all',
    description: 'All designs',
  };

  const mockCategory = {
    _id: '507f1f77bcf86cd799439098',
    name: 'Nail Art',
    slug: 'nail-art',
    description: 'Nail art designs',
  };

  const mockGalleryModel = {
    new: jest.fn(),
    constructor: jest.fn(),
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

  const mockGalleryCategoryService = {
    findBySlug: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GalleryService,
        {
          provide: getModelToken(Gallery.name),
          useValue: mockGalleryModel,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: GalleryCategoryService,
          useValue: mockGalleryCategoryService,
        },
      ],
    }).compile();

    service = module.get<GalleryService>(GalleryService);
    model = module.get<Model<GalleryDocument>>(getModelToken(Gallery.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a gallery item with auto-assigned "all" category', async () => {
      const createDto: CreateGalleryDto = {
        imageUrl: 'https://example.com/new-image.jpg',
        title: 'Elegant Design',
        description: 'French manicure',
        price: '$45',
        duration: '60 minutes',
      };

      const savedGallery = {
        ...createDto,
        _id: '507f1f77bcf86cd799439012',
        categoryId: mockAllCategory._id,
      };

      mockGalleryCategoryService.findBySlug.mockResolvedValue(mockAllCategory);

      const saveMock = jest.fn().mockResolvedValue(savedGallery);
      const mockInstance = {
        save: saveMock,
      };

      // Create a constructor function with findById method
      const mockConstructor: any = function (dto: any) {
        return mockInstance;
      };
      mockConstructor.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            ...savedGallery,
            categoryId: mockAllCategory,
          }),
        }),
      });

      (service as any).galleryModel = mockConstructor;

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockGalleryCategoryService.findBySlug).toHaveBeenCalledWith('all');
      expect(saveMock).toHaveBeenCalled();
    });

    it('should create a gallery item with explicit categoryId', async () => {
      const createDto: CreateGalleryDto = {
        imageUrl: 'https://example.com/new-image.jpg',
        title: 'Elegant Design',
        description: 'French manicure',
        categoryId: mockCategory._id,
        price: '$45',
        duration: '60 minutes',
      };

      const savedGallery = {
        ...createDto,
        _id: '507f1f77bcf86cd799439012',
      };

      mockGalleryCategoryService.findOne.mockResolvedValue(mockCategory);

      const saveMock = jest.fn().mockResolvedValue(savedGallery);
      const mockInstance = {
        save: saveMock,
      };

      // Create a constructor function with findById method
      const mockConstructor: any = function (dto: any) {
        return mockInstance;
      };
      mockConstructor.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            ...savedGallery,
            categoryId: mockCategory,
          }),
        }),
      });

      (service as any).galleryModel = mockConstructor;

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockGalleryCategoryService.findOne).toHaveBeenCalledWith(
        mockCategory._id,
      );
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated gallery items', async () => {
      const query: QueryGalleryDto = { page: 1, limit: 10 };
      const galleryItems = [mockGallery];

      const findChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(galleryItems),
      };

      jest.spyOn(model, 'find').mockReturnValue(findChain as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValueOnce(1 as never);

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: galleryItems,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should filter by category', async () => {
      const query: QueryGalleryDto = {
        category: GalleryCategory.NAIL_ART,
        page: 1,
        limit: 10,
      };

      const findChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockGallery]),
      };

      jest.spyOn(model, 'find').mockReturnValue(findChain as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValueOnce(1 as never);

      const result = await service.findAll(query);

      expect(model.find).toHaveBeenCalledWith({ category: 'nail-art' });
      expect(result.data).toHaveLength(1);
    });

    it('should filter by featured status', async () => {
      const query: QueryGalleryDto = { featured: true, page: 1, limit: 10 };

      const findChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockGallery]),
      };

      jest.spyOn(model, 'find').mockReturnValue(findChain as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValueOnce(1 as never);

      await service.findAll(query);

      expect(model.find).toHaveBeenCalledWith({ featured: true });
    });

    it('should filter by isActive status', async () => {
      const query: QueryGalleryDto = { isActive: true, page: 1, limit: 10 };

      const findChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockGallery]),
      };

      jest.spyOn(model, 'find').mockReturnValue(findChain as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValueOnce(1 as never);

      await service.findAll(query);

      expect(model.find).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe('findOne', () => {
    it('should return a gallery item by id', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGallery),
        }),
      } as any);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockGallery);
      expect(model.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if gallery item not found', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      } as any);

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a gallery item successfully', async () => {
      const updateDto: UpdateGalleryDto = { title: 'Updated Title' };
      const updatedGallery = { ...mockGallery, ...updateDto };

      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedGallery),
        }),
      } as any);

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateDto,
      );

      expect(result).toEqual(updatedGallery);
    });

    it('should update with categoryId validation', async () => {
      const updateDto: UpdateGalleryDto = { categoryId: mockCategory._id };
      const updatedGallery = { ...mockGallery, categoryId: mockCategory._id };

      mockGalleryCategoryService.findOne.mockResolvedValue(mockCategory);

      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedGallery),
        }),
      } as any);

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateDto,
      );

      expect(result).toEqual(updatedGallery);
      expect(mockGalleryCategoryService.findOne).toHaveBeenCalledWith(
        mockCategory._id,
      );
    });

    it('should throw NotFoundException if gallery item not found', async () => {
      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      } as any);

      await expect(
        service.update('507f1f77bcf86cd799439011', { title: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a gallery item successfully', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockGallery),
      } as any);
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockGallery),
      } as any);

      await service.remove('507f1f77bcf86cd799439011');

      expect(model.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });

    it('should throw NotFoundException if gallery item not found', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
