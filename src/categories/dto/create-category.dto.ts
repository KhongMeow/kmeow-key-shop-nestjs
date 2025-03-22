import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Category Name',
    description: 'Name can only contain letters, numbers, and spaces',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z0-9 ]*$/, {
    message: 'Name can only contain letters, numbers, and spaces',
  })
  name: string;
}
