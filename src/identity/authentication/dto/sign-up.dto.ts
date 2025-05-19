import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class SignUpDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the user',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  fullname: string;

  @ApiProperty({
    example: 'john-doe',
    description: 'Username can only contain letters, numbers, and dash',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]*$/, {
    message: 'Username can only contain letters, numbers, and dash',
  })
  username: string;

  @ApiProperty({
    example: 'email@example.com',
    description: 'The email of the user',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password',
    description: 'The password of the user min length 8 characters',
    required: true,
  })
  @MinLength(8)
  @IsString()
  password: string;
}