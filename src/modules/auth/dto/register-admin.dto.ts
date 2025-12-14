import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterAdminDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@nailsalon.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Admin password (minimum 8 characters)',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Admin full name',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Admin avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString()
  @IsOptional()
  avatar?: string;
}
