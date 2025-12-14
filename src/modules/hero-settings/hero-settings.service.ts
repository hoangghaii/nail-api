import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HeroSettings,
  HeroSettingsDocument,
} from './schemas/hero-settings.schema';
import { UpdateHeroSettingsDto } from './dto/update-hero-settings.dto';

@Injectable()
export class HeroSettingsService {
  constructor(
    @InjectModel(HeroSettings.name)
    private readonly heroSettingsModel: Model<HeroSettingsDocument>,
  ) {}

  async findOne(): Promise<HeroSettings> {
    let heroSettings = await this.heroSettingsModel.findOne().exec();

    if (!heroSettings) {
      // Create default hero settings if not exists
      heroSettings = new this.heroSettingsModel({
        displayMode: 'carousel',
        carouselInterval: 5000,
        showControls: true,
      });
      await heroSettings.save();
    }

    return heroSettings;
  }

  async update(
    updateHeroSettingsDto: UpdateHeroSettingsDto,
  ): Promise<HeroSettings> {
    const heroSettings = await this.heroSettingsModel.findOne().exec();

    if (!heroSettings) {
      throw new NotFoundException('Hero settings not found');
    }

    const updatedHeroSettings = await this.heroSettingsModel
      .findByIdAndUpdate(heroSettings._id, updateHeroSettingsDto, { new: true })
      .exec();

    if (!updatedHeroSettings) {
      throw new NotFoundException('Hero settings not found');
    }

    return updatedHeroSettings;
  }
}
