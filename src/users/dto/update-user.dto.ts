import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
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
      example: 'email@example.com',
      description: 'The email of the user',
      required: true,
    })
    @IsEmail()
    email: string;
}
