import { Transform } from "class-transformer";
import { IsNumber, IsString } from "class-validator";

export class CreateLicenseKeyDto {
  @IsString()
  key: string;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  productId: number;
}
