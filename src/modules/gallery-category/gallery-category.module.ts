import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GalleryCategoryService } from './gallery-category.service';
import { GalleryCategoryController } from './gallery-category.controller';
import {
  GalleryCategory,
  GalleryCategorySchema,
} from './schemas/gallery-category.schema';
import { Gallery, GallerySchema } from '../gallery/schemas/gallery.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GalleryCategory.name, schema: GalleryCategorySchema },
      { name: Gallery.name, schema: GallerySchema },
    ]),
  ],
  controllers: [GalleryCategoryController],
  providers: [GalleryCategoryService],
  exports: [GalleryCategoryService],
})
export class GalleryCategoryModule {}
