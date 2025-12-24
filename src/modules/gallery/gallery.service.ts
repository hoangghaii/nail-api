import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Gallery, GalleryDocument } from './schemas/gallery.schema';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { QueryGalleryDto } from './dto/query-gallery.dto';
import { StorageService } from '../storage/storage.service';
import { GalleryCategoryService } from '../gallery-category/gallery-category.service';

@Injectable()
export class GalleryService {
  constructor(
    @InjectModel(Gallery.name)
    private readonly galleryModel: Model<GalleryDocument>,
    private readonly storageService: StorageService,
    private readonly galleryCategoryService: GalleryCategoryService,
  ) {}

  async create(createGalleryDto: CreateGalleryDto): Promise<Gallery> {
    let categoryId = createGalleryDto.categoryId;

    // Auto-assign 'all' category if not provided
    if (!categoryId) {
      const allCategory = await this.galleryCategoryService.findBySlug('all');
      categoryId = allCategory._id.toString();
    } else {
      // Validate categoryId exists
      await this.galleryCategoryService.findOne(categoryId);
    }

    const gallery = new this.galleryModel({
      ...createGalleryDto,
      categoryId: new Types.ObjectId(categoryId),
    });

    const saved = await gallery.save();
    const populated = await this.galleryModel
      .findById(saved._id)
      .populate('categoryId', 'name slug description')
      .exec();

    return populated!;
  }

  async findAll(query: QueryGalleryDto) {
    const {
      categoryId,
      category,
      featured,
      isActive,
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {};

    // NEW: Filter by categoryId
    if (categoryId) {
      if (!Types.ObjectId.isValid(categoryId)) {
        throw new BadRequestException('Invalid category ID');
      }
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    // DEPRECATED: Filter by category string (backward compat)
    if (category) {
      filter.category = category;
    }

    if (featured !== undefined) filter.featured = featured;
    if (isActive !== undefined) filter.isActive = isActive;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.galleryModel
        .find(filter)
        .populate('categoryId', 'name slug description')
        .sort({ sortIndex: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.galleryModel.countDocuments(filter),
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

  async findOne(id: string): Promise<Gallery> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid gallery ID');
    }

    const gallery = await this.galleryModel
      .findById(id)
      .populate('categoryId', 'name slug description')
      .exec();

    if (!gallery) {
      throw new NotFoundException(`Gallery item with ID ${id} not found`);
    }

    return gallery;
  }

  async update(
    id: string,
    updateGalleryDto: UpdateGalleryDto,
  ): Promise<Gallery> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid gallery ID');
    }

    // Validate categoryId if provided
    const updateData: any = { ...updateGalleryDto };
    if (updateGalleryDto.categoryId) {
      await this.galleryCategoryService.findOne(updateGalleryDto.categoryId);
      updateData.categoryId = new Types.ObjectId(updateGalleryDto.categoryId);
    }

    const gallery = await this.galleryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('categoryId', 'name slug description')
      .exec();

    if (!gallery) {
      throw new NotFoundException(`Gallery item with ID ${id} not found`);
    }

    return gallery;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid gallery ID');
    }

    const gallery = await this.galleryModel.findById(id).exec();

    if (!gallery) {
      throw new NotFoundException(`Gallery item with ID ${id} not found`);
    }

    // Delete image from Cloudinary if it exists and is a Cloudinary URL
    if (gallery.imageUrl?.includes('res.cloudinary.com')) {
      try {
        await this.storageService.deleteFile(gallery.imageUrl);
      } catch (error) {
        // Log error but continue with deletion
        console.warn(`Failed to delete image from storage: ${error.message}`);
      }
    }

    await this.galleryModel.findByIdAndDelete(id).exec();
  }
}
