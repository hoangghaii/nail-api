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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GalleryCategoryService } from './gallery-category.service';
import { CreateGalleryCategoryDto } from './dto/create-gallery-category.dto';
import { UpdateGalleryCategoryDto } from './dto/update-gallery-category.dto';
import { QueryGalleryCategoryDto } from './dto/query-gallery-category.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Gallery Categories')
@Controller('gallery-categories')
export class GalleryCategoryController {
  constructor(
    private readonly galleryCategoryService: GalleryCategoryService,
  ) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new gallery category (Admin)' })
  @ApiResponse({
    status: 201,
    description: 'Category successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 409,
    description: 'Category name/slug already exists',
  })
  async create(@Body() createDto: CreateGalleryCategoryDto) {
    return this.galleryCategoryService.create(createDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all gallery categories with filters' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async findAll(@Query() query: QueryGalleryCategoryDto) {
    return this.galleryCategoryService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get gallery category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string) {
    return this.galleryCategoryService.findOne(id);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get gallery category by slug' })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.galleryCategoryService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update gallery category (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Category successfully updated',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({
    status: 409,
    description: 'Category name/slug already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateGalleryCategoryDto,
  ) {
    return this.galleryCategoryService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete gallery category (Admin)' })
  @ApiResponse({
    status: 204,
    description: 'Category successfully deleted',
  })
  @ApiResponse({ status: 400, description: 'Cannot delete: protection rules' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id') id: string) {
    return this.galleryCategoryService.remove(id);
  }
}
