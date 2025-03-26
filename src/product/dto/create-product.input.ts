import { Field, InputType, Int } from '@nestjs/graphql';
import { IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
class CreateProductInput_Price {
  @Field()
  currencyId: string;

  @Field(() => Int)
  @Min(0)
  amount: number;
}

@InputType()
export class CreateProductInput {
  @Field()
  @IsUUID()
  movieId: string;

  @Field(() => [CreateProductInput_Price])
  @ValidateNested()
  @Type(() => CreateProductInput_Price)
  prices: CreateProductInput_Price[];
}
