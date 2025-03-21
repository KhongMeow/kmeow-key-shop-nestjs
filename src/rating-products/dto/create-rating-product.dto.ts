import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateRatingProductDto {
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  rating: number;

  @IsNotEmpty()
  @IsString()
  comment: string;
}