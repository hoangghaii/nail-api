# Gallery Category Migration Guide

## Prerequisites

- MongoDB connection configured in .env
- Application dependencies installed (npm install)
- Database backup recommended before migration

## Migration Steps

### Step 1: Seed Categories

Create the 6 initial gallery categories:

```bash
npm run seed:categories
```

Expected output:
- 6 categories created (all, extensions, manicure, nail-art, pedicure, seasonal)
- If run again, all 6 should be skipped (idempotent)

### Step 2: Migrate Galleries

Update existing gallery items to reference categories:

```bash
npm run migrate:categories
```

Expected output:
- Summary of galleries migrated
- Verification that all galleries now have categoryId
- Transaction rollback on any errors

### Step 3: Verify

Check the database manually:

```javascript
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
```

## Rollback (if needed)

If migration fails or needs to be reverted:

```javascript
// Remove categoryId from all galleries
db.galleries.updateMany({}, { $unset: { categoryId: "" } })

// Delete all categories (if needed)
db.gallery_categories.deleteMany({})
```

## Troubleshooting

**Issue**: "all" category not found
- **Solution**: Run seed script first

**Issue**: Transaction timeout
- **Solution**: Increase transaction timeout or migrate in batches

**Issue**: Duplicate key error
- **Solution**: Check for existing categories with same slug/name

**Issue**: Unknown category values
- **Solution**: Review console warnings, galleries defaulted to "all"

## Categories Created

The seed script creates the following 6 categories:

1. **All** (slug: `all`) - All gallery items
2. **Extensions** (slug: `extensions`) - Nail extension designs
3. **Manicure** (slug: `manicure`) - Manicure designs and treatments
4. **Nail Art** (slug: `nail-art`) - Creative nail art designs
5. **Pedicure** (slug: `pedicure`) - Pedicure designs and treatments
6. **Seasonal** (slug: `seasonal`) - Seasonal and holiday designs

## Migration Process

The migration script:

1. Loads all categories into memory
2. Finds galleries without categoryId
3. Maps old category strings to new categoryId references
4. Uses MongoDB transactions for atomicity
5. Defaults unknown categories to "all"
6. Provides detailed summary and verification

## Safety Features

- **Idempotent**: Safe to run multiple times
- **Transactional**: All-or-nothing updates with rollback
- **Non-destructive**: Legacy category field preserved
- **Validation**: Verifies all galleries have categoryId after migration
