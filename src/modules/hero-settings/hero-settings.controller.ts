import { Controller, Get, Patch, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HeroSettingsService } from './hero-settings.service';
import { UpdateHeroSettingsDto } from './dto/update-hero-settings.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Hero Settings')
@Controller('hero-settings')
export class HeroSettingsController {
  constructor(private readonly heroSettingsService: HeroSettingsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get hero section display settings' })
  @ApiResponse({
    status: 200,
    description: 'Hero settings retrieved successfully',
  })
  async findOne() {
    return this.heroSettingsService.findOne();
  }

  @Patch()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update hero section display settings' })
  @ApiResponse({
    status: 200,
    description: 'Hero settings successfully updated',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(@Body() updateHeroSettingsDto: UpdateHeroSettingsDto) {
    return this.heroSettingsService.update(updateHeroSettingsDto);
  }
}
