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
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { QueryBannersDto } from './dto/query-banners.dto';
import { UploadBannerDto } from './dto/upload-banner.dto';
import { StorageService } from '../storage/storage.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(
    private readonly bannersService: BannersService,
    private readonly storageService: StorageService,
  ) {}

  @Post('upload/image')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new banner with image upload' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image', 'title', 'type'],
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Banner image file (max 5MB, jpg/jpeg/png/webp)',
        },
        title: { type: 'string', example: 'Welcome to Our Nail Salon' },
        type: { type: 'string', enum: ['image', 'video'], example: 'image' },
        isPrimary: { type: 'boolean', example: false },
        active: { type: 'boolean', example: true },
        sortIndex: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Banner successfully created with uploaded image',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 413, description: 'File too large (max 5MB)' })
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() uploadBannerDto: UploadBannerDto,
  ) {
    const imageUrl = await this.storageService.uploadFile(file, 'banners');
    return this.bannersService.create({ ...uploadBannerDto, imageUrl });
  }

  @Post('upload/video')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('video'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new banner with video upload' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['video', 'title', 'type'],
      properties: {
        video: {
          type: 'string',
          format: 'binary',
          description: 'Banner video file (max 20MB, mp4/webm)',
        },
        title: { type: 'string', example: 'Welcome Video' },
        type: { type: 'string', enum: ['image', 'video'], example: 'video' },
        isPrimary: { type: 'boolean', example: false },
        active: { type: 'boolean', example: true },
        sortIndex: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Banner successfully created with uploaded video',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 413, description: 'File too large (max 20MB)' })
  async uploadVideo(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }), // 20MB
          new FileTypeValidator({ fileType: /(mp4|webm)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() uploadBannerDto: UploadBannerDto,
  ) {
    const videoUrl = await this.storageService.uploadFile(file, 'banners');
    // For video banners, we need a placeholder imageUrl (could be a thumbnail)
    return this.bannersService.create({
      ...uploadBannerDto,
      imageUrl: videoUrl, // Using video URL as imageUrl for now
      videoUrl,
    });
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a banner with existing URLs' })
  @ApiResponse({ status: 201, description: 'Banner successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createBannerDto: CreateBannerDto) {
    return this.bannersService.create(createBannerDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all banners with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'List of banners retrieved successfully',
  })
  async findAll(@Query() query: QueryBannersDto) {
    return this.bannersService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a banner by ID' })
  @ApiResponse({
    status: 200,
    description: 'Banner details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  async findOne(@Param('id') id: string) {
    return this.bannersService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a banner by ID' })
  @ApiResponse({ status: 200, description: 'Banner successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  async update(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateBannerDto,
  ) {
    return this.bannersService.update(id, updateBannerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a banner by ID' })
  @ApiResponse({ status: 204, description: 'Banner successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  async remove(@Param('id') id: string) {
    return this.bannersService.remove(id);
  }
}
