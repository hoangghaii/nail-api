# Phase 03: Scripts & Migration

**Status**: Pending
**Progress**: 0/8 tasks
**Estimated Effort**: 2 hours
**Dependencies**: Phase 01 (GalleryCategory module), Phase 02 (Gallery updates)

## Context

Create data initialization and migration scripts to:
1. Seed initial 6 categories matching old enum values
2. Migrate existing gallery items to reference categories via ObjectId
3. Verify data integrity after migration

## Overview

Two scripts needed:
- **Seed Script**: Create 6 initial categories (all, extensions, manicure, nail-art, pedicure, seasonal)
- **Migration Script**: Update existing galleries to reference appropriate categories

Both scripts should be idempotent (safe to run multiple times).

## Key Insights

**Idempotency**: Scripts check if data exists before creating/updating.

**Transaction Safety**: Use MongoDB transactions for migration to ensure all-or-nothing updates.

**Slug Mapping**: Map old enum values to new slugs (NAIL_ART → nail-art).

**Validation**: Verify all galleries have valid categoryId after migration.

## Requirements

### Functional Requirements

**FR3.1**: Seed Initial Categories
- Create 6 categories with specific slugs and names
- Set appropriate sortIndex for ordering
- Skip if category already exists (idempotent)
- Return summary of created vs existing

**FR3.2**: Migrate Gallery Items
- Find all galleries with category string but no categoryId
- Lookup matching category by slug
- Update gallery with categoryId reference
- Handle galleries with invalid/unknown categories
- Use transaction for atomicity

**FR3.3**: Verification
- Count galleries with and without categoryId
- List galleries with invalid category references
- Provide migration summary report

### Non-Functional Requirements

**NFR3.1**: Idempotency
- Safe to run multiple times
- Check existence before creating/updating
- No duplicate category creation

**NFR3.2**: Data Integrity
- Use transactions for migration
- Rollback on errors
- Validate category references exist

**NFR3.3**: Logging
- Clear progress messages
- Summary statistics
- Error details for debugging

## Architecture

### Seed Script Design

**File**: `scripts/seed-gallery-categories.ts`

**Categories to Create**:
```typescript
const categories = [
  {
    name: 'All',
    slug: 'all',
    description: 'All gallery items',
    sortIndex: 0,
    isActive: true,
  },
  {
    name: 'Extensions',
    slug: 'extensions',
    description: 'Nail extension designs',
    sortIndex: 1,
    isActive: true,
  },
  {
    name: 'Manicure',
    slug: 'manicure',
    description: 'Manicure designs and treatments',
    sortIndex: 2,
    isActive: true,
  },
  {
    name: 'Nail Art',
    slug: 'nail-art',
    description: 'Creative nail art designs',
    sortIndex: 3,
    isActive: true,
  },
  {
    name: 'Pedicure',
    slug: 'pedicure',
    description: 'Pedicure designs and treatments',
    sortIndex: 4,
    isActive: true,
  },
  {
    name: 'Seasonal',
    slug: 'seasonal',
    description: 'Seasonal and holiday designs',
    sortIndex: 5,
    isActive: true,
  },
];
```

**Process**:
1. Connect to MongoDB
2. For each category:
   - Check if slug already exists
   - Skip if exists (log "already exists")
   - Create if not exists (log "created")
3. Print summary (X created, Y skipped)
4. Disconnect and exit

### Migration Script Design

**File**: `scripts/migrate-gallery-categories.ts`

**Enum to Slug Mapping**:
```typescript
const categoryMapping = {
  'all': 'all',
  'extensions': 'extensions',
  'manicure': 'manicure',
  'nail-art': 'nail-art',
  'pedicure': 'pedicure',
  'seasonal': 'seasonal',
};
```

**Process**:
1. Connect to MongoDB
2. Load all categories into memory (slug → ObjectId map)
3. Start transaction
4. Find all galleries where categoryId is null or missing
5. For each gallery:
   - Get category string value
   - Lookup categoryId from map
   - If not found, use 'all' category (default)
   - Update gallery with categoryId
6. Commit transaction (or rollback on error)
7. Print summary:
   - Total galleries processed
   - Successfully migrated
   - Defaulted to 'all'
   - Failed (with details)
8. Verify: Count galleries still missing categoryId
9. Disconnect and exit

## Implementation Steps

### Step 1: Create Seed Script (45 min)

**File**: `scripts/seed-gallery-categories.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { GalleryCategoryService } from '../src/modules/gallery-category/gallery-category.service';

const categories = [
  {
    name: 'All',
    slug: 'all',
    description: 'All gallery items',
    sortIndex: 0,
    isActive: true,
  },
  {
    name: 'Extensions',
    slug: 'extensions',
    description: 'Nail extension designs',
    sortIndex: 1,
    isActive: true,
  },
  {
    name: 'Manicure',
    slug: 'manicure',
    description: 'Manicure designs and treatments',
    sortIndex: 2,
    isActive: true,
  },
  {
    name: 'Nail Art',
    slug: 'nail-art',
    description: 'Creative nail art designs',
    sortIndex: 3,
    isActive: true,
  },
  {
    name: 'Pedicure',
    slug: 'pedicure',
    description: 'Pedicure designs and treatments',
    sortIndex: 4,
    isActive: true,
  },
  {
    name: 'Seasonal',
    slug: 'seasonal',
    description: 'Seasonal and holiday designs',
    sortIndex: 5,
    isActive: true,
  },
];

async function bootstrap() {
  console.log('🌱 Starting gallery categories seeding...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const galleryCategoryService = app.get(GalleryCategoryService);

  let created = 0;
  let skipped = 0;

  for (const categoryData of categories) {
    try {
      // Check if category already exists
      const existing = await galleryCategoryService
        .findBySlug(categoryData.slug)
        .catch(() => null);

      if (existing) {
        console.log(`⏭️  Category "${categoryData.name}" already exists (slug: ${categoryData.slug})`);
        skipped++;
      } else {
        await galleryCategoryService.create(categoryData);
        console.log(`✅ Created category "${categoryData.name}" (slug: ${categoryData.slug})`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Failed to create category "${categoryData.name}":`, error.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Created: ${created}`);
  console.log(`   - Skipped: ${skipped}`);
  console.log(`   - Total: ${categories.length}`);

  await app.close();
  console.log('\n✨ Seeding completed!');
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
```

**Testing**:
- Run script: `npx ts-node scripts/seed-gallery-categories.ts`
- Verify 6 categories created
- Run again to verify idempotency (should skip all)
- Check MongoDB collection directly

### Step 2: Create Migration Script (60 min)

**File**: `scripts/migrate-gallery-categories.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Gallery } from '../src/modules/gallery/schemas/gallery.schema';
import { GalleryCategory } from '../src/modules/gallery-category/schemas/gallery-category.schema';

async function bootstrap() {
  console.log('🔄 Starting gallery categories migration...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  const galleryModel = app.get<Model<Gallery>>('GalleryModel');
  const galleryCategoryModel = app.get<Model<GalleryCategory>>('GalleryCategoryModel');
  const connection = app.get<Connection>('DatabaseConnection');

  // Step 1: Load all categories into memory
  console.log('📂 Loading categories...');
  const categories = await galleryCategoryModel.find().exec();
  const categoryMap = new Map<string, any>();

  categories.forEach((cat) => {
    categoryMap.set(cat.slug, cat._id);
  });

  console.log(`   Found ${categories.length} categories\n`);

  // Find default 'all' category
  const allCategoryId = categoryMap.get('all');
  if (!allCategoryId) {
    console.error('❌ Error: "all" category not found. Run seed script first.');
    await app.close();
    process.exit(1);
  }

  // Step 2: Find galleries to migrate
  console.log('🔍 Finding galleries to migrate...');
  const galleriesToMigrate = await galleryModel.find({
    $or: [
      { categoryId: null },
      { categoryId: { $exists: false } },
    ],
  }).exec();

  console.log(`   Found ${galleriesToMigrate.length} galleries to migrate\n`);

  if (galleriesToMigrate.length === 0) {
    console.log('✅ No galleries to migrate. All done!');
    await app.close();
    process.exit(0);
  }

  // Step 3: Migrate with transaction
  const session = await connection.startSession();

  let migrated = 0;
  let defaulted = 0;
  let failed = 0;
  const errors: any[] = [];

  try {
    await session.withTransaction(async () => {
      for (const gallery of galleriesToMigrate) {
        try {
          let categoryId = allCategoryId; // Default to 'all'

          // Try to map category string to categoryId
          if (gallery.category) {
            const mappedId = categoryMap.get(gallery.category);
            if (mappedId) {
              categoryId = mappedId;
              migrated++;
            } else {
              console.log(`⚠️  Unknown category "${gallery.category}" for gallery "${gallery.title}", using "all"`);
              defaulted++;
            }
          } else {
            defaulted++;
          }

          // Update gallery
          await galleryModel.updateOne(
            { _id: gallery._id },
            { $set: { categoryId } },
            { session }
          );

          console.log(`✅ Migrated: "${gallery.title}" → ${categoryId}`);
        } catch (error) {
          console.error(`❌ Failed to migrate gallery "${gallery.title}":`, error.message);
          failed++;
          errors.push({ gallery: gallery.title, error: error.message });
        }
      }
    });

    console.log('\n✅ Transaction committed successfully');
  } catch (error) {
    console.error('\n❌ Transaction failed and rolled back:', error.message);
    await session.endSession();
    await app.close();
    process.exit(1);
  }

  await session.endSession();

  // Step 4: Verification
  console.log('\n🔍 Verifying migration...');
  const remainingWithoutCategory = await galleryModel.countDocuments({
    $or: [
      { categoryId: null },
      { categoryId: { $exists: false } },
    ],
  });

  console.log(`   Galleries without categoryId: ${remainingWithoutCategory}`);

  // Step 5: Summary
  console.log(`\n📊 Migration Summary:`);
  console.log(`   - Total processed: ${galleriesToMigrate.length}`);
  console.log(`   - Successfully migrated: ${migrated}`);
  console.log(`   - Defaulted to "all": ${defaulted}`);
  console.log(`   - Failed: ${failed}`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors:`);
    errors.forEach((err) => {
      console.log(`   - ${err.gallery}: ${err.error}`);
    });
  }

  if (remainingWithoutCategory === 0) {
    console.log('\n✨ Migration completed successfully! All galleries have categoryId.');
  } else {
    console.log(`\n⚠️  Warning: ${remainingWithoutCategory} galleries still without categoryId.`);
  }

  await app.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
```

**Testing**:
- Create test galleries with various category values
- Run migration script
- Verify all galleries have categoryId
- Check that category strings were correctly mapped
- Run again to verify idempotency (should find 0 to migrate)

### Step 3: Add NPM Scripts (10 min)

**File**: `package.json`

Add to scripts section:
```json
{
  "scripts": {
    "seed:categories": "ts-node scripts/seed-gallery-categories.ts",
    "migrate:categories": "ts-node scripts/migrate-gallery-categories.ts"
  }
}
```

**Usage**:
```bash
npm run seed:categories
npm run migrate:categories
```

### Step 4: Create Migration Instructions (15 min)

**File**: `scripts/README-MIGRATION.md`

```markdown
# Gallery Category Migration Guide

## Prerequisites

- MongoDB connection configured in .env
- Application dependencies installed (npm install)
- Database backup recommended before migration

## Migration Steps

### Step 1: Seed Categories

Create the 6 initial gallery categories:

\`\`\`bash
npm run seed:categories
\`\`\`

Expected output:
- 6 categories created (all, extensions, manicure, nail-art, pedicure, seasonal)
- If run again, all 6 should be skipped (idempotent)

### Step 2: Migrate Galleries

Update existing gallery items to reference categories:

\`\`\`bash
npm run migrate:categories
\`\`\`

Expected output:
- Summary of galleries migrated
- Verification that all galleries now have categoryId
- Transaction rollback on any errors

### Step 3: Verify

Check the database manually:

\`\`\`javascript
// Connect to MongoDB
use nail_salon

// Count categories
db.gallery_categories.countDocuments()
// Expected: 6

// Check galleries without categoryId
db.galleries.countDocuments({ categoryId: null })
// Expected: 0

// Sample gallery with populated category
db.galleries.findOne({}, { title: 1, category: 1, categoryId: 1 })
\`\`\`

## Rollback (if needed)

If migration fails or needs to be reverted:

\`\`\`javascript
// Remove categoryId from all galleries
db.galleries.updateMany({}, { $unset: { categoryId: "" } })

// Delete all categories (if needed)
db.gallery_categories.deleteMany({})
\`\`\`

## Troubleshooting

**Issue**: "all" category not found
- **Solution**: Run seed script first

**Issue**: Transaction timeout
- **Solution**: Increase transaction timeout or migrate in batches

**Issue**: Duplicate key error
- **Solution**: Check for existing categories with same slug/name

**Issue**: Unknown category values
- **Solution**: Review console warnings, galleries defaulted to "all"
\`\`\`

### Step 5: Test Migration Workflow (20 min)

**Testing Checklist**:
- [ ] Run seed script on empty database
- [ ] Verify 6 categories created
- [ ] Run seed script again (should skip all)
- [ ] Create test galleries with various category values
- [ ] Run migration script
- [ ] Verify all galleries have categoryId
- [ ] Check category mappings are correct
- [ ] Test rollback procedure
- [ ] Test migration with failed transaction
- [ ] Test migration on database with partial data

## Todos

- [ ] Create seed-gallery-categories.ts script
- [ ] Create migrate-gallery-categories.ts script
- [ ] Add npm scripts to package.json
- [ ] Create migration documentation (README-MIGRATION.md)
- [ ] Test seed script (initial run)
- [ ] Test seed script (idempotency)
- [ ] Test migration script with sample data
- [ ] Verify transaction rollback on errors

## Success Criteria

- ✅ Seed script creates 6 categories successfully
- ✅ Seed script is idempotent (safe to run multiple times)
- ✅ Migration script updates all galleries with categoryId
- ✅ Migration script uses transactions for atomicity
- ✅ Migration script is idempotent
- ✅ Clear console output with progress and summary
- ✅ NPM scripts added for easy execution
- ✅ Migration documentation complete
- ✅ Rollback procedure documented and tested

## Risks

**R3.1**: Transaction failure leaves data in inconsistent state
- **Mitigation**: Use MongoDB transactions with rollback
- **Validation**: Test transaction rollback scenarios

**R3.2**: Unknown category values in existing data
- **Mitigation**: Default to 'all' category with warning
- **Logging**: Log all unknown category values for review

**R3.3**: Large database causes migration timeout
- **Mitigation**: Process in batches if needed
- **Alternative**: Increase transaction timeout

**R3.4**: Concurrent writes during migration
- **Mitigation**: Run migration during maintenance window
- **Safety**: Use transactions to prevent partial updates

## Security Considerations

- Scripts should not be exposed in production builds
- Require database access (use .env for credentials)
- No authentication bypass (uses NestJS app context)
- Audit log migration execution (console output)

## Performance Considerations

- Seed script: O(n) where n = 6 (negligible)
- Migration script: O(m) where m = number of galleries
- Load categories into memory (avoid repeated queries)
- Use transactions (slight overhead but ensures consistency)
- Consider batching for very large datasets (>10k galleries)

## Next Steps

After Phase 03 completion:
1. Run seed script in development environment
2. Test with sample galleries
3. Run migration script in development
4. Verify all data migrated correctly
5. Document any edge cases discovered
6. Proceed to Phase 04 (Testing)
