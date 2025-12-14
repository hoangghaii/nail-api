import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import {
  UpdateContactStatusDto,
  ContactStatus,
} from './dto/update-contact-status.dto';

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: ContactsService;

  const mockContactsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        {
          provide: ContactsService,
          useValue: mockContactsService,
        },
      ],
    }).compile();

    controller = module.get<ContactsController>(ContactsController);
    service = module.get<ContactsService>(ContactsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a contact', async () => {
      const createContactDto: CreateContactDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        subject: 'Test',
        message: 'Test message',
      };
      const result = { id: '1', ...createContactDto, status: 'new' };

      jest.spyOn(service, 'create').mockResolvedValue(result as any);

      expect(await controller.create(createContactDto)).toBe(result);
      expect(service.create).toHaveBeenCalledWith(createContactDto);
    });
  });

  describe('findAll', () => {
    it('should return all contacts', async () => {
      const result = { data: [], pagination: {} };
      jest.spyOn(service, 'findAll').mockResolvedValue(result as any);

      expect(await controller.findAll({})).toBe(result);
    });
  });

  describe('findOne', () => {
    it('should return a single contact', async () => {
      const result = { id: '1', firstName: 'John' };
      jest.spyOn(service, 'findOne').mockResolvedValue(result as any);

      expect(await controller.findOne('1')).toBe(result);
    });
  });

  describe('updateStatus', () => {
    it('should update contact status', async () => {
      const updateDto: UpdateContactStatusDto = {
        status: ContactStatus.READ,
      };
      const result = { id: '1', status: 'read' };

      jest.spyOn(service, 'updateStatus').mockResolvedValue(result as any);

      expect(await controller.updateStatus('1', updateDto)).toBe(result);
    });
  });
});
