import {
  IsOptional,
  IsBoolean,
  IsString,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GalleryCategory } from './create-gallery.dto';

export class QueryGalleryDto {
  @ApiPropertyOptional({
    description: 'Filter by gallery category ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'DEPRECATED: Use categoryId instead. Filter by gallery category enum',
    enum: GalleryCategory,
    example: GalleryCategory.NAIL_ART,
    deprecated: true,
  })
  @IsOptional()
  @IsEnum(GalleryCategory)
  category?: GalleryCategory;

  @ApiPropertyOptional({
    description: 'Filter by featured gallery items',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by active gallery items',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
