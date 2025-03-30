import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductPriceEntity } from './entities/product-price.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class ProductPriceService {
  constructor(
    @InjectRepository(ProductPriceEntity)
    private readonly productPriceRepository: Repository<ProductPriceEntity>,
  ) {}

  create = (
    productId: string,
    priceId: string,
  ): Promise<ProductPriceEntity> => {
    return this.productPriceRepository.save({
      priceId,
      productId,
    });
  };

  createMany = (
    data: { productId: string; priceId: string }[],
    entityManager?: EntityManager,
  ): Promise<ProductPriceEntity[]> => {
    return entityManager
      ? entityManager.getRepository(ProductPriceEntity).save(data)
      : this.productPriceRepository.save(data);
  };

  readOne = (priceId: string, productId: string) => {
    return this.productPriceRepository.findOneBy({
      priceId,
      productId,
    });
  };
}
