import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HeroSettingsService } from './hero-settings.service';
import { HeroSettingsController } from './hero-settings.controller';
import {
  HeroSettings,
  HeroSettingsSchema,
} from './schemas/hero-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HeroSettings.name, schema: HeroSettingsSchema },
    ]),
  ],
  controllers: [HeroSettingsController],
  providers: [HeroSettingsService],
  exports: [HeroSettingsService],
})
export class HeroSettingsModule {}
