import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ContactStatus {
  NEW = 'new',
  READ = 'read',
  RESPONDED = 'responded',
  ARCHIVED = 'archived',
}

export class UpdateContactStatusDto {
  @ApiProperty({
    description: 'New contact status',
    enum: ContactStatus,
    example: ContactStatus.READ,
  })
  @IsEnum(ContactStatus)
  @IsNotEmpty()
  status: ContactStatus;

  @ApiPropertyOptional({
    description: 'Admin notes for this contact',
    example: 'Customer called back and booked an appointment',
  })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
