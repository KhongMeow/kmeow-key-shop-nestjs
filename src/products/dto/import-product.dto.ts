import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class ImportProductsDto {
  @ApiProperty({
    example: 'Product 1',
    description: 'The name of the product',
    required: true,
  })
  @IsNotEmpty()
  @IsString({ each: true })
  name: string[];

  @ApiProperty({
    example: 'This is a great product',
    description: 'The detail of the product',
    required: true,
  })
  @IsNotEmpty()
  @IsString({ each: true })
  detail: string[];

  @ApiProperty({
    example: 'This is a great product',
    description: 'The description of the product',
    required: true,
  })
  @IsNotEmpty()
  @IsString({ each: true })
  description: string[];

  @ApiProperty({
    example: 9.99,
    description: 'The price of the product',
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number[];

  @ApiProperty({
    example: 'software',
    description: 'The category slug of the product',
    required: true,
  })
  @IsNotEmpty()
  @IsString({ each: true })
  categorySlug: string[];
}
