import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MediaEntity } from './entities/media.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '@common/services';
import { MediaTypeEnum } from '@utils/enums/media-type.enum';
import { Readable } from 'stream';
import { GoogleCloudService } from '../cloud/google-cloud.service';

@Injectable()
export class MediaService extends BaseService<
  MediaEntity,
  Partial<MediaEntity>,
  Partial<MediaEntity>
> {
  constructor(
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
    private readonly cloudService: GoogleCloudService,
  ) {
    super(mediaRepository);
  }

  createEmpty = async (
    input: Partial<MediaEntity>,
    path: string,
    type?: string,
  ) => {
    const media = await this.mediaRepository.save({ ...input, url: '' });
    const { publicUrl } = await this.cloudService.createFileUrls(
      `${path}/${media.id}`,
      type,
    );
    return this.mediaRepository.save({ ...media, url: publicUrl });
  };

  uploadFile = async (stream: Readable): Promise<MediaEntity> => {
    const media = await this.create({
      type: MediaTypeEnum.RAW,
      url: '',
    });

    try {
      const url = await this.cloudService.uploadStream(
        stream,
        `raw/${media.id}`,
      );

      return this.mediaRepository.save({
        ...media,
        url: url,
      });
    } catch {
      await this.mediaRepository.remove(media);
      throw new Error('Failed to upload!');
    }
  };

  uploadImage = async (stream: Readable): Promise<MediaEntity> => {
    const media = await this.create({
      type: MediaTypeEnum.IMAGE,
      url: '',
    });

    try {
      const url = await this.cloudService.uploadStream(
        stream,
        `images/${media.id}`,
      );

      return this.mediaRepository.save({
        ...media,
        url: url,
      });
    } catch {
      await this.mediaRepository.remove(media);
      throw new Error('Failed to upload!');
    }
  };
}
