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
        console.log(
          `⏭️  Category "${categoryData.name}" already exists (slug: ${categoryData.slug})`,
        );
        skipped++;
      } else {
        await galleryCategoryService.create(categoryData);
        console.log(
          `✅ Created category "${categoryData.name}" (slug: ${categoryData.slug})`,
        );
        created++;
      }
    } catch (error) {
      console.error(
        `❌ Failed to create category "${categoryData.name}":`,
        error.message,
      );
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
