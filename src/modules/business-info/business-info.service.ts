import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BusinessInfo,
  BusinessInfoDocument,
} from './schemas/business-info.schema';
import { UpdateBusinessInfoDto } from './dto/update-business-info.dto';

@Injectable()
export class BusinessInfoService {
  constructor(
    @InjectModel(BusinessInfo.name)
    private readonly businessInfoModel: Model<BusinessInfoDocument>,
  ) {}

  async findOne(): Promise<BusinessInfo> {
    let businessInfo = await this.businessInfoModel.findOne().exec();

    if (!businessInfo) {
      // Create default business info if not exists
      businessInfo = new this.businessInfoModel({
        phone: '+1 (555) 000-0000',
        email: 'contact@nailsalon.com',
        address: '123 Main St, City, State 12345',
        businessHours: [
          {
            day: 'monday',
            openTime: '09:00',
            closeTime: '18:00',
            closed: false,
          },
          {
            day: 'tuesday',
            openTime: '09:00',
            closeTime: '18:00',
            closed: false,
          },
          {
            day: 'wednesday',
            openTime: '09:00',
            closeTime: '18:00',
            closed: false,
          },
          {
            day: 'thursday',
            openTime: '09:00',
            closeTime: '18:00',
            closed: false,
          },
          {
            day: 'friday',
            openTime: '09:00',
            closeTime: '18:00',
            closed: false,
          },
          {
            day: 'saturday',
            openTime: '10:00',
            closeTime: '17:00',
            closed: false,
          },
          {
            day: 'sunday',
            openTime: '10:00',
            closeTime: '16:00',
            closed: true,
          },
        ],
      });
      await businessInfo.save();
    }

    return businessInfo;
  }

  async update(
    updateBusinessInfoDto: UpdateBusinessInfoDto,
  ): Promise<BusinessInfo> {
    const businessInfo = await this.businessInfoModel.findOne().exec();

    if (!businessInfo) {
      throw new NotFoundException('Business info not found');
    }

    const updatedBusinessInfo = await this.businessInfoModel
      .findByIdAndUpdate(businessInfo._id, updateBusinessInfoDto, { new: true })
      .exec();

    if (!updatedBusinessInfo) {
      throw new NotFoundException('Business info not found');
    }

    return updatedBusinessInfo;
  }
}
