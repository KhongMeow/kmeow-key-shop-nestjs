import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateOrderItemDto {
  @ApiProperty({
    example: 1,
    description: 'The product slug',
    required: true,
  })
  @IsNotEmpty()
  productSlug: string;

  @ApiProperty({
    example: 2,
    description: 'The quantity of the product',
    required: true
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  quantity: number;
}