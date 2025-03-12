import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsNumber, IsString, Matches, MinLength } from "class-validator";

export class CreateUserDto {
  @IsNotEmpty()
  @MinLength(2)
  @IsString()
  fullname: string;
  
  @IsNotEmpty()
  @MinLength(2)
  @IsString()
  @Matches(/^[a-z0-9-]*$/, {
    message: 'Username can only contain letters, numbers, and dash',
  })
  username: string;
  
  @IsEmail()
  email: string;
  
  @MinLength(8)
  @IsString()
  password: string;

  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  roleId: number;
}
