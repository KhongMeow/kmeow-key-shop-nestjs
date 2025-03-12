import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { Express } from 'express';
import { SlidesShowService } from './slides-show.service';
import { CreateSlidesShowDto } from './dto/create-slides-show.dto';
import { UpdateSlidesShowDto } from './dto/update-slides-show.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { PermissionsGuard } from 'src/identity/authorization/guards/permissions/permissions.guard';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('slides-show')
export class SlidesShowController {
  constructor(private readonly slidesShowService: SlidesShowService) {}

  @Post()
  @Permissions('create-slides-show')
  @UseInterceptors(FileInterceptor('image'))
  create(@Body() createSlidesShowDto: CreateSlidesShowDto, @UploadedFile() image: Express.Multer.File) {
    return this.slidesShowService.create(createSlidesShowDto, image);
  }

  @Get()
  @Permissions('read-slides-show')
  findAll() {
    return this.slidesShowService.findAll();
  }

  @Get(':id')
  @Permissions('read-slides-show')
  findOne(@Param('id') id: string) {
    return this.slidesShowService.findOne(+id);
  }

  @Patch(':id')
  @Permissions('update-slides-show')
  @UseInterceptors(FileInterceptor('image'))
  update(@Param('id') id: string, @Body() updateSlidesShowDto: UpdateSlidesShowDto, @UploadedFile() image: Express.Multer.File) {
    return this.slidesShowService.update(+id, updateSlidesShowDto, image);
  }

  @Delete(':id')
  @Permissions('delete-slides-show')
  remove(@Param('id') id: string) {
    return this.slidesShowService.remove(+id);
  }
}
