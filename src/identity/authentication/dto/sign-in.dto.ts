import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class SignInDto {
  @IsNotEmpty()
  @MinLength(2)
  @IsString()
  usernameOrEmail: string;

  @MinLength(8)
  @IsString()
  password: string;
}