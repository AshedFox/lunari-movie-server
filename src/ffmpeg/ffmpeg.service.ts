import { Injectable, Logger } from '@nestjs/common';
import { VideoProfileEnum, AudioProfileEnum } from '@utils/enums';
import Ffmpeg from 'fluent-ffmpeg';
import {
  AUDIO_PROFILES,
  CODECS_LIBS,
  KEYFRAME_STEP,
  SEGMENT_DURATION,
  TARGET_FRAMES,
  VIDEO_PROFILES,
} from './constants';
import { join } from 'path';
import { mkdir } from 'fs/promises';

@Injectable()
export class FfmpegService {
  makeMPEGDash = async (
    videoPaths: Record<string, string[]>,
    audioPaths: Record<string, string[]>,
    outputPath: string,
  ) => {
    try {
      const command = Ffmpeg({ cwd: outputPath });

      const mapOpt: string[] = [];
      let streamIndex = 0;

      for (const languageKey in videoPaths) {
        for (const videoPath of videoPaths[languageKey]) {
          command.addInput(videoPath);
          mapOpt.push(`-map ${streamIndex}:v:0`);
          streamIndex++;
        }
      }

      for (const languageKey in audioPaths) {
        for (const audioPath of audioPaths[languageKey]) {
          command.addInput(audioPath);
          mapOpt.push(`-map ${streamIndex}:a:0`);
          streamIndex++;
        }
      }

      command
        .outputOptions([...mapOpt, '-c copy'])
        .outputFormat('dash')
        .addOutputOption('-use_timeline 0')
        .addOutputOption(`-seg_duration ${SEGMENT_DURATION}`)
        .addOutputOption(`-frag_duration ${SEGMENT_DURATION}`)
        .addOutputOption('-adaptation_sets "id=0,streams=v id=1,streams=a"')
        .addOutputOption('-init_seg_name', '$RepresentationID$/init.$ext$')
        .addOutputOption(
          '-media_seg_name',
          '$RepresentationID$/seg-$Number$.$ext$',
        );

      for (let i = 0; i < streamIndex; i++) {
        await mkdir(join(outputPath, String(i)), { recursive: true });
      }

      return new Promise<void>((resolve, reject) => {
        command
          .on('start', (commandLine) => {
            Logger.log('Spawned Ffmpeg with command: ' + commandLine);
          })
          .on('error', (err, stdout, stderr) => {
            Logger.error(`FFmpeg error: ${err.message}\n${stdout}\n${stderr}`);
            reject(err);
          })
          .on('end', () => {
            Logger.log(`DASH manifest created at ${outputPath}`);
            resolve();
          })
          .saveToFile('master.mpd');
      });
    } catch (err) {
      Logger.error(`Error in makeDashManifest: ${err.message}`);
      throw err;
    }
  };

  makeMPEGDashDirectly = async (
    inputPath: string,
    outputDir: string,
    videoProfiles: VideoProfileEnum[],
    audioProfiles: AudioProfileEnum[],
  ): Promise<void> => {
    try {
      const command = Ffmpeg({ cwd: outputDir, stdoutLines: 0 });

      command
        .addInput(inputPath)
        .addOptions([
          `-g ${KEYFRAME_STEP}`,
          '-pix_fmt yuv420p',
          '-color_primaries bt709',
          '-color_trc bt709',
          '-colorspace bt709',
          `-keyint_min ${KEYFRAME_STEP}`,
        ]);

      const complexFilters: {
        inputs?: string[];
        filter: string;
        outputs?: string[];
      }[] = [
        {
          filter: `split=${videoProfiles.length}`,
          outputs: videoProfiles.map((_, i) => `[s${i}]`),
        },
        {
          filter: `asplit=${audioProfiles.length}`,
          outputs: audioProfiles.map(
            (_, i) => `[s${i + videoProfiles.length}]`,
          ),
        },
      ];
      let streamIndex = 0;
      const maps: string[] = [];

      command.videoCodec(
        CODECS_LIBS[VIDEO_PROFILES[videoProfiles[0]].videoCodec],
      );

      for (const profile of videoProfiles) {
        const { width, height, maxBitRate, crf, videoCodec } =
          VIDEO_PROFILES[profile];

        command.addOption([
          `-maxrate:v:${streamIndex} ${maxBitRate}`,
          `-crf:v:${streamIndex} ${crf}`,
        ]);
        complexFilters.push({
          inputs: [`[s${streamIndex}]`],
          filter: `scale=${width}x${height}`,
          outputs: [`[s${streamIndex}]`],
        });

        if (videoCodec === 'av1') {
          command.addOutputOption(
            `-svtav1-params:v:${streamIndex}`,
            'tune=0:film-grain=10:preset=4:lp=0',
          );
        } else if (videoCodec === 'h265' || videoCodec === 'h264') {
          command.addOutputOptions([
            `-preset:v:${streamIndex} high`,
            `-tune:v:${streamIndex} zerolatency`,
            `-profile:v:${streamIndex} high`,
            `-level:v:${streamIndex} 4.0`,
            `-movflags:v:${streamIndex} +faststart`,
          ]);
        }

        maps.push(`-map [s${streamIndex}]`);
        streamIndex++;
      }

      command.audioCodec(
        CODECS_LIBS[AUDIO_PROFILES[audioProfiles[0]].audioCodec],
      );

      for (const profile of audioProfiles) {
        const { audioFrequency, channels, bitRate } = AUDIO_PROFILES[profile];

        command.addOption([
          `-ar:a:${streamIndex} ${audioFrequency}`,
          `-b:a:${streamIndex} ${bitRate}`,
          `-ac:a:${streamIndex} ${channels}`,
        ]);
        maps.push(`-map [s${streamIndex}]`);
        streamIndex++;
      }

      command
        .complexFilter(complexFilters)
        .addOutputOptions(maps)
        .format('dash')
        .addOutputOption('-use_timeline 0')
        .addOutputOption(`-seg_duration ${SEGMENT_DURATION}`)
        .addOutputOption(`-frag_duration ${SEGMENT_DURATION}`)
        .addOutputOption('-adaptation_sets', 'id=0,streams=v id=1,streams=a')
        .addOutputOption('-init_seg_name', '$RepresentationID$/init.$ext$')
        .addOutputOption(
          '-media_seg_name',
          '$RepresentationID$/seg-$Number$.$ext$',
        );

      for (let i = 0; i < streamIndex; i++) {
        await mkdir(join(outputDir, String(i)), { recursive: true });
      }

      return new Promise<void>((resolve, reject) => {
        try {
          command
            .on('start', (commandLine) => {
              Logger.log('Spawned FFmpeg with command: ' + commandLine);
            })
            .on('progress', (progress) => {
              Logger.log(progress);
            })
            .on('error', (err) => {
              Logger.error('Error:', err);
              reject(err);
            })
            .on('end', () => {
              Logger.log('FFmpeg processing finished');
              resolve();
            })
            .saveToFile('master.mpd');
        } catch (e) {
          Logger.error(e);
          reject(e);
        }
      });
    } catch (err) {
      Logger.error(`Error in makeDashManifest: ${err.message}`);
      throw err;
    }
  };

  makeAudio = (
    inputPath: string,
    outputPath: string,
    audioProfile: AudioProfileEnum,
    language?: string,
  ) => {
    try {
      const { audioCodec, audioFrequency, channels, bitRate } =
        AUDIO_PROFILES[audioProfile];

      const command = Ffmpeg(inputPath);

      command
        .format('mp4')
        .audioFrequency(audioFrequency)
        .audioBitrate(bitRate)
        .addOption(`-bufsize ${bitRate}`)
        .audioChannels(channels)
        .audioCodec(CODECS_LIBS[audioCodec])
        .noVideo();

      if (language) {
        command.addOutputOption('-metadata:s:a:0', `language=${language}`);
      }

      return new Promise<void>((resolve, reject) => {
        command
          .on('start', (commandLine) => {
            Logger.log('Spawned FFmpeg with command: ' + commandLine);
          })
          .on('error', (err) => {
            Logger.error(`FFmpeg error: ${err.message}`);
            reject(err);
          })
          .on('end', () => {
            Logger.log(`Audio created at ${outputPath}`);
            resolve();
          })
          .saveToFile(outputPath);
      });
    } catch (err) {
      Logger.error(`Error in makeAudio: ${err.message}`);
      throw err;
    }
  };

  makeVideo = (
    inputPath: string,
    outputPath: string,
    profile: VideoProfileEnum,
    language?: string,
  ) => {
    try {
      const currentProfile = VIDEO_PROFILES[profile];

      const { maxBitRate, crf, videoCodec, width, height } = currentProfile;

      const command = Ffmpeg(inputPath);
      command
        .format('mp4')
        .videoCodec(CODECS_LIBS[videoCodec])
        .size(`${width}x${height}`)
        .noAudio()
        .fpsOutput(TARGET_FRAMES)
        .addOutputOptions([
          `-g ${KEYFRAME_STEP}`,
          '-pix_fmt yuv420p',
          '-color_primaries bt709',
          '-color_trc bt709',
          '-colorspace bt709',
          `-keyint_min ${KEYFRAME_STEP}`,
          `-maxrate ${maxBitRate}`,
          `-crf ${crf}`,
        ]);

      if (videoCodec === 'av1') {
        command.addOutputOption(
          '-svtav1-params',
          'tune=0:film-grain=10:preset=4:lp=0',
        );
      } else if (videoCodec === 'h265' || videoCodec === 'h264') {
        command.addOutputOptions([
          `-preset high`,
          `-tune zerolatency`,
          `-profile high`,
          `-level 4.0`,
          `-movflags +faststart`,
        ]);
      }

      if (language) {
        command.addOutputOption('-metadata:s:v:0', `language=${language}`);
      }

      return new Promise<void>((resolve, reject) => {
        command
          .on('start', (commandLine) => {
            Logger.log('Spawned FFmpeg with command: ' + commandLine);
          })
          .on('error', (err, _, stderr) => {
            Logger.error(`FFmpeg error: ${err.message}; ${stderr}`);
            reject(err);
          })
          .on('end', () => {
            Logger.log(`Video created at ${outputPath}`);
            resolve();
          })
          .saveToFile(outputPath);
      });
    } catch (err) {
      Logger.error(`Error in makeVideo: ${err.message}`);
      throw err;
    }
  };
}
