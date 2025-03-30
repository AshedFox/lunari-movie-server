import { Injectable } from '@nestjs/common';
import { Bucket, Storage } from '@google-cloud/storage';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'fs';
import ms from 'ms';

@Injectable()
export class GoogleCloudService {
  private readonly storage: Storage;
  private readonly bucket: Bucket;

  constructor(private readonly configService: ConfigService) {
    this.storage = new Storage({
      projectId: configService.getOrThrow('GCS_PROJECT_ID'),
      keyFilename: configService.getOrThrow('GCS_KEY_PATH'),
    });
    this.bucket = this.storage.bucket(
      this.configService.getOrThrow('GCS_MEDIA_BUCKET'),
    );
  }

  private async executeWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 5,
    initialDelayMs: number = 100,
  ): Promise<T> {
    let retries = 0;

    while (true) {
      try {
        return await operation();
      } catch (error) {
        const isQuotaError =
          error.code === 429 ||
          (error.errors &&
            error.errors.some((e) => e.reason === 'rateLimitExceeded'));

        if (!isQuotaError || retries >= maxRetries) {
          throw error;
        }

        retries++;
        const delay = Math.floor(
          initialDelayMs + Math.random() * initialDelayMs,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  createFileUrls = async (
    path: string,
    type?: string,
  ): Promise<{
    uploadUrl: string;
    publicUrl: string;
  }> => {
    return this.executeWithBackoff(async () => {
      const file = this.bucket.file(path);

      return {
        uploadUrl: (
          await file.getSignedUrl({
            version: 'v4',
            expires: Date.now() + ms('1d'),
            action: 'write',
            contentType: type,
            responseDisposition: 'inline',
          })
        )[0],
        publicUrl: file.publicUrl().replace(/%2F/gi, '/'),
      };
    });
  };

  upload = async (
    inputPath: string,
    filePath: string,
    isPublic = true,
    type?: string,
  ): Promise<string> => {
    return this.executeWithBackoff(async () => {
      const file = this.bucket.file(filePath);
      await pipeline(
        createReadStream(inputPath),
        file.createWriteStream({
          public: isPublic,
          resumable: false,
          metadata: {
            contentType: type,
            contentDisposition: 'inline',
          },
        }),
      );

      return file.publicUrl().replace(/%2F/gi, '/');
    });
  };

  uploadStream = async (
    inputStream: Readable,
    filePath: string,
    isPublic = true,
    type?: string,
  ): Promise<string> => {
    return this.executeWithBackoff(async () => {
      const file = this.bucket.file(filePath);
      await pipeline(
        inputStream,
        file.createWriteStream({
          public: isPublic,
          resumable: false,
          metadata: {
            contentType: type,
            contentDisposition: 'inline',
          },
        }),
      );
      return file.publicUrl().replace(/%2F/gi, '/');
    });
  };

  delete = async (filePath: string): Promise<void> => {
    return this.executeWithBackoff(async () => {
      const [exists] = await this.bucket.file(filePath).exists();

      if (exists) {
        await this.bucket.file(filePath).delete();
      }
    });
  };
}
