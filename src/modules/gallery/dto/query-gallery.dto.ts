import { IsOptional, IsBoolean, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { GalleryCategory } from './create-gallery.dto';

export class QueryGalleryDto {
  @IsOptional()
  @IsEnum(GalleryCategory)
  category?: GalleryCategory;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
