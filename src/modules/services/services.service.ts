import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly storageService: StorageService,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const existingService = await this.serviceModel.findOne({
      name: createServiceDto.name,
    });

    if (existingService) {
      throw new ConflictException('Service with this name already exists');
    }

    const service = new this.serviceModel(createServiceDto);
    return service.save();
  }

  async findAll(query: QueryServicesDto) {
    const { category, featured, isActive, page = 1, limit = 10 } = query;

    const filter: any = {};
    if (category) filter.category = category;
    if (featured !== undefined) filter.featured = featured;
    if (isActive !== undefined) filter.isActive = isActive;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.serviceModel
        .find(filter)
        .sort({ sortIndex: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.serviceModel.countDocuments(filter),
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

  async findOne(id: string): Promise<Service> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid service ID');
    }

    const service = await this.serviceModel.findById(id).exec();

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid service ID');
    }

    const service = await this.serviceModel
      .findByIdAndUpdate(id, updateServiceDto, { new: true })
      .exec();

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid service ID');
    }

    const service = await this.serviceModel.findById(id).exec();

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // Delete image from Cloudinary if it exists and is a Cloudinary URL
    if (service.imageUrl?.includes('res.cloudinary.com')) {
      try {
        await this.storageService.deleteFile(service.imageUrl);
      } catch (error) {
        // Log error but continue with deletion
        console.warn(`Failed to delete image from storage: ${error.message}`);
      }
    }

    await this.serviceModel.findByIdAndDelete(id).exec();
  }
}
