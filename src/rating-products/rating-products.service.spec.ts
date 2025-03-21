import { Test, TestingModule } from '@nestjs/testing';
import { RatingProductsService } from './rating-products.service';

describe('RatingProductsService', () => {
  let service: RatingProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RatingProductsService],
    }).compile();

    service = module.get<RatingProductsService>(RatingProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
