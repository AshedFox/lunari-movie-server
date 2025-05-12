import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieEntity } from './entities/movie.entity';
import { MovieService } from './movie.service';
import { MovieResolver } from './movie.resolver';
import { MovieInterfaceResolver } from './movie-interface.resolver';
import { MediaModule } from '@/media/media.module';
import { CloudModule } from '@/cloud/cloud.module';

@Module({
  imports: [TypeOrmModule.forFeature([MovieEntity]), MediaModule, CloudModule],
  providers: [MovieService, MovieResolver, MovieInterfaceResolver],
  exports: [MovieService],
})
export class MovieModule {}
