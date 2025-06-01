import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ImportLicenseKeysDto {
  @ApiProperty({
    example: 'ABC-123-DEF-456',
    description: 'The key of the license',
    required: true,
  })
  @IsNotEmpty()
  @IsString({ each: true })
  key: string[];

  @ApiProperty({
    example: 1,
    description: 'The product slug',
    required: true,
  })
  @IsNotEmpty()
  @IsString({ each: true })
  productSlug: string[];
}
