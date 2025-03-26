import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity';
import { Repository } from 'typeorm';
import { StripeService } from '../stripe/stripe.service';
import { CreateProductInput } from './dto/create-product.input';
import { MovieService } from '../movie/movie.service';
import { NotFoundError } from '@utils/errors';
import { PriceService } from '../price/price.service';
import { BaseService } from '@common/services';
import { ProductPriceService } from '../product-price/product-price.service';

@Injectable()
export class ProductService extends BaseService<
  ProductEntity,
  CreateProductInput,
  Partial<ProductEntity>
> {
  constructor(
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

    const product = await this.stripeService.createProduct(movie.title);

    const productEntity = await this.productRepository.save({
      stripeProductId: product.id,
      movieId: input.movieId,
    });

    for (const price of input.prices) {
      const p = await this.priceService.create({
        ...price,
        productId: product.id,
      });
      await this.productPriceService.create(productEntity.id, p.id);
    }

    return productEntity;
  };
}
