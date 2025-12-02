import { VideoProfileEnum, AudioProfileEnum } from '@utils/enums';

export const VIDEO_QUEUE = 'video-transcoding';

export const JOB_DIRECT = 'transcode-direct';
export const JOB_FROM_VARIANTS = 'transcode-from-variants';

export interface TranscodeDirectPayload {
  videoId: number;
  url: string;
  videoProfiles: VideoProfileEnum[];
  audioProfiles: AudioProfileEnum[];
}

export interface TranscodeFromVariantsPayload {
  videoId: number;
}
