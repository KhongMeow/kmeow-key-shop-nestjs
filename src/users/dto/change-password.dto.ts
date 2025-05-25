import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'current-password',
    description: 'Enter the current password of the user',
    required: true,
  })
  @MinLength(8)
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'new-password',
    description: 'The new password of the user min length 8 characters',
    required: true,
  })
  @MinLength(8)
  @IsString()
  newPassword: string;
}
