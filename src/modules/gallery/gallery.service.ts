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

@Injectable()
export class GalleryService {
  constructor(
    @InjectModel(Gallery.name)
    private readonly galleryModel: Model<GalleryDocument>,
    private readonly storageService: StorageService,
  ) {}

  async create(createGalleryDto: CreateGalleryDto): Promise<Gallery> {
    const gallery = new this.galleryModel(createGalleryDto);
    return gallery.save();
  }

  async findAll(query: QueryGalleryDto) {
    const { category, featured, isActive, page = 1, limit = 10 } = query;

    const filter: any = {};
    if (category) filter.category = category;
    if (featured !== undefined) filter.featured = featured;
    if (isActive !== undefined) filter.isActive = isActive;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.galleryModel
        .find(filter)
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

    const gallery = await this.galleryModel.findById(id).exec();

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

    const gallery = await this.galleryModel
      .findByIdAndUpdate(id, updateGalleryDto, { new: true })
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
