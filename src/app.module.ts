import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import firebaseConfig from './config/firebase.config';
import rateLimitConfig from './config/rate-limit.config';
import { validationSchema } from './config/validation.schema';
import { AuthModule } from './modules/auth/auth.module';
import { ServicesModule } from './modules/services/services.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { BannersModule } from './modules/banners/banners.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { BusinessInfoModule } from './modules/business-info/business-info.module';
import { HeroSettingsModule } from './modules/hero-settings/hero-settings.module';
import { StorageModule } from './modules/storage/storage.module';
import { AccessTokenGuard } from './modules/auth/guards/access-token.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
        firebaseConfig,
        rateLimitConfig,
      ],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        maxPoolSize: configService.get<number>('database.maxPoolSize'),
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisEnabled = configService.get<boolean>('redis.enabled', false);
        const ttl = configService.get<number>('rateLimit.ttl', 60000); // 60s default
        const limit = configService.get<number>('rateLimit.limit', 100); // 100 requests default

        if (redisEnabled) {
          return {
            throttlers: [
              {
                name: 'default',
                ttl,
                limit,
              },
            ],
            storage: new ThrottlerStorageRedisService(
              new Redis({
                host: configService.get<string>('redis.host', 'localhost'),
                port: configService.get<number>('redis.port', 6379),
                password: configService.get<string>('redis.password'),
              }),
            ),
          };
        }

        // Fallback to in-memory if Redis disabled
        return {
          throttlers: [
            {
              name: 'default',
              ttl,
              limit,
            },
          ],
        };
      },
    }),
    AuthModule,
    ServicesModule,
    BookingsModule,
    GalleryModule,
    BannersModule,
    ContactsModule,
    BusinessInfoModule,
    HeroSettingsModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
