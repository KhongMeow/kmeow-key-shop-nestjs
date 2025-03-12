import { Test, TestingModule } from '@nestjs/testing';
import { SlidesShowService } from './slides-show.service';

describe('SlidesShowService', () => {
  let service: SlidesShowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SlidesShowService],
    }).compile();

    service = module.get<SlidesShowService>(SlidesShowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
