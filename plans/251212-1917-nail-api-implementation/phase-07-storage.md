# Phase 07: Firebase Storage Integration

**Phase ID:** 07
**Priority:** MEDIUM
**Duration:** 3-4 days
**Dependencies:** Phase 04, Phase 05

---

## Overview

Integrate Firebase Storage for image uploads (gallery, banners, services).

---

## Firebase Setup

### Step 1: Install Firebase Admin SDK
```bash
npm install firebase-admin
```

### Step 2: Storage Service
```typescript
// src/modules/storage/storage.service.ts
import * as admin from 'firebase-admin';

@Injectable()
export class StorageService implements OnModuleInit {
  private bucket: admin.storage.Storage;

  onModuleInit() {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: this.configService.get('FIREBASE_PROJECT_ID'),
        privateKey: this.configService.get('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
        clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
      }),
      storageBucket: this.configService.get('FIREBASE_STORAGE_BUCKET'),
    });
    this.bucket = admin.storage();
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const fileUpload = this.bucket.bucket().file(fileName);

    await fileUpload.save(file.buffer, {
      contentType: file.mimetype,
      public: true,
    });

    return fileUpload.publicUrl();
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const fileName = fileUrl.split('/').pop();
    await this.bucket.bucket().file(fileName).delete();
  }
}
```

### Step 3: Upload Endpoint
```typescript
// src/modules/gallery/gallery.controller.ts
@Post('upload')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('image'))
async uploadImage(
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
      ],
    }),
  )
  file: Express.Multer.File,
  @Body() dto: CreateGalleryDto,
) {
  const imageUrl = await this.storageService.uploadFile(file, 'gallery');
  return this.galleryService.create({ ...dto, imageUrl });
}
```

---

## Success Criteria

- [ ] Firebase Admin SDK initialized
- [ ] Image uploads work to Firebase Storage
- [ ] Public URLs generated correctly
- [ ] File validation enforces size/type limits
- [ ] Delete operations clean up storage

---

## Next Steps

Move to [Phase 08: Testing](./phase-08-testing.md)
