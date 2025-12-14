import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class StorageService implements OnModuleInit {
  private bucket: admin.storage.Storage;
  private bucketInstance: ReturnType<admin.storage.Storage['bucket']>;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const privateKey = this.configService.get<string>('firebase.privateKey');
    const nodeEnv =
      this.configService.get<string>('app.nodeEnv') || process.env.NODE_ENV;

    // Skip Firebase init in test environment if credentials not configured
    if (
      nodeEnv === 'test' &&
      (!privateKey ||
        privateKey === '<from-service-account-json>' ||
        privateKey.includes('from-service-account-json'))
    ) {
      console.log(
        '[StorageService] Skipping Firebase initialization in test environment',
      );
      return;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.get<string>('firebase.projectId'),
          privateKey,
          clientEmail: this.configService.get<string>('firebase.clientEmail'),
        }),
        storageBucket: this.configService.get<string>('firebase.storageBucket'),
      });
    }
    this.bucket = admin.storage();
    this.bucketInstance = this.bucket.bucket();
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const fileUpload = this.bucketInstance.file(fileName);

    await fileUpload.save(file.buffer, {
      contentType: file.mimetype,
      public: true,
    });

    return fileUpload.publicUrl();
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const pathSegments = new URL(fileUrl).pathname.split('/');
    const fileName = pathSegments.slice(-2).join('/');
    await this.bucketInstance.file(fileName).delete();
  }
}
