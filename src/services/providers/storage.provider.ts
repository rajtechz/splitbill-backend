/**
 * SplitMate Flexible Storage Provider
 * Supports:
 *  - Local File System Storage (Default dev mode)
 *  - AWS S3 / Cloudinary Stub (Production mode)
 */

import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadOptions {
  fileName?: string;
  mimeType?: string;
}

export interface IStorageProvider {
  uploadBase64(base64Data: string, prefix: string, options?: UploadOptions): Promise<string>;
  deleteFile(fileUrl: string): Promise<boolean>;
}

export class LocalStorageProvider implements IStorageProvider {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      try {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      } catch (err) {
        console.warn('[Storage] Failed to create uploads dir:', err);
      }
    }
  }

  async uploadBase64(base64Data: string, prefix: string, options?: UploadOptions): Promise<string> {
    // If it's already a full HTTP URL, return as is
    if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
      return base64Data;
    }

    try {
      // Strip base64 prefix if present (e.g. data:image/png;base64,...)
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      const ext = options?.mimeType?.split('/')[1] || 'jpg';
      const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
      const filePath = path.join(this.uploadsDir, fileName);

      fs.writeFileSync(filePath, buffer);

      // Return public URL path
      return `/uploads/${fileName}`;
    } catch (err) {
      console.error('[Storage] Error saving file locally:', err);
      // Fallback: return as base64 data URI directly so image display never breaks
      return base64Data;
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      if (fileUrl.startsWith('/uploads/')) {
        const fileName = path.basename(fileUrl);
        const filePath = path.join(this.uploadsDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }
}

export class CloudinaryStorageProvider implements IStorageProvider {
  private local = new LocalStorageProvider();

  constructor() {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
      console.log('☁️ [CLOUDINARY] Connected to cloud storage for receipts & avatars:', process.env.CLOUDINARY_CLOUD_NAME);
    }
  }

  async uploadBase64(base64Data: string, prefix: string, options?: UploadOptions): Promise<string> {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return this.local.uploadBase64(base64Data, prefix, options);
    }

    try {
      const dataUri = base64Data.startsWith('data:')
        ? base64Data
        : `data:${options?.mimeType || 'image/jpeg'};base64,${base64Data}`;

      const res = await cloudinary.uploader.upload(dataUri, {
        folder: `splitmate/${prefix}`,
        resource_type: 'auto',
      });

      return res.secure_url;
    } catch (err: any) {
      console.warn('⚠️ [CLOUDINARY UPLOAD NOTICE - FALLBACK LOCAL]', err.message);
      return this.local.uploadBase64(base64Data, prefix, options);
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      if (fileUrl.includes('cloudinary.com')) {
        const parts = fileUrl.split('/');
        const fileWithExt = parts.slice(-2).join('/');
        const publicId = fileWithExt.substring(0, fileWithExt.lastIndexOf('.'));
        await cloudinary.uploader.destroy(publicId);
        return true;
      }
      return this.local.deleteFile(fileUrl);
    } catch {
      return false;
    }
  }
}

export class S3StorageProvider implements IStorageProvider {
  private local = new LocalStorageProvider();

  async uploadBase64(base64Data: string, prefix: string, options?: UploadOptions): Promise<string> {
    if (!process.env.AWS_S3_BUCKET) {
      return this.local.uploadBase64(base64Data, prefix, options);
    }
    return this.local.uploadBase64(base64Data, prefix, options);
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    return this.local.deleteFile(fileUrl);
  }
}

export const getStorageProvider = (): IStorageProvider => {
  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  switch (provider) {
    case 'cloudinary':
      return new CloudinaryStorageProvider();
    case 's3':
      return new S3StorageProvider();
    case 'local':
    default:
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        return new CloudinaryStorageProvider();
      }
      return new LocalStorageProvider();
  }
};

export const storageProvider: IStorageProvider = getStorageProvider();

