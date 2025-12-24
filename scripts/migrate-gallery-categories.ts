import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Gallery } from '../src/modules/gallery/schemas/gallery.schema';
import { GalleryCategory } from '../src/modules/gallery-category/schemas/gallery-category.schema';

async function bootstrap() {
  console.log('🔄 Starting gallery categories migration...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  const galleryModel = app.get<Model<Gallery>>(getModelToken(Gallery.name));
  const galleryCategoryModel = app.get<Model<GalleryCategory>>(
    getModelToken(GalleryCategory.name),
  );
  const connection = app.get<Connection>(getConnectionToken());

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
  const galleriesToMigrate = await galleryModel
    .find({
      $or: [{ categoryId: null }, { categoryId: { $exists: false } }],
    })
    .exec();

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
              console.log(
                `⚠️  Unknown category "${gallery.category}" for gallery "${gallery.title}", using "all"`,
              );
              defaulted++;
            }
          } else {
            defaulted++;
          }

          // Update gallery
          await galleryModel.updateOne(
            { _id: gallery._id },
            { $set: { categoryId } },
            { session },
          );

          console.log(`✅ Migrated: "${gallery.title}" → ${categoryId}`);
        } catch (error) {
          console.error(
            `❌ Failed to migrate gallery "${gallery.title}":`,
            error.message,
          );
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
    $or: [{ categoryId: null }, { categoryId: { $exists: false } }],
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
    console.log(
      '\n✨ Migration completed successfully! All galleries have categoryId.',
    );
  } else {
    console.log(
      `\n⚠️  Warning: ${remainingWithoutCategory} galleries still without categoryId.`,
    );
  }

  await app.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
