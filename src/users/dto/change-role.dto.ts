import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, Matches } from "class-validator";

export class ChangeRoleDto {
  @ApiProperty({
    example: 'johndoe',
    description: 'The username of the user',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]*$/, {
    message: 'Username can only contain lowercase letters, numbers, and dash',
  })
  username: string;

  @ApiProperty({
    example: 'admin',
    description: 'New role slug',
    required: true,
  })
  @IsNotEmpty()
  newRoleSlug: string;
}