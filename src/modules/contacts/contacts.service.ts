import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contact, ContactDocument } from './schemas/contact.schema';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
  ) {}

  async create(createContactDto: CreateContactDto): Promise<Contact> {
    const contact = new this.contactModel({
      ...createContactDto,
      status: 'new',
    });
    return contact.save();
  }

  async findAll(query: QueryContactsDto) {
    const { status, page = 1, limit = 10 } = query;

    const filter: any = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.contactModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.contactModel.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Contact> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid contact ID');
    }

    const contact = await this.contactModel.findById(id).exec();

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return contact;
  }

  async updateStatus(
    id: string,
    updateContactStatusDto: UpdateContactStatusDto,
  ): Promise<Contact> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid contact ID');
    }

    const updateData: any = {
      status: updateContactStatusDto.status,
    };

    if (updateContactStatusDto.adminNotes) {
      updateData.adminNotes = updateContactStatusDto.adminNotes;
    }

    if (updateContactStatusDto.status === 'responded') {
      updateData.respondedAt = new Date();
    }

    const contact = await this.contactModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return contact;
  }
}
