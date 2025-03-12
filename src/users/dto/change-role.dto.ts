import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber } from "class-validator";

export class ChangeRoleDto {
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsNotEmpty()
  currentRoleId: number;
  
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsNotEmpty()
  newRoleId: number;
}