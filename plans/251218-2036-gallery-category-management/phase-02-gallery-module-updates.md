# Phase 02: Gallery Module Updates

**Status**: 🟢 READY TO START
**Progress**: 0/14 tasks
**Estimated Effort**: 3 hours
**Dependencies**: ✅ Phase 01 COMPLETE (blocking dependency resolved)
**Phase 01 Completion Date**: 2025-12-18

## Context

Update existing Gallery module to reference GalleryCategory collection via ObjectId. Maintain backward compatibility with deprecated `category` string field. Add auto-assignment logic for default 'all' category when categoryId not specified.

## Overview

Key changes:
- Add `categoryId` field (ObjectId reference, nullable)
- Keep `category` field (deprecated, for backward compat)
- Make `price` and `duration` REQUIRED in DTOs
- Auto-assign 'all' category when creating without categoryId
- Update queries to support both categoryId and deprecated category
- Add population for category details in responses
- Update validation and error handling

## Key Insights

**Backward Compatibility**: Existing API clients using `category` enum still work. New clients use `categoryId`.

**Default Assignment**: If client doesn't specify categoryId, auto-lookup 'all' category and assign.

**Validation Strategy**: Make price/duration required at DTO level, not schema level (allows existing docs to remain valid).

**Query Flexibility**: Support filtering by categoryId (new) or category string (deprecated).

## Requirements

### Functional Requirements

**FR2.1**: Gallery Schema Updates
- Add `categoryId: Types.ObjectId | null` with ref to 'GalleryCategory'
- Keep `category: string` field (no changes)
- Keep `price` and `duration` optional in schema (backward compat)
- Add compound index: `{ categoryId: 1, sortIndex: 1 }`

**FR2.2**: Create Gallery with Category
- Accept `categoryId` in CreateGalleryDto
- If categoryId not provided, auto-lookup 'all' category
- Validate categoryId exists (NotFoundException if not found)
- Make `price` and `duration` REQUIRED in CreateGalleryDto
- Keep `category` field in DTO as optional (deprecated, ignored)

**FR2.3**: Query Galleries by Category
- Add `categoryId` filter to QueryGalleryDto
- Support both `categoryId` (new) and `category` (deprecated)
- Populate category details when querying
- Return both `categoryId` and `category` in responses

**FR2.4**: Update Gallery Category
- Accept `categoryId` in UpdateGalleryDto
- Validate categoryId exists if provided
- Allow updating categoryId to different category
- Keep `category` field updatable (backward compat)

**FR2.5**: Delete Gallery with Category Reference
- No special handling needed (gallery owns the reference)
- Delete works normally, just removes reference

### Non-Functional Requirements

**NFR2.1**: Backward Compatibility
- Existing gallery items with only `category` field continue working
- Old API clients using `category` enum still functional
- No breaking changes to existing endpoints

**NFR2.2**: Performance
- Use compound index for category-based queries
- Populate category details efficiently
- Avoid N+1 query problems

**NFR2.3**: Data Integrity
- Validate categoryId references exist
- Handle missing 'all' category gracefully
- Clear error messages for category not found

## Architecture

### Schema Changes

```typescript
@Schema({ timestamps: true })
export class Gallery extends Document {
  // Existing fields
  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  // NEW: ObjectId reference to GalleryCategory
  @Prop({ type: Types.ObjectId, ref: 'GalleryCategory', default: null })
  categoryId: Types.ObjectId | null;

  // DEPRECATED: Keep for backward compatibility
  @Prop({ required: false })
  category?: string;

  // SCHEMA: Keep optional (DTO will require)
  @Prop()
  price?: string;

  @Prop()
  duration?: string;

  @Prop({ default: false })
  featured?: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortIndex: number;
}

// NEW INDEX
GallerySchema.index({ categoryId: 1, sortIndex: 1 });
```

### DTO Changes

**CreateGalleryDto** - Add categoryId, make price/duration required:
```typescript
export class CreateGalleryDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  // NEW: ObjectId reference (optional, defaults to 'all')
  @ApiPropertyOptional({
    description: 'Gallery category ID (defaults to "all" category)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  // DEPRECATED: Kept for backward compatibility (ignored)
  @ApiPropertyOptional({
    description: 'DEPRECATED: Use categoryId instead',
    deprecated: true,
  })
  @IsEnum(GalleryCategory)
  @IsOptional()
  category?: GalleryCategory;

  // NOW REQUIRED (was optional)
  @ApiProperty({
    description: 'Price for this design',
    example: '$45',
  })
  @IsString()
  @IsNotEmpty()
  price: string;

  // NOW REQUIRED (was optional)
  @ApiProperty({
    description: 'Duration for this design',
    example: '60 minutes',
  })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  sortIndex?: number;
}
```

**UpdateGalleryDto** - Add categoryId (optional):
```typescript
export class UpdateGalleryDto extends PartialType(CreateGalleryDto) {
  // All fields optional (inherited from PartialType)
}
```

**QueryGalleryDto** - Add categoryId filter:
```typescript
export class QueryGalleryDto {
  // NEW: Filter by categoryId
  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  // DEPRECATED: Keep for backward compatibility
  @ApiPropertyOptional({
    description: 'DEPRECATED: Use categoryId instead',
    deprecated: true,
  })
  @IsEnum(GalleryCategory)
  @IsOptional()
  category?: GalleryCategory;

  // ... existing filters (featured, isActive, page, limit)
}
```

### Service Updates

**Key Methods to Update**:

**create(dto): Promise<Gallery>**
```typescript
async create(createDto: CreateGalleryDto): Promise<Gallery> {
  let categoryId = createDto.categoryId;

  // Auto-assign 'all' category if not provided
  if (!categoryId) {
    const allCategory = await this.galleryCategoryService.findBySlug('all');
    categoryId = allCategory._id.toString();
  } else {
    // Validate categoryId exists
    await this.galleryCategoryService.findOne(categoryId);
  }

  const gallery = new this.galleryModel({
    ...createDto,
    categoryId: new Types.ObjectId(categoryId),
  });

  return gallery.save();
}
```

**findAll(query): Promise<PaginatedResult>**
```typescript
async findAll(query: QueryGalleryDto) {
  const { categoryId, category, featured, isActive, page = 1, limit = 10 } = query;

  const filter: any = {};

  // NEW: Filter by categoryId
  if (categoryId) {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('Invalid category ID');
    }
    filter.categoryId = new Types.ObjectId(categoryId);
  }

  // DEPRECATED: Filter by category string (backward compat)
  if (category) {
    filter.category = category;
  }

  if (featured !== undefined) filter.featured = featured;
  if (isActive !== undefined) filter.isActive = isActive;

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.galleryModel
      .find(filter)
      .populate('categoryId', 'name slug description') // Populate category details
      .sort({ sortIndex: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    this.galleryModel.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

**update(id, dto): Promise<Gallery>**
```typescript
async update(id: string, updateDto: UpdateGalleryDto): Promise<Gallery> {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('Invalid gallery ID');
  }

  // Validate categoryId if provided
  if (updateDto.categoryId) {
    await this.galleryCategoryService.findOne(updateDto.categoryId);
    updateDto.categoryId = new Types.ObjectId(updateDto.categoryId) as any;
  }

  const gallery = await this.galleryModel
    .findByIdAndUpdate(id, updateDto, { new: true })
    .populate('categoryId', 'name slug description')
    .exec();

  if (!gallery) {
    throw new NotFoundException(`Gallery item with ID ${id} not found`);
  }

  return gallery;
}
```

### Module Updates

**gallery.module.ts** - Import GalleryCategoryModule:
```typescript
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Gallery.name, schema: GallerySchema },
    ]),
    GalleryCategoryModule, // NEW: Import for service injection
    StorageModule,
  ],
  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
```

**gallery.service.ts** - Inject GalleryCategoryService:
```typescript
@Injectable()
export class GalleryService {
  constructor(
    @InjectModel(Gallery.name)
    private readonly galleryModel: Model<GalleryDocument>,
    private readonly storageService: StorageService,
    private readonly galleryCategoryService: GalleryCategoryService, // NEW
  ) {}
}
```

## Implementation Steps

### Step 1: Update Gallery Schema (20 min)

**File**: `src/modules/gallery/schemas/gallery.schema.ts`

**Changes**:
1. Import `Types` from mongoose
2. Add `categoryId` property with ObjectId type and ref
3. Make `category` field optional (remove `required: true` if present)
4. Add compound index on categoryId + sortIndex

### Step 2: Update CreateGalleryDto (25 min)

**File**: `src/modules/gallery/dto/create-gallery.dto.ts`

**Changes**:
1. Add `categoryId?: string` field with validators
2. Mark `category` as deprecated in Swagger
3. Change `price` from `@IsOptional()` to `@IsNotEmpty()`
4. Change `duration` from `@IsOptional()` to `@IsNotEmpty()`
5. Update Swagger examples and descriptions

### Step 3: Update UpdateGalleryDto (10 min)

**File**: `src/modules/gallery/dto/update-gallery.dto.ts`

**Changes**:
1. Verify it extends PartialType (should already include categoryId)
2. Add Swagger description for categoryId field
3. No other changes needed

### Step 4: Update QueryGalleryDto (15 min)

**File**: `src/modules/gallery/dto/query-gallery.dto.ts`

**Changes**:
1. Add `categoryId?: string` filter with validators
2. Keep `category` enum filter (mark deprecated)
3. Update Swagger descriptions

### Step 5: Update Gallery Service (60 min)

**File**: `src/modules/gallery/gallery.service.ts`

**Changes**:
1. Inject `GalleryCategoryService` in constructor
2. Update `create()` method:
   - Auto-assign 'all' category if categoryId not provided
   - Validate categoryId exists
   - Convert string to ObjectId
3. Update `findAll()` method:
   - Add categoryId filter handling
   - Add populate() for category details
   - Keep category string filter (deprecated)
4. Update `findOne()` method:
   - Add populate() for category details
5. Update `update()` method:
   - Validate categoryId if provided
   - Add populate() for category details

### Step 6: Update Gallery Controller (15 min)

**File**: `src/modules/gallery/gallery.controller.ts`

**Changes**:
1. Update Swagger schemas to reflect new categoryId field
2. Update example request bodies
3. Add response examples with populated category
4. No logic changes needed (delegates to service)

### Step 7: Update Gallery Module (10 min)

**File**: `src/modules/gallery/gallery.module.ts`

**Changes**:
1. Import `GalleryCategoryModule`
2. Add to imports array
3. Verify module compiles

### Step 8: Update Gallery Service Tests (45 min)

**File**: `src/modules/gallery/gallery.service.spec.ts`

**Changes**:
1. Mock `GalleryCategoryService` in test module
2. Update `create()` tests:
   - Test auto-assign 'all' category
   - Test with explicit categoryId
   - Test categoryId validation
3. Update `findAll()` tests:
   - Test categoryId filter
   - Test category string filter (deprecated)
   - Mock populate() responses
4. Update `update()` tests:
   - Test categoryId validation
   - Mock populate() responses

### Step 9: Update E2E Tests (30 min)

**File**: `test/gallery.e2e-spec.ts`

**Changes**:
1. Seed test categories before gallery tests
2. Update create tests to include categoryId
3. Test auto-assignment of 'all' category
4. Test filtering by categoryId
5. Verify populated category in responses

## Todos

- [ ] Update Gallery schema with categoryId field and index
- [ ] Update CreateGalleryDto (add categoryId, require price/duration)
- [ ] Update UpdateGalleryDto (verify includes categoryId)
- [ ] Update QueryGalleryDto (add categoryId filter)
- [ ] Update GalleryService constructor (inject GalleryCategoryService)
- [ ] Update create() method with auto-assignment logic
- [ ] Update findAll() method with categoryId filter and populate
- [ ] Update findOne() method with populate
- [ ] Update update() method with categoryId validation and populate
- [ ] Update GalleryController Swagger schemas
- [ ] Update GalleryModule imports
- [ ] Update gallery.service.spec.ts tests
- [ ] Update gallery.controller.spec.ts tests (if needed)
- [ ] Update gallery.e2e-spec.ts tests

## Success Criteria

- ✅ Gallery schema includes categoryId field with proper ref
- ✅ Compound index on categoryId + sortIndex created
- ✅ Create gallery auto-assigns 'all' category when not specified
- ✅ Create gallery validates categoryId exists
- ✅ Query galleries supports categoryId filter
- ✅ Category details populated in responses
- ✅ Backward compatibility maintained (category field works)
- ✅ Price and duration required for new galleries
- ✅ All existing tests updated and passing
- ✅ E2E tests cover new categoryId functionality

## Risks

**R2.1**: Missing 'all' category breaks auto-assignment
- **Mitigation**: Seed script in Phase 03 ensures 'all' exists
- **Fallback**: Service throws clear error if 'all' not found

**R2.2**: Existing galleries without categoryId fail queries
- **Mitigation**: categoryId is nullable, queries handle null
- **Resolution**: Migration script in Phase 03 assigns categories

**R2.3**: Breaking API for existing clients
- **Mitigation**: Keep category field, maintain backward compat
- **Testing**: E2E tests verify old API contract still works

**R2.4**: Circular dependency between Gallery and GalleryCategory modules
- **Mitigation**: GalleryCategory exports service, Gallery imports module
- **Validation**: Module compiles without errors

## Security Considerations

- Validate categoryId exists before assigning (prevents invalid refs)
- ObjectId validation prevents injection attacks
- Auth guards unchanged (admin still required for create/update/delete)
- No new public endpoints exposed

## Performance Considerations

- Compound index on categoryId + sortIndex optimizes category queries
- populate() adds one JOIN per query (acceptable overhead)
- Consider lean() for list queries if performance critical
- Pagination limits remain unchanged (max 100 per page)

## Backward Compatibility Strategy

**Existing Galleries**:
- `categoryId: null` allowed (nullable field)
- `category: string` still populated and queryable
- No migration required immediately

**Existing API Clients**:
- Can continue using `category` enum in queries
- Responses include both `category` and `categoryId`
- No breaking changes to response structure

**Deprecation Path**:
1. Phase 02: Add categoryId, mark category as deprecated
2. Phase 03: Migrate existing data to populate categoryId
3. Future: Remove category field (major version bump)

## Next Steps

After Phase 02 completion:
1. Manually test create gallery without categoryId (should auto-assign 'all')
2. Test create gallery with explicit categoryId
3. Test query galleries by categoryId
4. Verify populate() returns category details
5. Proceed to Phase 03 (Scripts and migration)
