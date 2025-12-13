import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type HeroSettingsDocument = HydratedDocument<HeroSettings>;

@Schema({ timestamps: true })
export class HeroSettings extends Document {
  @Prop({
    required: true,
    type: String,
    enum: ['image', 'video', 'carousel'],
    default: 'carousel',
  })
  displayMode: string;

  @Prop({ default: 5000 })
  carouselInterval: number; // in milliseconds

  @Prop({ default: true })
  showControls: boolean;
}

export const HeroSettingsSchema = SchemaFactory.createForClass(HeroSettings);
