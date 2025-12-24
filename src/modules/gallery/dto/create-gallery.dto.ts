import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GalleryCategory {
  ALL = 'all',
  EXTENSIONS = 'extensions',
  MANICURE = 'manicure',
  NAIL_ART = 'nail-art',
  PEDICURE = 'pedicure',
  SEASONAL = 'seasonal',
}

export class CreateGalleryDto {
  @ApiProperty({
    description: 'Image URL for the gallery item',
    example: 'https://example.com/images/nail-art-sample.jpg',
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({
    description: 'Title of the gallery item',
    example: 'Summer Floral Design',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the gallery item',
    example: 'Beautiful floral nail art design perfect for summer',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Gallery category ID (defaults to "all" category if not provided)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'DEPRECATED: Use categoryId instead. Gallery category enum',
    enum: GalleryCategory,
    example: GalleryCategory.NAIL_ART,
    deprecated: true,
  })
  @IsEnum(GalleryCategory)
  @IsOptional()
  category?: GalleryCategory;

  @ApiProperty({
    description: 'Price for this design',
    example: '$45',
  })
  @IsString()
  @IsNotEmpty()
  price: string;

  @ApiProperty({
    description: 'Duration for this design',
    example: '60 minutes',
  })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiPropertyOptional({
    description: 'Whether the gallery item is featured',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the gallery item is active and visible',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sort index for ordering gallery items',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  sortIndex?: number;
}
