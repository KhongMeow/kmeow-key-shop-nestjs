import { IsNotEmpty, IsString, Matches } from "class-validator";

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z0-9 ]*$/, {
    message: 'Name can only contain letters, numbers, and spaces',
  })
  name: string;
}
