import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  MinLength,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BannerType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export class CreateBannerDto {
  @ApiProperty({
    description: 'Banner title',
    example: 'Welcome to Our Nail Salon',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: 'Banner image URL',
    example: 'https://example.com/images/hero-banner.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  imageUrl: string;

  @ApiPropertyOptional({
    description: 'Banner video URL (if type is video)',
    example: 'https://example.com/videos/hero-video.mp4',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiProperty({
    description: 'Banner type - image or video',
    enum: BannerType,
    example: BannerType.IMAGE,
  })
  @IsEnum(BannerType)
  @IsNotEmpty()
  type: BannerType;

  @ApiPropertyOptional({
    description: 'Whether this is the primary banner',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the banner is active and visible',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Sort index for ordering banners',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  sortIndex?: number;
}
