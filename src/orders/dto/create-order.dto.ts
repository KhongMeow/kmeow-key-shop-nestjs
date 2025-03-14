import { Transform, Type } from "class-transformer";
import { IsArray, IsEmail, IsNotEmpty, IsNumber, ValidateNested } from "class-validator";
import { CreateOrderItemDto } from "./create-order-item.dto";

export class CreateOrderDto {
  @IsEmail()
  email: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
