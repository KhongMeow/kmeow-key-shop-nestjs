import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber } from "class-validator";

export class ChangeRoleDto {
  @ApiProperty({
    example: 1,
    description: 'New role ID',
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  newRoleId: number;
}