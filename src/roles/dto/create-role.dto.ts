import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class CreateRoleDto {
  @ApiProperty({
    example: 'Admin',
    description: 'The name of the role',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z0-9 ]*$/, {
    message: 'Name can only contain letters, numbers, and spaces',
  })
  name: string;
}
