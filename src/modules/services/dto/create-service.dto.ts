import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
  MinLength,
  IsEnum,
} from 'class-validator';

export enum ServiceCategory {
  EXTENSIONS = 'extensions',
  MANICURE = 'manicure',
  NAIL_ART = 'nail-art',
  PEDICURE = 'pedicure',
  SPA = 'spa',
}

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(15)
  duration: number;

  @IsEnum(ServiceCategory)
  @IsNotEmpty()
  category: ServiceCategory;

  @IsString()
  @IsOptional()
  imageUrl?: string;

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
