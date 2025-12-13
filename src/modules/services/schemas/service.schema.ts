import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

@Schema({ timestamps: true })
export class Service extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true, type: Number })
  duration: number; // in minutes

  @Prop({ required: true })
  category: string; // extensions, manicure, nail-art, pedicure, spa

  @Prop()
  imageUrl?: string;

  @Prop({ default: false })
  featured?: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortIndex: number;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

// Indexes
ServiceSchema.index({ category: 1, sortIndex: 1 });
ServiceSchema.index({ isActive: 1 });
ServiceSchema.index({ featured: 1 });
