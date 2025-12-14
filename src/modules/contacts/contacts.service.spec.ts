import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { Contact, ContactDocument } from './schemas/contact.schema';
import { CreateContactDto } from './dto/create-contact.dto';
import {
  UpdateContactStatusDto,
  ContactStatus,
} from './dto/update-contact-status.dto';

describe('ContactsService', () => {
  let service: ContactsService;
  let model: Model<ContactDocument>;

  const mockContact = {
    _id: '507f1f77bcf86cd799439011',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    subject: 'Inquiry',
    message: 'Test message',
    status: 'new',
  };

  const mockContactModel = {
    new: jest.fn().mockResolvedValue(mockContact),
    constructor: jest.fn().mockResolvedValue(mockContact),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: getModelToken(Contact.name),
          useValue: mockContactModel,
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    model = module.get<Model<ContactDocument>>(getModelToken(Contact.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new contact successfully', async () => {
      const createContactDto: CreateContactDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        subject: 'Question',
        message: 'I have a question about services',
      };

      const savedContact = {
        ...createContactDto,
        _id: '507f1f77bcf86cd799439012',
        status: 'new',
      };

      const saveMock = jest.fn().mockResolvedValue(savedContact);
      const mockInstance = { save: saveMock };

      // Temporarily mock the model constructor while preserving other methods
      const originalModel = (service as any).contactModel;
      const mockConstructor = Object.assign(
        jest.fn().mockReturnValue(mockInstance),
        {
          find: model.find,
          findById: model.findById,
          findByIdAndUpdate: model.findByIdAndUpdate,
          countDocuments: model.countDocuments,
        },
      );
      (service as any).contactModel = mockConstructor;

      const result = await service.create(createContactDto);

      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual(savedContact);

      // Restore original
      (service as any).contactModel = originalModel;
    });
  });

  describe('findAll', () => {
    it('should return paginated contacts', async () => {
      const query = { page: 1, limit: 10 };
      const mockData = [mockContact];

      const mockExec = jest.fn().mockResolvedValue(mockData);
      const mockSort = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({ exec: mockExec }),
        }),
      });

      jest.spyOn(model, 'find').mockReturnValue({ sort: mockSort } as any);
      jest.spyOn(model, 'countDocuments').mockResolvedValue(1 as never);

      const result = await service.findAll(query);

      expect(result.data).toEqual(mockData);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a contact by id', async () => {
      const mockExec = jest.fn().mockResolvedValue(mockContact);
      jest.spyOn(model, 'findById').mockReturnValue({ exec: mockExec } as any);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockContact);
    });

    it('should throw NotFoundException if contact not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      jest.spyOn(model, 'findById').mockReturnValue({ exec: mockExec } as any);

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update contact status', async () => {
      const updateDto: UpdateContactStatusDto = {
        status: ContactStatus.READ,
        adminNotes: 'Reviewed',
      };
      const updatedContact = { ...mockContact, ...updateDto };

      const mockExec = jest.fn().mockResolvedValue(updatedContact);
      jest
        .spyOn(model, 'findByIdAndUpdate')
        .mockReturnValue({ exec: mockExec } as any);

      const result = await service.updateStatus(
        '507f1f77bcf86cd799439011',
        updateDto,
      );

      expect(result).toEqual(updatedContact);
    });

    it('should set respondedAt when status is responded', async () => {
      const updateDto: UpdateContactStatusDto = {
        status: ContactStatus.RESPONDED,
      };

      const mockExec = jest
        .fn()
        .mockResolvedValue({ ...mockContact, ...updateDto });
      jest
        .spyOn(model, 'findByIdAndUpdate')
        .mockReturnValue({ exec: mockExec } as any);

      await service.updateStatus('507f1f77bcf86cd799439011', updateDto);

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          status: ContactStatus.RESPONDED,
          respondedAt: expect.any(Date),
        }),
        { new: true },
      );
    });

    it('should throw NotFoundException if contact not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      jest
        .spyOn(model, 'findByIdAndUpdate')
        .mockReturnValue({ exec: mockExec } as any);

      await expect(
        service.updateStatus('507f1f77bcf86cd799439011', {
          status: ContactStatus.READ,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
