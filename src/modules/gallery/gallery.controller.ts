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
import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { QueryGalleryDto } from './dto/query-gallery.dto';
import { UploadGalleryDto } from './dto/upload-gallery.dto';
import { StorageService } from '../storage/storage.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Gallery')
@Controller('gallery')
export class GalleryController {
  constructor(
    private readonly galleryService: GalleryService,
    private readonly storageService: StorageService,
  ) {}

  @Post('upload')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new gallery image with file' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image', 'title', 'category'],
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (max 5MB, jpg/jpeg/png/webp)',
        },
        title: { type: 'string', example: 'Summer Floral Design' },
        description: {
          type: 'string',
          example: 'Beautiful floral nail art design',
        },
        category: {
          type: 'string',
          enum: [
            'all',
            'extensions',
            'manicure',
            'nail-art',
            'pedicure',
            'seasonal',
          ],
          example: 'nail-art',
        },
        price: { type: 'string', example: '$45' },
        duration: { type: 'string', example: '60 minutes' },
        featured: { type: 'boolean', example: false },
        isActive: { type: 'boolean', example: true },
        sortIndex: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Gallery item successfully created with uploaded image',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 413, description: 'File too large (max 5MB)' })
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() uploadGalleryDto: UploadGalleryDto,
  ) {
    const imageUrl = await this.storageService.uploadFile(file, 'gallery');
    return this.galleryService.create({ ...uploadGalleryDto, imageUrl });
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a gallery item with existing image URL' })
  @ApiResponse({
    status: 201,
    description: 'Gallery item successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createGalleryDto: CreateGalleryDto) {
    return this.galleryService.create(createGalleryDto);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all gallery items with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of gallery items retrieved successfully',
  })
  async findAll(@Query() query: QueryGalleryDto) {
    return this.galleryService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a gallery item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Gallery item details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Gallery item not found' })
  async findOne(@Param('id') id: string) {
    return this.galleryService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a gallery item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Gallery item successfully updated',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Gallery item not found' })
  async update(
    @Param('id') id: string,
    @Body() updateGalleryDto: UpdateGalleryDto,
  ) {
    return this.galleryService.update(id, updateGalleryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a gallery item by ID' })
  @ApiResponse({
    status: 204,
    description: 'Gallery item successfully deleted',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Gallery item not found' })
  async remove(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }
}
