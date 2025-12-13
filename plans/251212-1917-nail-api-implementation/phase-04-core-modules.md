# Phase 04: Core Modules

**Phase ID:** 04
**Priority:** HIGH
**Duration:** 6-8 days
**Dependencies:** Phase 03

---

## Overview

Implement Services, Bookings, Gallery modules with full CRUD operations, DTOs, validation, pagination.

---

## Services Module

### Endpoints
- `GET /services` - List all active services (public)
- `GET /services/:id` - Get service details (public)
- `POST /services` - Create service (admin)
- `PATCH /services/:id` - Update service (admin)
- `DELETE /services/:id` - Delete service (admin)

### DTOs
```typescript
// src/modules/services/dto/create-service.dto.ts
export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountPrice?: number;

  @IsNumber()
  @Min(15)
  durationMinutes: number;

  @IsString()
  category: string;

  @IsArray()
  @IsOptional()
  images?: string[];
}
```

### Controller
```typescript
// src/modules/services/services.controller.ts
@Controller('services')
export class ServicesController {
  @Get()
  @Public()
  async findAll(@Query() query: QueryDto) {
    return this.servicesService.findAll(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }
}
```

---

## Bookings Module

### Endpoints
- `POST /bookings` - Create booking (public)
- `GET /bookings` - List bookings (admin)
- `GET /bookings/:id` - Get booking details (admin)
- `PATCH /bookings/:id/status` - Update status (admin)

### Time Slot Validation
```typescript
// Prevent double bookings
async validateTimeSlot(date: Date, time: string) {
  const existing = await this.bookingModel.findOne({
    appointmentDate: date,
    appointmentTime: time,
    status: { $in: ['pending', 'confirmed'] },
  });

  if (existing) {
    throw new ConflictException('Time slot already booked');
  }
}
```

---

## Gallery Module

### Endpoints
- `GET /gallery` - List gallery items (public)
- `POST /gallery` - Upload image (admin)
- `DELETE /gallery/:id` - Delete image (admin)

---

## Success Criteria

- [x] All CRUD operations work
- [x] DTOs validate inputs properly
- [x] Public routes accessible without auth
- [x] Admin routes protected by JWT guard
- [x] Pagination implemented

---

## Implementation Status

**Status:** ✅ **COMPLETE** (2025-12-13)
**Test Results:** 56/56 unit tests passing
**Coverage:** 86-88% (core modules)
**TypeScript:** Clean compilation
**Review:** [Code Review Report](./reports/251213-from-code-reviewer-to-main-phase04-review-report.md)

### Completed Items:
- ✅ Services module (DTOs, service, controller, module, tests)
- ✅ Bookings module (DTOs, service, controller, module, tests)
- ✅ Gallery module (DTOs, service, controller, module, tests)
- ✅ Validation (class-validator DTOs)
- ✅ Time slot conflict validation
- ✅ Duplicate service name prevention
- ✅ Authentication guards (@Public decorator)
- ✅ Pagination (all findAll methods)
- ✅ Database indexes
- ✅ Unit tests (56 tests)
- ✅ E2E tests (created, pending MongoDB)

### Recommendations from Review:
1. **Medium Priority:** Add ObjectId validation to Services/Gallery modules (pattern: copy from Bookings)
2. **Low Priority:** Add range validation to query DTOs (@Min/@Max on page/limit)
3. **Optional:** Consider unique constraint for Gallery titles
4. **Optional:** Extract pagination constants to config

---

## Next Steps

Move to [Phase 05: Admin Modules](./phase-05-admin-modules.md)
