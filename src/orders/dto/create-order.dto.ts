import { Transform, Type } from "class-transformer";
import { IsArray, IsEmail, IsNotEmpty, IsNumber, ValidateNested } from "class-validator";
import { CreateOrderItemDto } from "./create-order-item.dto";
import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderDto {
  @ApiProperty({
    example: 'email@exaple.com',
    description: 'The email of the user',
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    examples: [
      {
      productId: 1,
      quantity:2
      },
      {
      productId: 2,
      quantity: 3
      }
    ],
    description: 'The order items',
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[];
}
