import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class CreateProductDto {
  @ApiProperty({
    example: 'Product 1',
    description: 'The name of the product',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'This is a great product',
    description: 'The detail of the product',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  detail: string;

  @ApiProperty({
    example: 'This is a great product',
    description: 'The description of the product',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: 9.99,
    description: 'The price of the product',
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({
    example: 1,
    description: 'The category ID',
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  categoryId: number;
}
