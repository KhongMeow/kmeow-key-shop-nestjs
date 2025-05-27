import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsString, Matches, MinLength } from "class-validator";

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the user',
    required: true,
  })
  @IsNotEmpty()
  @MinLength(2)
  @IsString()
  fullname: string;
  
  @ApiProperty({
    example: 'johndoe',
    description: 'The username of the user',
    required: true,
  })
  @IsNotEmpty()
  @MinLength(2)
  @IsString()
  @Matches(/^[a-z0-9-]*$/, {
    message: 'Username can only contain lowercase letters, numbers, and dash',
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

  @ApiProperty({
    example: 1,
    description: 'The role ID',
    required: true,
  })
  @IsNotEmpty()
  roleSlug: string;
}
