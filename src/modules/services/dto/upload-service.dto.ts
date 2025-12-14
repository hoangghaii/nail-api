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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceCategory } from './create-service.dto';

export class UploadServiceDto {
  @ApiProperty({
    description: 'Service name',
    example: 'Classic Manicure',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'Service description',
    example:
      'Professional nail care with shaping, buffing, and polish application',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  description: string;

  @ApiProperty({
    description: 'Service price in dollars',
    example: 25.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 45,
    minimum: 15,
  })
  @IsNumber()
  @Min(15)
  duration: number;

  @ApiProperty({
    description: 'Service category',
    enum: ServiceCategory,
    example: ServiceCategory.MANICURE,
  })
  @IsEnum(ServiceCategory)
  @IsNotEmpty()
  category: ServiceCategory;

  @ApiPropertyOptional({
    description: 'Whether the service is featured on the homepage',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the service is active and available for booking',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sort index for ordering services',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  sortIndex?: number;
}
