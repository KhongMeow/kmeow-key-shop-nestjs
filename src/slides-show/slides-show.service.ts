import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateSlidesShowDto } from './dto/create-slides-show.dto';
import { UpdateSlidesShowDto } from './dto/update-slides-show.dto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { SlidesShow } from './entities/slides-show.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class SlidesShowService {
  constructor(
    @InjectRepository(SlidesShow) private readonly slidesShowRepository: Repository<SlidesShow>,
    private readonly globalService: GlobalService,
  ) {}

  async create(createSlidesShowDto: CreateSlidesShowDto, image: Express.Multer.File) {
    try {
      await this.isExistSlideShow(createSlidesShowDto.title);
      
      const slideShow = new SlidesShow();
      slideShow.title = createSlidesShowDto.title;
      slideShow.slug = await this.globalService.convertToSlug(createSlidesShowDto.title);

      if (image) {
        const filePath = await this.uploadImage(image);
        slideShow.image = filePath;
      }

      return await this.slidesShowRepository.save(slideShow);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(page?: number, limit?: number, order?: string, direction?: string): Promise<SlidesShow[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const slidesShow = await this.slidesShowRepository.find({
        take,
        skip,
        order: {
          [order || 'id']: direction || 'ASC',
        },
      });

      if (slidesShow.length === 0) {
        throw new NotFoundException('SlidesShow is empty');
      }

      return slidesShow;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(slug: string): Promise<SlidesShow> {
    try {
      const slideShow = await this.slidesShowRepository.findOneBy({slug});

      if (!slideShow) {
        throw new NotFoundException(`SlideShow with slug ${slug} is not found`);
      }

      return slideShow;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(slug: string, updateSlidesShowDto: UpdateSlidesShowDto, image: Express.Multer.File): Promise<SlidesShow> {
    try {
      const slideShow = await this.findOne(slug);
      slideShow.title = updateSlidesShowDto.title ?? slideShow.title;

      if (image) {
        const filePath = await this.uploadImage(image);
        slideShow.image = filePath;
      }

      return await this.slidesShowRepository.save(slideShow);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(slug: string): Promise<{ status: number; message: string }> {
    try {
      const slideShow = await this.findOne(slug);

      await this.slidesShowRepository.softDelete(slideShow.id);
      return {
        status: 200,
        message: `This slide show has been deleted`,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private async uploadImage(image: Express.Multer.File): Promise<string> {
    try {
      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (image.size > maxSize) {
        throw new BadRequestException('Image size exceeds the maximum limit of 5 MB');
      }
  
      if (!image.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        throw new BadRequestException('Only image files are allowed! e.g. jpg, jpeg, png');
      }
  
      const uploadDir = join(__dirname, '..', '..', 'images', 'products');
      const timestamp = Date.now();
      const filePath = join(uploadDir, `${timestamp}-${image.originalname}`);
  
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(filePath, image.buffer);
  
      return `/images/products/${timestamp}-${image.originalname}`;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  
  async isExistSlideShow(title: string): Promise<void> {
    try {
      const slideShow = await this.slidesShowRepository.findOne({
        where: [
          { title },
          { slug: await this.globalService.convertToSlug(title) }
        ],
      });

      if (slideShow) {
        throw new BadRequestException(`SlideShow with title or slug ${title} is already exist`);
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
