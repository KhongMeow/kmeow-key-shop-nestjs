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
  roleSlug: string;

  @ApiProperty({
    example: 2,
    description: 'The permission ID',
    required: true,
  })
  @IsNotEmpty()
  permissionSlug: string;
}
