import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Banner, BannerDocument } from './schemas/banner.schema';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { QueryBannersDto } from './dto/query-banners.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name)
    private readonly bannerModel: Model<BannerDocument>,
    private readonly storageService: StorageService,
  ) {}

  async create(createBannerDto: CreateBannerDto): Promise<Banner> {
    const banner = new this.bannerModel(createBannerDto);
    return banner.save();
  }

  async findAll(query: QueryBannersDto) {
    const { type, isPrimary, active, page = 1, limit = 10 } = query;

    const filter: any = {};
    if (type) filter.type = type;
    if (isPrimary !== undefined) filter.isPrimary = isPrimary;
    if (active !== undefined) filter.active = active;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.bannerModel
        .find(filter)
        .sort({ sortIndex: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.bannerModel.countDocuments(filter),
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

  async findOne(id: string): Promise<Banner> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid banner ID');
    }

    const banner = await this.bannerModel.findById(id).exec();

    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }

    return banner;
  }

  async update(id: string, updateBannerDto: UpdateBannerDto): Promise<Banner> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid banner ID');
    }

    const banner = await this.bannerModel
      .findByIdAndUpdate(id, updateBannerDto, { new: true })
      .exec();

    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }

    return banner;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid banner ID');
    }

    const banner = await this.bannerModel.findById(id).exec();

    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }

    // Delete image from Cloudinary if it exists and is a Cloudinary URL
    if (banner.imageUrl?.includes('res.cloudinary.com')) {
      try {
        await this.storageService.deleteFile(banner.imageUrl);
      } catch (error) {
        console.warn(`Failed to delete image from storage: ${error.message}`);
      }
    }

    // Delete video from Cloudinary if it exists and is a Cloudinary URL
    if (banner.videoUrl?.includes('res.cloudinary.com')) {
      try {
        await this.storageService.deleteFile(banner.videoUrl);
      } catch (error) {
        console.warn(`Failed to delete video from storage: ${error.message}`);
      }
    }

    await this.bannerModel.findByIdAndDelete(id).exec();
  }
}
