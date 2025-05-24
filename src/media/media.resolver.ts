import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MediaService } from './media.service';
import { MediaEntity } from './entities/media.entity';
import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '../auth/guards/gql-jwt-auth.guard';
import { GetMediaArgs } from './dto/get-media.args';
import { PaginatedMedia } from './dto/paginated-media';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '@utils/enums';
import { FileUpload, GraphQLUpload } from 'graphql-upload-minimal';
import { GoogleCloudService } from '../cloud/google-cloud.service';
import { MediaTypeEnum } from '@utils/enums/media-type.enum';
import { CreateUploadResult } from './dto/create-upload-result';
import sharp from 'sharp';

@Resolver(() => MediaEntity)
export class MediaResolver {
  constructor(
    private readonly mediaService: MediaService,
    private readonly cloudService: GoogleCloudService,
  ) {}

  @Mutation(() => MediaEntity)
  async uploadImage(
    @Args('file', { type: () => GraphQLUpload }) file: FileUpload,
  ) {
    return this.mediaService.uploadImage(
      file.createReadStream().pipe(sharp().resize(1920).webp()),
    );
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CreateUploadResult)
  async createUpload(
    @Args('type', { type: () => MediaTypeEnum }) type: MediaTypeEnum,
    @Args('mediaType') mediaType: string,
  ): Promise<CreateUploadResult> {
    const { id } = await this.mediaService.create({
      type,
      url: '',
    });
    const { uploadUrl, publicUrl } = await this.cloudService.createFileUrls(
      `${type.toLowerCase()}/${id}`,
      mediaType,
    );
    await this.mediaService.update(id, {
      url: publicUrl,
    });

    return { mediaId: id, uploadUrl };
  }

  @Mutation(() => MediaEntity)
  async uploadFile(
    @Args('file', { type: () => GraphQLUpload }) file: FileUpload,
  ) {
    return this.mediaService.uploadFile((await file).createReadStream());
  }

  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  @Query(() => PaginatedMedia)
  getManyMedia(@Args() { sort, filter, ...pagination }: GetMediaArgs) {
    return this.mediaService.readMany(pagination, sort, filter);
  }

  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  @Query(() => MediaEntity)
  getOneMedia(@Args('id', ParseUUIDPipe) id: string) {
    return this.mediaService.readOne(id);
  }

  @UseGuards(GqlJwtAuthGuard, RolesGuard)
  @Role([RoleEnum.Admin, RoleEnum.Moderator])
  @Mutation(() => MediaEntity)
  deleteMedia(@Args('id', ParseUUIDPipe) id: string) {
    return this.mediaService.delete(id);
  }
}
