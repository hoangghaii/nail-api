import { Test, TestingModule } from '@nestjs/testing';
import { HeroSettingsController } from './hero-settings.controller';
import { HeroSettingsService } from './hero-settings.service';
import {
  UpdateHeroSettingsDto,
  HeroDisplayMode,
} from './dto/update-hero-settings.dto';

describe('HeroSettingsController', () => {
  let controller: HeroSettingsController;
  let service: HeroSettingsService;

  const mockHeroSettingsService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HeroSettingsController],
      providers: [
        {
          provide: HeroSettingsService,
          useValue: mockHeroSettingsService,
        },
      ],
    }).compile();

    controller = module.get<HeroSettingsController>(HeroSettingsController);
    service = module.get<HeroSettingsService>(HeroSettingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return hero settings', async () => {
      const result = {
        displayMode: 'carousel',
        carouselInterval: 5000,
        showControls: true,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(result as any);

      expect(await controller.findOne()).toBe(result);
    });
  });

  describe('update', () => {
    it('should update hero settings', async () => {
      const updateDto: UpdateHeroSettingsDto = {
        displayMode: HeroDisplayMode.VIDEO,
      };
      const result = { displayMode: 'video' };

      jest.spyOn(service, 'update').mockResolvedValue(result as any);

      expect(await controller.update(updateDto)).toBe(result);
    });
  });
});
