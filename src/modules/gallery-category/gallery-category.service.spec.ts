import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { GalleryCategoryService } from './gallery-category.service';
import { GalleryCategory } from './schemas/gallery-category.schema';

describe('GalleryCategoryService', () => {
  let service: GalleryCategoryService;
  let model: Model<GalleryCategory>;
  let galleryModel: Model<any>;

  const mockCategory = {
    _id: new Types.ObjectId(),
    name: 'Nail Art',
    slug: 'nail-art',
    description: 'Creative designs',
    sortIndex: 1,
    isActive: true,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ ...mockCategory, ...dto }),
  }));

  mockModel.find = jest.fn();
  mockModel.findById = jest.fn();
  mockModel.findOne = jest.fn();
  mockModel.findByIdAndUpdate = jest.fn();
  mockModel.findByIdAndDelete = jest.fn();
  mockModel.countDocuments = jest.fn();

  const mockGalleryModel = {
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GalleryCategoryService,
        {
          provide: getModelToken(GalleryCategory.name),
          useValue: mockModel,
        },
        {
          provide: getModelToken('Gallery'),
          useValue: mockGalleryModel,
        },
      ],
    }).compile();

    service = module.get<GalleryCategoryService>(GalleryCategoryService);
    model = module.get<Model<GalleryCategory>>(
      getModelToken(GalleryCategory.name),
    );
    galleryModel = module.get<Model<any>>(getModelToken('Gallery'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSlug', () => {
    it('should convert name to lowercase slug', () => {
      expect(service.generateSlug('Nail Art')).toBe('nail-art');
    });

    it('should replace spaces with hyphens', () => {
      expect(service.generateSlug('Beautiful Nail Art')).toBe(
        'beautiful-nail-art',
      );
    });

    it('should handle special characters', () => {
      expect(service.generateSlug('Art & Design!')).toBe('art-design');
    });

    it('should collapse multiple hyphens', () => {
      expect(service.generateSlug('Nail  -  Art')).toBe('nail-art');
    });

    it('should trim leading and trailing hyphens', () => {
      expect(service.generateSlug('  -Nail Art-  ')).toBe('nail-art');
    });

    it('should handle unicode characters', () => {
      expect(service.generateSlug('Café Nail')).toBe('caf-nail');
    });
  });

  describe('create', () => {
    it('should create a category with auto-generated slug', async () => {
      const dto = { name: 'Nail Art' };
      const savedCategory = { ...mockCategory, ...dto, slug: 'nail-art' };

      (model as any).mockImplementationOnce((data: any) => ({
        save: jest.fn().mockResolvedValue(savedCategory),
      }));

      const result = await service.create(dto);

      expect(result).toEqual(savedCategory);
    });

    it('should create a category with provided slug', async () => {
      const dto = { name: 'Nail Art', slug: 'custom-slug' };
      const savedCategory = { ...mockCategory, ...dto };

      (model as any).mockImplementationOnce((data: any) => ({
        save: jest.fn().mockResolvedValue(savedCategory),
      }));

      const result = await service.create(dto);

      expect(result).toEqual(savedCategory);
    });

    it('should throw ConflictException on duplicate name', async () => {
      const dto = { name: 'Nail Art' };
      const error: any = { code: 11000, keyPattern: { name: 1 } };

      (model as any).mockImplementationOnce((data: any) => ({
        save: jest.fn().mockRejectedValue(error),
      }));

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on duplicate slug', async () => {
      const dto = { name: 'Nail Art', slug: 'existing-slug' };
      const error: any = { code: 11000, keyPattern: { slug: 1 } };

      (model as any).mockImplementationOnce((data: any) => ({
        save: jest.fn().mockRejectedValue(error),
      }));

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      const mockCategories = [mockCategory];
      const query = { page: 1, limit: 100 };

      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCategories),
      });
      mockModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result.data).toEqual(mockCategories);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(100);
    });

    it('should filter by isActive', async () => {
      const query = { isActive: true, page: 1, limit: 100 };

      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      mockModel.countDocuments.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockModel.find).toHaveBeenCalledWith({ isActive: true });
    });

    it('should search by name and slug', async () => {
      const query = { search: 'nail', page: 1, limit: 100 };

      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      mockModel.countDocuments.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'nail', $options: 'i' } },
          { slug: { $regex: 'nail', $options: 'i' } },
        ],
      });
    });
  });

  describe('findOne', () => {
    it('should return a category by ID', async () => {
      const id = new Types.ObjectId().toString();

      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      });

      const result = await service.findOne(id);

      expect(result).toEqual(mockCategory);
      expect(mockModel.findById).toHaveBeenCalledWith(id);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when category not found', async () => {
      const id = new Types.ObjectId().toString();

      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return a category by slug', async () => {
      const slug = 'nail-art';

      mockModel.findOne.mockReturnValue({
        collation: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCategory),
      });

      const result = await service.findBySlug(slug);

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when slug not found', async () => {
      mockModel.findOne.mockReturnValue({
        collation: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const id = new Types.ObjectId().toString();
      const dto = { name: 'Updated Name' };
      const updated = { ...mockCategory, ...dto, slug: 'updated-name' };

      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      });

      const result = await service.update(id, dto);

      expect(result).toEqual(updated);
    });

    it('should regenerate slug when name is updated', async () => {
      const id = new Types.ObjectId().toString();
      const dto = { name: 'New Name' };

      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      });

      await service.update(id, dto);

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { name: 'New Name', slug: 'new-name' },
        { new: true },
      );
    });

    it('should throw BadRequestException for invalid ID', async () => {
      await expect(service.update('invalid-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when category not found', async () => {
      const id = new Types.ObjectId().toString();

      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update(id, {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate update', async () => {
      const id = new Types.ObjectId().toString();
      const dto = { name: 'Duplicate' };
      const error: any = { code: 11000, keyPattern: { name: 1 } };

      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockRejectedValue(error),
      });

      await expect(service.update(id, dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      const id = new Types.ObjectId().toString();
      const category = { ...mockCategory, slug: 'deletable' };

      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(category),
      });
      mockGalleryModel.countDocuments.mockResolvedValue(0);
      mockModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(category),
      });

      await service.remove(id);

      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(id);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      await expect(service.remove('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when category not found', async () => {
      const id = new Types.ObjectId().toString();

      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when deleting "all" category', async () => {
      const id = new Types.ObjectId().toString();
      const category = { ...mockCategory, slug: 'all' };

      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(category),
      });

      await expect(service.remove(id)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when galleries reference category', async () => {
      const id = new Types.ObjectId().toString();
      const category = { ...mockCategory, slug: 'referenced' };

      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(category),
      });
      mockGalleryModel.countDocuments.mockResolvedValue(5);

      await expect(service.remove(id)).rejects.toThrow(BadRequestException);
    });
  });
});
