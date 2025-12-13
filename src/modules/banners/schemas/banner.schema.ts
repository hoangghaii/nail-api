import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type BannerDocument = HydratedDocument<Banner>;

@Schema({ timestamps: true })
export class Banner extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  videoUrl?: string;

  @Prop({ required: true, type: String, enum: ['image', 'video'] })
  type: string;

  @Prop({ default: false })
  isPrimary: boolean;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: 0 })
  sortIndex: number;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);

// Indexes
BannerSchema.index({ active: 1, sortIndex: 1 });
BannerSchema.index({ isPrimary: 1 });
