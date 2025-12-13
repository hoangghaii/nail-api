import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type BusinessInfoDocument = HydratedDocument<BusinessInfo>;

@Schema({ _id: false })
export class DaySchedule {
  @Prop({
    required: true,
    type: String,
    enum: [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ],
  })
  day: string;

  @Prop({ required: true })
  openTime: string; // Format: "HH:MM" (24-hour)

  @Prop({ required: true })
  closeTime: string; // Format: "HH:MM" (24-hour)

  @Prop({ default: false })
  closed: boolean;
}

@Schema({ timestamps: true })
export class BusinessInfo extends Document {
  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true, type: [DaySchedule] })
  businessHours: DaySchedule[];
}

export const BusinessInfoSchema = SchemaFactory.createForClass(BusinessInfo);
