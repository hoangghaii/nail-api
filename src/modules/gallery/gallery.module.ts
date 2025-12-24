import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GalleryService } from './gallery.service';
import { GalleryController } from './gallery.controller';
import { Gallery, GallerySchema } from './schemas/gallery.schema';
import { GalleryCategoryModule } from '../gallery-category/gallery-category.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Gallery.name, schema: GallerySchema }]),
    GalleryCategoryModule,
  ],
  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
