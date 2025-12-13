import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  MinLength,
  IsEnum,
} from 'class-validator';

export enum GalleryCategory {
  ALL = 'all',
  EXTENSIONS = 'extensions',
  MANICURE = 'manicure',
  NAIL_ART = 'nail-art',
  PEDICURE = 'pedicure',
  SEASONAL = 'seasonal',
}

export class CreateGalleryDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(GalleryCategory)
  @IsNotEmpty()
  category: GalleryCategory;

  @IsString()
  @IsOptional()
  price?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  sortIndex?: number;
}
