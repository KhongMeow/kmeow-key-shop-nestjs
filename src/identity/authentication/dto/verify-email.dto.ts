import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class VerifyEmailDto {
  @ApiProperty({
    example: 'email@example.com',
    description: 'The email of the user',
    required: true,
  })
  @IsEmail()
  email: string;
  code: string;
}