import { IsOptional, IsString, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryBookingsDto {
  @ApiPropertyOptional({
    description: 'Filter by booking status',
    example: 'pending',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by service ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'Filter by booking date (ISO 8601 format)',
    example: '2025-12-20',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

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
