import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessInfoService } from './business-info.service';
import { BusinessInfoController } from './business-info.controller';
import {
  BusinessInfo,
  BusinessInfoSchema,
} from './schemas/business-info.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessInfo.name, schema: BusinessInfoSchema },
    ]),
  ],
  controllers: [BusinessInfoController],
  providers: [BusinessInfoService],
  exports: [BusinessInfoService],
})
export class BusinessInfoModule {}
