import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type GalleryDocument = HydratedDocument<Gallery>;

@Schema({ timestamps: true })
export class Gallery extends Document {
  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'GalleryCategory', default: null })
  categoryId: Types.ObjectId | null;

  @Prop({ required: false })
  category?: string; // DEPRECATED: all, extensions, manicure, nail-art, pedicure, seasonal

  @Prop()
  price?: string; // e.g., "$45", "$60-80"

  @Prop()
  duration?: string; // e.g., "45 min", "1.5 hrs"

  @Prop({ default: false })
  featured?: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortIndex: number;
}

export const GallerySchema = SchemaFactory.createForClass(Gallery);

// Indexes
GallerySchema.index({ categoryId: 1, sortIndex: 1 });
GallerySchema.index({ category: 1, sortIndex: 1 }); // DEPRECATED: Keep for backward compat
GallerySchema.index({ isActive: 1 });
GallerySchema.index({ featured: 1 });
