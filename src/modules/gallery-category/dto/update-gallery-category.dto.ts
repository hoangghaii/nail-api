import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateGalleryCategoryDto } from './create-gallery-category.dto';

export class UpdateGalleryCategoryDto extends PartialType(
  OmitType(CreateGalleryCategoryDto, ['slug'] as const),
) {}
