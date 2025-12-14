import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type AdminDocument = HydratedDocument<Admin>;

@Schema({ timestamps: true })
export class Admin extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string; // Argon2 hashed

  @Prop({ type: String, enum: ['admin', 'staff'], default: 'staff' })
  role: string;

  @Prop()
  avatar?: string;

  @Prop()
  refreshToken?: string; // Hashed refresh token

  @Prop({ default: true })
  isActive: boolean;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

// Note: Email unique index is already created by @Prop({ unique: true })
AdminSchema.index({ isActive: 1 });
