import { PartialType } from '@nestjs/swagger';
import { CreateSlidesShowDto } from './create-slides-show.dto';

export class UpdateSlidesShowDto extends PartialType(CreateSlidesShowDto) {}
