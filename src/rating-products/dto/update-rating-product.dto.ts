import { PartialType } from '@nestjs/mapped-types';
import { CreateRatingProductDto } from './create-rating-product.dto';

export class UpdateRatingProductDto extends PartialType(CreateRatingProductDto) {}
