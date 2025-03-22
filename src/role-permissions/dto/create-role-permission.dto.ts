import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateRolePermissionDto {
  @ApiProperty({
    example: 1,
    description: 'The role ID',
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  roleId: number;

  @ApiProperty({
    example: 2,
    description: 'The permission ID',
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  permissionId: number;
}
