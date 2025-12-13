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

export class CustomerInfoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[\d\s-()]+$/, {
    message: 'Phone must be a valid phone number',
  })
  phone: string;
}

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(09|1[0-7]):(00|30)$/, {
    message:
      'Time slot must be between 09:00-17:30 in 30-minute intervals (e.g., 09:00, 09:30, 10:00)',
  })
  timeSlot: string;

  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo: CustomerInfoDto;

  @IsString()
  @IsOptional()
  notes?: string;
}
