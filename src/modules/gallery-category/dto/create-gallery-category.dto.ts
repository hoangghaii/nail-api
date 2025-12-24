import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGalleryCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Nail Art',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({
    description: 'URL-safe slug (auto-generated if not provided)',
    example: 'nail-art',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Creative nail designs and artwork',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Sort order index',
    example: 1,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  sortIndex?: number;

  @ApiPropertyOptional({
    description: 'Whether category is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
