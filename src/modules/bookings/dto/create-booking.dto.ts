import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsDateString,
  ValidateNested,
  Matches,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerInfoDto {
  @ApiProperty({
    description: 'Customer first name',
    example: 'Jane',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  firstName: string;

  @ApiProperty({
    description: 'Customer last name',
    example: 'Smith',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  lastName: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'jane.smith@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+1 (555) 123-4567',
    pattern: '^\\+?[\\d\\s-()]+$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[\d\s-()]+$/, {
    message: 'Phone must be a valid phone number',
  })
  phone: string;
}

export class CreateBookingDto {
  @ApiProperty({
    description: 'Service ID to book',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'Booking date in ISO 8601 format',
    example: '2025-12-20',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Time slot in 30-minute intervals between 09:00-17:30',
    example: '14:00',
    pattern: '^(09|1[0-7]):(00|30)$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(09|1[0-7]):(00|30)$/, {
    message:
      'Time slot must be between 09:00-17:30 in 30-minute intervals (e.g., 09:00, 09:30, 10:00)',
  })
  timeSlot: string;

  @ApiProperty({
    description: 'Customer contact information',
    type: CustomerInfoDto,
  })
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo: CustomerInfoDto;

  @ApiPropertyOptional({
    description: 'Additional notes or special requests',
    example: 'Please use hypoallergenic products',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
