import { IsNotEmpty, IsString } from "class-validator";

export class CreateSlidesShowDto {
  @IsNotEmpty()
  @IsString()
  title: string;
}
