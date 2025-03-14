import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateOrderItemDto {
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  quantity: number;
}