import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';
import { UploadServiceDto } from './dto/upload-service.dto';
import { StorageService } from '../storage/storage.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly storageService: StorageService,
  ) {}

  @Post('upload')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new service with file upload' })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'image',
        'name',
        'description',
        'price',
        'duration',
        'category',
      ],
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Service image file (max 10MB, jpg/jpeg/png/webp)',
        },
        name: { type: 'string', example: 'Classic Manicure' },
        description: {
          type: 'string',
          example: 'Professional nail care with shaping and polish',
        },
        price: { type: 'number', example: 25.99 },
        duration: { type: 'number', example: 45 },
        category: {
          type: 'string',
          enum: ['extensions', 'manicure', 'nail-art', 'pedicure', 'spa'],
          example: 'manicure',
        },
        featured: { type: 'boolean', example: false },
        isActive: { type: 'boolean', example: true },
        sortIndex: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Service successfully created with uploaded image',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 413, description: 'File too large (max 10MB)' })
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() uploadServiceDto: UploadServiceDto,
  ) {
    const imageUrl = await this.storageService.uploadFile(file, 'services');
    return this.servicesService.create({ ...uploadServiceDto, imageUrl });
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a service with existing image URL' })
  @ApiResponse({ status: 201, description: 'Service successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all services with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'List of services retrieved successfully',
  })
  async findAll(@Query() query: QueryServicesDto) {
    return this.servicesService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a service by ID' })
  @ApiResponse({ status: 200, description: 'Service successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a service by ID' })
  @ApiResponse({ status: 204, description: 'Service successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
