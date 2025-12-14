import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsEnum,
  IsBoolean,
  IsOptional,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export class DayScheduleDto {
  @ApiProperty({
    description: 'Day of the week',
    enum: DayOfWeek,
    example: DayOfWeek.MONDAY,
  })
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  day: DayOfWeek;

  @ApiProperty({
    description: 'Opening time in HH:MM format (24-hour)',
    example: '09:00',
    pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'openTime must be in HH:MM format (24-hour)',
  })
  openTime: string;

  @ApiProperty({
    description: 'Closing time in HH:MM format (24-hour)',
    example: '18:00',
    pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'closeTime must be in HH:MM format (24-hour)',
  })
  closeTime: string;

  @ApiPropertyOptional({
    description: 'Whether the business is closed on this day',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  closed?: boolean;
}

export class UpdateBusinessInfoDto {
  @ApiPropertyOptional({
    description: 'Business phone number',
    example: '+1 (555) 123-4567',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Business email address',
    example: 'info@nailsalon.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Business physical address',
    example: '123 Main Street, City, State 12345',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Business hours for all 7 days of the week',
    type: [DayScheduleDto],
    isArray: true,
    minItems: 7,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  @ArrayMinSize(7)
  @IsOptional()
  businessHours?: DayScheduleDto[];
}
