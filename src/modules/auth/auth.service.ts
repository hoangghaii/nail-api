import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { Admin, AdminDocument } from './schemas/admin.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterAdminDto) {
    // Check if admin exists
    const existingAdmin = await this.adminModel.findOne({ email: dto.email });
    if (existingAdmin) {
      throw new ConflictException('Admin already exists');
    }

    // Hash password
    const hashedPassword = await argon2.hash(dto.password);

    // Create admin
    const admin = await this.adminModel.create({
      ...dto,
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = await this.generateTokens(admin._id.toString(), admin.email);

    // Save refresh token
    await this.updateRefreshToken(admin._id.toString(), tokens.refreshToken);

    return {
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        avatar: admin.avatar,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    // Find admin
    const admin = await this.adminModel.findOne({ email: dto.email });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const valid = await argon2.verify(admin.password, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(admin._id.toString(), admin.email);

    // Save refresh token
    await this.updateRefreshToken(admin._id.toString(), tokens.refreshToken);

    return {
      admin: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        avatar: admin.avatar,
      },
      ...tokens,
    };
  }

  async logout(adminId: string) {
    await this.adminModel.findByIdAndUpdate(adminId, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(adminId: string, refreshToken: string) {
    // Find admin
    const admin = await this.adminModel.findById(adminId);
    if (!admin || !admin.refreshToken || !admin.isActive) {
      throw new UnauthorizedException('Access denied');
    }

    // Verify refresh token
    const valid = await argon2.verify(admin.refreshToken, refreshToken);
    if (!valid) {
      throw new UnauthorizedException('Access denied');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(admin._id.toString(), admin.email);

    // Update refresh token (rotation)
    await this.updateRefreshToken(admin._id.toString(), tokens.refreshToken);

    return tokens;
  }

  private async generateTokens(adminId: string, email: string) {
    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    const accessExpiry = this.configService.get<string>('jwt.accessExpiry');
    const refreshExpiry = this.configService.get<string>('jwt.refreshExpiry');

    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT secrets not configured');
    }

    const payload = { sub: adminId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiry || '15m',
      } as any),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiry || '7d',
      } as any),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(adminId: string, refreshToken: string) {
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.adminModel.findByIdAndUpdate(adminId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async validateAdmin(adminId: string) {
    const admin = await this.adminModel.findById(adminId);
    if (!admin || !admin.isActive) {
      return null;
    }
    return {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      avatar: admin.avatar,
    };
  }
}
