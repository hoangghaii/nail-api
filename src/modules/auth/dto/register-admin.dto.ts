import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
