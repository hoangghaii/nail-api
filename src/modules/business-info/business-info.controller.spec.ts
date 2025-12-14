import { Test, TestingModule } from '@nestjs/testing';
import { BusinessInfoController } from './business-info.controller';
import { BusinessInfoService } from './business-info.service';
import {
  UpdateBusinessInfoDto,
  DayOfWeek,
} from './dto/update-business-info.dto';

describe('BusinessInfoController', () => {
  let controller: BusinessInfoController;
  let service: BusinessInfoService;

  const mockBusinessInfoService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessInfoController],
      providers: [
        {
          provide: BusinessInfoService,
          useValue: mockBusinessInfoService,
        },
      ],
    }).compile();

    controller = module.get<BusinessInfoController>(BusinessInfoController);
    service = module.get<BusinessInfoService>(BusinessInfoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return business info', async () => {
      const result = {
        phone: '+1 (555) 123-4567',
        email: 'info@nailsalon.com',
        address: '123 Main St',
        businessHours: [],
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(result as any);

      expect(await controller.findOne()).toBe(result);
    });
  });

  describe('update', () => {
    it('should update business info', async () => {
      const updateDto: UpdateBusinessInfoDto = {
        phone: '+1 (555) 999-8888',
      };
      const result = { phone: '+1 (555) 999-8888' };

      jest.spyOn(service, 'update').mockResolvedValue(result as any);

      expect(await controller.update(updateDto)).toBe(result);
    });
  });
});
