# Phase 02: Database Integration

**Phase ID:** 02
**Date:** 2025-12-12
**Priority:** CRITICAL
**Status:** Not Started
**Duration:** 4-5 days
**Dependencies:** Phase 01

---

## Overview

Integrate MongoDB with Mongoose ODM. Create schemas for all entities: Services, Bookings, Gallery, Banners, Contacts, BusinessInfo, HeroSettings. Implement repository pattern, indexes, seed data.

---

## Entities & Schemas

### 1. Service Schema
```typescript
// src/modules/services/schemas/service.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Service extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ type: Number })
  discountPrice?: number;

  @Prop({ required: true, type: Number })
  durationMinutes: number;

  @Prop({ required: true })
  category: string; // e.g., "Manicure", "Pedicure", "Nail Art"

  @Prop({ type: [String], default: [] })
  images: string[]; // Firebase Storage URLs

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

// Indexes
ServiceSchema.index({ category: 1, sortOrder: 1 });
ServiceSchema.index({ isActive: 1 });
```

### 2. Booking Schema
```typescript
// src/modules/bookings/schemas/booking.schema.ts
@Schema({ timestamps: true })
export class Booking extends Document {
  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerPhone: string;

  @Prop({ required: true })
  customerEmail: string;

  @Prop({ required: true, type: Date })
  appointmentDate: Date;

  @Prop({ required: true })
  appointmentTime: string; // e.g., "10:00", "14:30"

  @Prop({ required: true, type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }] })
  services: Service[];

  @Prop({ required: true, type: Number })
  totalAmount: number;

  @Prop({
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  })
  status: string;

  @Prop()
  notes?: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Indexes
BookingSchema.index({ appointmentDate: 1, appointmentTime: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ customerEmail: 1 });
```

### 3. Gallery Schema
```typescript
// src/modules/gallery/schemas/gallery.schema.ts
@Schema({ timestamps: true })
export class Gallery extends Document {
  @Prop({ required: true })
  imageUrl: string; // Firebase Storage URL

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  category: string; // e.g., "Nail Art", "Manicure", "Pedicure"

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const GallerySchema = SchemaFactory.createForClass(Gallery);

// Indexes
GallerySchema.index({ category: 1, sortOrder: 1 });
GallerySchema.index({ isActive: 1 });
```

### 4. Banner Schema
```typescript
// src/modules/banners/schemas/banner.schema.ts
@Schema({ timestamps: true })
export class Banner extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  subtitle?: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  buttonText?: string;

  @Prop()
  buttonLink?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);

// Indexes
BannerSchema.index({ isActive: 1, sortOrder: 1 });
```

### 5. Contact Schema
```typescript
// src/modules/contacts/schemas/contact.schema.ts
@Schema({ timestamps: true })
export class Contact extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    type: String,
    enum: ['new', 'read', 'replied'],
    default: 'new'
  })
  status: string;

  @Prop()
  adminNotes?: string;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);

// Indexes
ContactSchema.index({ status: 1, createdAt: -1 });
```

### 6. BusinessInfo Schema
```typescript
// src/modules/business-info/schemas/business-info.schema.ts
@Schema({ timestamps: true })
export class BusinessInfo extends Document {
  @Prop({ required: true })
  businessName: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true, type: Object })
  hours: {
    monday: { open: string; close: string; closed?: boolean };
    tuesday: { open: string; close: string; closed?: boolean };
    wednesday: { open: string; close: string; closed?: boolean };
    thursday: { open: string; close: string; closed?: boolean };
    friday: { open: string; close: string; closed?: boolean };
    saturday: { open: string; close: string; closed?: boolean };
    sunday: { open: string; close: string; closed?: boolean };
  };

  @Prop({ type: Object })
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export const BusinessInfoSchema = SchemaFactory.createForClass(BusinessInfo);
```

### 7. HeroSettings Schema
```typescript
// src/modules/hero-settings/schemas/hero-settings.schema.ts
@Schema({ timestamps: true })
export class HeroSettings extends Document {
  @Prop({
    type: String,
    enum: ['banner', 'video', 'slideshow'],
    default: 'banner'
  })
  displayMode: string;

  @Prop({ type: [String], default: [] })
  bannerIds: string[]; // References to Banner documents

  @Prop()
  videoUrl?: string;

  @Prop({ default: 5000, type: Number })
  slideshowInterval: number; // milliseconds
}

export const HeroSettingsSchema = SchemaFactory.createForClass(HeroSettings);
```

---

## Implementation Steps

### Step 1: Install MongoDB Driver
```bash
npm install @nestjs/mongoose mongoose
```

### Step 2: Create Database Module
```typescript
// src/modules/database/database.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        maxPoolSize: configService.get<number>('database.maxPoolSize'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

### Step 3: Create Schemas (as shown above)

Create all schema files in respective module directories.

### Step 4: Register Schemas in Modules

Example for Services:
```typescript
// src/modules/services/services.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from './schemas/service.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
})
export class ServicesModule {}
```

### Step 5: Create Seed Data Script
```typescript
// src/scripts/seed-database.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const connection = app.get<Connection>(getConnectionToken());

  // Seed business info (only one document)
  await connection.collection('businessinfos').insertOne({
    businessName: 'Elegant Nails Salon',
    phone: '(555) 123-4567',
    email: 'info@elegantnails.com',
    address: '123 Main St, City, State 12345',
    hours: {
      monday: { open: '09:00', close: '19:00' },
      tuesday: { open: '09:00', close: '19:00' },
      wednesday: { open: '09:00', close: '19:00' },
      thursday: { open: '09:00', close: '19:00' },
      friday: { open: '09:00', close: '20:00' },
      saturday: { open: '10:00', close: '18:00' },
      sunday: { closed: true },
    },
  });

  // Seed services
  await connection.collection('services').insertMany([
    {
      name: 'Classic Manicure',
      description: 'Basic nail care with polish',
      price: 25,
      durationMinutes: 30,
      category: 'Manicure',
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Gel Manicure',
      description: 'Long-lasting gel polish',
      price: 45,
      durationMinutes: 45,
      category: 'Manicure',
      isActive: true,
      sortOrder: 2,
    },
    // Add more...
  ]);

  await app.close();
  console.log('✅ Database seeded successfully');
}

bootstrap();
```

Add to package.json:
```json
"scripts": {
  "seed": "ts-node src/scripts/seed-database.ts"
}
```

---

## Architecture Decisions

**Decision: Mongoose vs TypeORM**
- **Choice:** Mongoose
- **Rationale:** Better MongoDB integration, flexible schema, active community

**Decision: Repository Pattern**
- **Choice:** Use Mongoose Model directly injected in services
- **Rationale:** NestJS + Mongoose pattern, less boilerplate

---

## Success Criteria

- [ ] MongoDB connects successfully
- [ ] All 7 schemas created with proper indexes
- [ ] Seed script runs without errors
- [ ] Can query collections via MongoDB Compass

---

## Next Steps

Move to [Phase 03: Authentication](./phase-03-authentication.md)
