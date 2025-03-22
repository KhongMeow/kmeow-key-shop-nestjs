import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class CreatePermissionDto {
  @ApiProperty({
    example: 'Create User',
    description: 'The name of the permission',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z0-9 ]*$/, {
    message: 'Name can only contain letters, numbers, and spaces',
  })
  name: string;
}
