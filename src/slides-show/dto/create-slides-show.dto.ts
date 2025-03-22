import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateSlidesShowDto {
  @ApiProperty({
    example: 'My first slides show',
    description: 'The title of the slides show',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  title: string;
}
