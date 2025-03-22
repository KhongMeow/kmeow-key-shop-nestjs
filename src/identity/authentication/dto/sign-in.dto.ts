import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class SignInDto {
  @ApiProperty({
    example: 'username or email',
    description: 'The username or email of the user',
    required: true,
  })
  @IsNotEmpty()
  @MinLength(2)
  @IsString()
  usernameOrEmail: string;

  @ApiProperty({
    example: 'password',
    description: 'The password of the user min length 8 characters',
    required: true,
  })
  @MinLength(8)
  @IsString()
  password: string;
}