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
import { GalleryCategory } from './create-gallery.dto';

export class UploadGalleryDto {
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

  @ApiProperty({
    description: 'Gallery category',
    enum: GalleryCategory,
    example: GalleryCategory.NAIL_ART,
  })
  @IsEnum(GalleryCategory)
  @IsNotEmpty()
  category: GalleryCategory;

  @ApiPropertyOptional({
    description: 'Price for this design',
    example: '$45',
  })
  @IsString()
  @IsOptional()
  price?: string;

  @ApiPropertyOptional({
    description: 'Duration for this design',
    example: '60 minutes',
  })
  @IsString()
  @IsOptional()
  duration?: string;

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
