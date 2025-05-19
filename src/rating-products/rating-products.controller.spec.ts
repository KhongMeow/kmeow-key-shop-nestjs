import { Test, TestingModule } from '@nestjs/testing';
import { RatingProductsController } from './rating-products.controller';
import { RatingProductsService } from './rating-products.service';

describe('RatingProductsController', () => {
  let controller: RatingProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingProductsController],
      providers: [RatingProductsService],
    }).compile();

    controller = module.get<RatingProductsController>(RatingProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
