import { Controller, Get, Patch, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessInfoService } from './business-info.service';
import { UpdateBusinessInfoDto } from './dto/update-business-info.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Business Info')
@Controller('business-info')
export class BusinessInfoController {
  constructor(private readonly businessInfoService: BusinessInfoService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get business information' })
  @ApiResponse({
    status: 200,
    description: 'Business information retrieved successfully',
  })
  async findOne() {
    return this.businessInfoService.findOne();
  }

  @Patch()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update business information' })
  @ApiResponse({
    status: 200,
    description: 'Business information successfully updated',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(@Body() updateBusinessInfoDto: UpdateBusinessInfoDto) {
    return this.businessInfoService.update(updateBusinessInfoDto);
  }
}
