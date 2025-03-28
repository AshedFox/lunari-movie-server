import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { StripeService } from '../stripe/stripe.service';
import { CreateProductInput } from './dto/create-product.input';
import { MovieService } from '../movie/movie.service';
import { NotFoundError } from '@utils/errors';
import { PriceService } from '../price/price.service';
import { BaseService } from '@common/services';
import { ProductPriceService } from '../product-price/product-price.service';
import { PriceEntity } from '../price/entities/price.entity';

@Injectable()
export class ProductService extends BaseService<
  ProductEntity,
  CreateProductInput,
  Partial<ProductEntity>
> {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly stripeService: StripeService,
    private readonly movieService: MovieService,
    private readonly priceService: PriceService,
    private readonly productPriceService: ProductPriceService,
  ) {
    super(productRepository);
  }

  create = async (input: CreateProductInput): Promise<ProductEntity> => {
    const movie = await this.movieService.readOne(input.movieId);

    if (!movie) {
      throw new NotFoundError('Movie not found!');
    }

    const product = await this.stripeService.createProduct(
      `${movie.type} ${movie.title}`,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const created: {
      product?: ProductEntity;
      prices: PriceEntity[];
    } = {
      prices: [],
    };

    try {
      created.product = await queryRunner.manager
        .getRepository(ProductEntity)
        .save({
          stripeProductId: product.id,
          movieId: input.movieId,
        });

      for (const price of input.prices) {
        created.prices.push(
          await this.priceService.create(
            {
              ...price,
              productId: product.id,
            },
            queryRunner.manager,
          ),
        );
      }
      await this.productPriceService.createMany(
        created.prices.map((p) => ({
          productId: created.product.id,
          priceId: p.id,
        })),
        queryRunner.manager,
      );
      await queryRunner.commitTransaction();

      return created.product;
    } catch {
      await queryRunner.rollbackTransaction();

      for (const price of created.prices) {
        try {
          await this.stripeService.disactivatePrice(price.stripePriceId);
        } catch (e) {
          console.error(e);
        }
      }

      if (created?.product) {
        await this.stripeService.removeProduct(created.product.stripeProductId);
      }
    } finally {
      await queryRunner.release();
    }
  };
}
