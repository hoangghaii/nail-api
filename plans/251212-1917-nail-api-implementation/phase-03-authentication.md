# Phase 03: Authentication

**Phase ID:** 03
**Priority:** HIGH
**Duration:** 5-6 days
**Dependencies:** Phase 02

---

## Overview

JWT-based admin authentication with refresh token rotation, Argon2 password hashing, guards, decorators.

---

## Admin Schema

```typescript
// src/modules/auth/schemas/admin.schema.ts
@Schema({ timestamps: true })
export class Admin extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string; // Argon2 hashed

  @Prop({ required: true })
  name: string;

  @Prop({ type: String })
  refreshToken?: string; // Hashed

  @Prop({ default: true })
  isActive: boolean;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
AdminSchema.index({ email: 1 });
```

---

## Auth Flow

1. **Login:** Email + password → Access token (15min) + Refresh token (7d)
2. **Refresh:** Refresh token → New access + refresh tokens (rotation)
3. **Logout:** Invalidate refresh token in DB

---

## Key Files

### DTOs
```typescript
// src/modules/auth/dto/login.dto.ts
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// src/modules/auth/dto/register-admin.dto.ts
export class RegisterAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;
}
```

### Auth Service
```typescript
// src/modules/auth/auth.service.ts
import * as argon2 from 'argon2';

export class AuthService {
  async register(dto: RegisterAdminDto) {
    const hashedPassword = await argon2.hash(dto.password);
    const admin = await this.adminModel.create({
      ...dto,
      password: hashedPassword,
    });
    return this.generateTokens(admin.id);
  }

  async login(dto: LoginDto) {
    const admin = await this.adminModel.findOne({ email: dto.email });
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const valid = await argon2.verify(admin.password, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(admin.id);
  }

  async generateTokens(adminId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.sign(
        { sub: adminId },
        { expiresIn: '15m', secret: this.configService.get('jwt.accessSecret') },
      ),
      this.jwtService.sign(
        { sub: adminId },
        { expiresIn: '7d', secret: this.configService.get('jwt.refreshSecret') },
      ),
    ]);

    const hashedRefresh = await argon2.hash(refreshToken);
    await this.adminModel.findByIdAndUpdate(adminId, { refreshToken: hashedRefresh });

    return { accessToken, refreshToken };
  }

  async refreshTokens(adminId: string, refreshToken: string) {
    const admin = await this.adminModel.findById(adminId);
    if (!admin?.refreshToken) throw new UnauthorizedException('Token revoked');

    const valid = await argon2.verify(admin.refreshToken, refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid token');

    return this.generateTokens(adminId);
  }

  async logout(adminId: string) {
    await this.adminModel.findByIdAndUpdate(adminId, { refreshToken: null });
  }
}
```

### JWT Strategy
```typescript
// src/modules/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('jwt.accessSecret'),
    });
  }

  async validate(payload: any) {
    return { id: payload.sub };
  }
}
```

### Guards & Decorators
```typescript
// src/common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// src/common/decorators/public.decorator.ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// src/common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

---

## Success Criteria

- [ ] Admin registration works
- [ ] Login returns access + refresh tokens
- [ ] Protected routes reject invalid tokens
- [ ] Refresh endpoint rotates tokens
- [ ] Logout invalidates refresh token

---

## Next Steps

Move to [Phase 04: Core Modules](./phase-04-core-modules.md)
