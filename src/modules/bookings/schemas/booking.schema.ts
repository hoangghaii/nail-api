import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export type BookingDocument = HydratedDocument<Booking>;

@Schema({ timestamps: true, _id: false })
export class CustomerInfo {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;
}

@Schema({ timestamps: true })
export class Booking extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Service' })
  serviceId: Types.ObjectId;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ required: true })
  timeSlot: string; // "09:00", "10:00", etc.

  @Prop({ required: true, type: CustomerInfo })
  customerInfo: CustomerInfo;

  @Prop()
  notes?: string;

  @Prop({
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Indexes
BookingSchema.index({ serviceId: 1, date: 1, timeSlot: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ 'customerInfo.email': 1 });
BookingSchema.index({ 'customerInfo.phone': 1 });
