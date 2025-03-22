import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateRatingProductDto {
  @ApiProperty({
    example: 1,
    description: 'The user ID',
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  userId: number;

  @ApiProperty({
    example: 1,
    description: 'Rating of the product (1-5)',
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  rating: number;

  @ApiProperty({
    example: 'This product is great!',
    description: 'Comment of the user',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  comment: string;
}