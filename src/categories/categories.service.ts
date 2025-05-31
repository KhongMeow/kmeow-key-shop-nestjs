import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GlobalService } from 'src/global/global.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private readonly categoriesRepository: Repository<Category>,
    private readonly globalService: GlobalService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      await this.isExistCategory(createCategoryDto.name);

      const category = new Category();
      category.name = createCategoryDto.name;
      category.slug = await this.globalService.convertToSlug(createCategoryDto.name);

      return await this.categoriesRepository.save(category);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(page?: number, limit?: number, order?: string, direction?: string): Promise<Category[]> {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const categories = await this.categoriesRepository.find({
        skip,
        take,
        order: {
          [order || 'id']: direction || 'ASC',
        }
      });

      if (categories.length === 0) {
        throw new BadRequestException('Categories is empty');
      }

      return categories;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(slug: string): Promise<Category> {
    try {
      const category = await this.categoriesRepository.findOneBy({ slug });

      if (!category) {
        throw new BadRequestException(`Category with slug ${slug} is not found`);
      }

      return category;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(slug: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    try {
      const category = await this.findOne(slug);
      if (updateCategoryDto.name) {
        await this.isExistCategory(updateCategoryDto.name);

        category.name = updateCategoryDto.name;
        category.slug = await this.globalService.convertToSlug(updateCategoryDto.name);

        return await this.categoriesRepository.save(category);
      } else {
        throw new BadRequestException('Name must be provided');
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(slug: string): Promise<{ status: number; message: string }> {
    try {
      const category =  await this.categoriesRepository.findOne({ 
        where: { slug },
        relations: ['products']
      });

      if (!category) {
        throw new BadRequestException(`Category with slug ${slug} is not found`);
      }

      if (category.products.length > 0) {
        throw new BadRequestException(`This category was used by ${category.products.length} product(s)`)
      }

      await this.categoriesRepository.softDelete(category.id);

      return {
        status: 200,
        message: `Category with slug ${slug} has been deleted`,
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async isExistCategory(name: string): Promise<void> {
    try {
      const category = await this.categoriesRepository.findOne({
        where: [
          {name},
          { slug: await this.globalService.convertToSlug(name) }
        ]
      });

      if (category) {
        throw new BadRequestException(`Category with name ${name} is already exist`);
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
