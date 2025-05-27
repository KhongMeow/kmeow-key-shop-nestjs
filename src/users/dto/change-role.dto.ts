import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class ChangeRoleDto {
  @ApiProperty({
    example: 'admin',
    description: 'New role slug',
    required: true,
  })
  @IsNotEmpty()
  newRoleSlug: string;
}