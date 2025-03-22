import { PartialType } from '@nestjs/swagger';
import { CreateRatingProductDto } from './create-rating-product.dto';

export class UpdateRatingProductDto extends PartialType(CreateRatingProductDto) {}
