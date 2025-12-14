import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  Min,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum HeroDisplayMode {
  IMAGE = 'image',
  VIDEO = 'video',
  CAROUSEL = 'carousel',
}

export class UpdateHeroSettingsDto {
  @ApiPropertyOptional({
    description: 'Hero section display mode',
    enum: HeroDisplayMode,
    example: HeroDisplayMode.CAROUSEL,
  })
  @IsEnum(HeroDisplayMode)
  @IsNotEmpty()
  @IsOptional()
  displayMode?: HeroDisplayMode;

  @ApiPropertyOptional({
    description: 'Carousel transition interval in milliseconds',
    example: 5000,
    minimum: 1000,
  })
  @IsNumber()
  @Min(1000)
  @IsOptional()
  carouselInterval?: number;

  @ApiPropertyOptional({
    description: 'Whether to show carousel navigation controls',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  showControls?: boolean;
}
