import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  GalleryCategory,
  GalleryCategoryDocument,
} from './schemas/gallery-category.schema';
import { CreateGalleryCategoryDto } from './dto/create-gallery-category.dto';
import { UpdateGalleryCategoryDto } from './dto/update-gallery-category.dto';
import { QueryGalleryCategoryDto } from './dto/query-gallery-category.dto';

@Injectable()
export class GalleryCategoryService {
  constructor(
    @InjectModel(GalleryCategory.name)
    private readonly galleryCategoryModel: Model<GalleryCategoryDocument>,
    @InjectModel('Gallery')
    private readonly galleryModel: Model<any>,
  ) {}

  /**
   * Generate URL-safe slug from category name
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^\w\-]+/g, '') // Remove non-word chars except hyphens
      .replace(/\-\-+/g, '-') // Collapse multiple hyphens
      .replace(/^-+/, '') // Trim leading hyphens
      .replace(/-+$/, ''); // Trim trailing hyphens
  }

  async create(createDto: CreateGalleryCategoryDto): Promise<GalleryCategory> {
    // Generate slug if not provided
    const slug = createDto.slug || this.generateSlug(createDto.name);

    try {
      const category = new this.galleryCategoryModel({
        ...createDto,
        slug,
      });
      return await category.save();
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(
          `Category with this ${field} already exists (case-insensitive)`,
        );
      }
      throw error;
    }
  }

  async findAll(query: QueryGalleryCategoryDto) {
    const { isActive, search, page = 1, limit = 100 } = query;

    const filter: any = {};
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.galleryCategoryModel
        .find(filter)
        .sort({ sortIndex: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.galleryCategoryModel.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<GalleryCategory> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.galleryCategoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findBySlug(slug: string): Promise<GalleryCategory> {
    const category = await this.galleryCategoryModel
      .findOne({ slug })
      .collation({ locale: 'en', strength: 2 })
      .exec();

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateDto: UpdateGalleryCategoryDto,
  ): Promise<GalleryCategory> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    // Re-generate slug if name changed
    const updateData: any = { ...updateDto };
    if (updateDto.name) {
      updateData.slug = this.generateSlug(updateDto.name);
    }

    try {
      const category = await this.galleryCategoryModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return category;
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(
          `Category with this ${field} already exists (case-insensitive)`,
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.galleryCategoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Prevent deletion of 'all' category
    if (category.slug === 'all') {
      throw new BadRequestException(
        'Cannot delete the "all" category (system default)',
      );
    }

    // Check if galleries reference this category
    const referencedCount = await this.galleryModel.countDocuments({
      categoryId: category._id,
    });

    if (referencedCount > 0) {
      throw new BadRequestException(
        `Cannot delete category: ${referencedCount} gallery item(s) reference this category`,
      );
    }

    await this.galleryCategoryModel.findByIdAndDelete(id).exec();
  }
}
