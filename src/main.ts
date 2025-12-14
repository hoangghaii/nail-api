import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security headers with CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", 'https://res.cloudinary.com'],
          frameSrc: ["'none'"],
        },
      },
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      xFrameOptions: { action: 'deny' },
      xContentTypeOptions: true,
      xDnsPrefetchControl: { allow: false },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: [
      configService.get('app.frontendUrls.client'),
      configService.get('app.frontendUrls.admin'),
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Nail Salon API')
    .setDescription(
      'Production-ready REST API for nail salon business with JWT authentication, MongoDB, and Cloudinary Storage',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Admin authentication endpoints')
    .addTag('Services', 'Nail services management')
    .addTag('Bookings', 'Appointment bookings')
    .addTag('Gallery', 'Portfolio images')
    .addTag('Banners', 'Hero section banners')
    .addTag('Contacts', 'Customer inquiries')
    .addTag('Business Info', 'Business information and hours')
    .addTag('Hero Settings', 'Hero section display settings')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Nail Salon API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port: string = configService.get('app.port') as string;
  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}

bootstrap();
