import { Test, TestingModule } from '@nestjs/testing';
import { GalleryCategoryController } from './gallery-category.controller';
import { GalleryCategoryService } from './gallery-category.service';
import { CreateGalleryCategoryDto } from './dto/create-gallery-category.dto';
import { UpdateGalleryCategoryDto } from './dto/update-gallery-category.dto';
import { QueryGalleryCategoryDto } from './dto/query-gallery-category.dto';

describe('GalleryCategoryController', () => {
  let controller: GalleryCategoryController;
  let service: GalleryCategoryService;

  const mockCategory = {
    _id: 'category-id',
    name: 'Nail Art',
    slug: 'nail-art',
    description: 'Creative designs',
    sortIndex: 1,
    isActive: true,
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findBySlug: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GalleryCategoryController],
      providers: [
        {
          provide: GalleryCategoryService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<GalleryCategoryController>(
      GalleryCategoryController,
    );
    service = module.get<GalleryCategoryService>(GalleryCategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto: CreateGalleryCategoryDto = {
        name: 'Nail Art',
        description: 'Creative designs',
      };

      mockService.create.mockResolvedValue(mockCategory);

      const result = await controller.create(dto);

      expect(result).toEqual(mockCategory);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      const query: QueryGalleryCategoryDto = { page: 1, limit: 100 };
      const paginatedResult = {
        data: [mockCategory],
        pagination: {
          total: 1,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      };

      mockService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(paginatedResult);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should handle filters', async () => {
      const query: QueryGalleryCategoryDto = {
        isActive: true,
        search: 'nail',
        page: 1,
        limit: 50,
      };

      mockService.findAll.mockResolvedValue({ data: [], pagination: {} });

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a category by ID', async () => {
      const id = 'category-id';

      mockService.findOne.mockResolvedValue(mockCategory);

      const result = await controller.findOne(id);

      expect(result).toEqual(mockCategory);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('findBySlug', () => {
    it('should return a category by slug', async () => {
      const slug = 'nail-art';

      mockService.findBySlug.mockResolvedValue(mockCategory);

      const result = await controller.findBySlug(slug);

      expect(result).toEqual(mockCategory);
      expect(service.findBySlug).toHaveBeenCalledWith(slug);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const id = 'category-id';
      const dto: UpdateGalleryCategoryDto = {
        name: 'Updated Name',
      };
      const updated = { ...mockCategory, name: 'Updated Name' };

      mockService.update.mockResolvedValue(updated);

      const result = await controller.update(id, dto);

      expect(result).toEqual(updated);
      expect(service.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      const id = 'category-id';

      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
