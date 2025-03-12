import { Test, TestingModule } from '@nestjs/testing';
import { SlidesShowController } from './slides-show.controller';
import { SlidesShowService } from './slides-show.service';

describe('SlidesShowController', () => {
  let controller: SlidesShowController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SlidesShowController],
      providers: [SlidesShowService],
    }).compile();

    controller = module.get<SlidesShowController>(SlidesShowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
