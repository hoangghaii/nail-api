import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type GalleryCategoryDocument = HydratedDocument<GalleryCategory>;

@Schema({ timestamps: true })
export class GalleryCategory extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop({ default: 0 })
  sortIndex: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const GalleryCategorySchema =
  SchemaFactory.createForClass(GalleryCategory);

// Unique indexes with case-insensitive collation
GalleryCategorySchema.index(
  { name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);
GalleryCategorySchema.index(
  { slug: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);
GalleryCategorySchema.index({ isActive: 1 });
GalleryCategorySchema.index({ sortIndex: 1, isActive: 1 });
