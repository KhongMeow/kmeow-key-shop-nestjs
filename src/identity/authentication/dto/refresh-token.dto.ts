import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({
    example: 'token',
    description: 'The refresh token',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
