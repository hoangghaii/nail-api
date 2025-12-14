import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class StorageService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const cloudName = this.configService.get<string>('cloudinary.cloudName');
    const apiKey = this.configService.get<string>('cloudinary.apiKey');
    const apiSecret = this.configService.get<string>('cloudinary.apiSecret');
    const nodeEnv =
      this.configService.get<string>('app.nodeEnv') || process.env.NODE_ENV;

    // Skip Cloudinary init in test environment if credentials not configured
    if (
      nodeEnv === 'test' &&
      (!cloudName || cloudName === '<your-cloud-name>')
    ) {
      console.log(
        '[StorageService] Skipping Cloudinary initialization in test environment',
      );
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto', // Automatically detect file type (image/video)
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // Extract public_id from Cloudinary URL
    // Example URL: https://res.cloudinary.com/<cloud_name>/image/upload/v1234567890/folder/filename.jpg
    const urlParts = fileUrl.split('/');
    const uploadIndex = urlParts.findIndex((part) => part === 'upload');
    
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL');
    }

    // Get everything after 'upload/vXXXXXXXXXX/' or 'upload/'
    const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join('/');
    
    // Remove file extension
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');

    await cloudinary.uploader.destroy(publicId);
  }
}

