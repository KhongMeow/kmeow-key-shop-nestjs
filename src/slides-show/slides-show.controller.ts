import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UseGuards, Query } from '@nestjs/common';
import { Express } from 'express';
import { SlidesShowService } from './slides-show.service';
import { CreateSlidesShowDto } from './dto/create-slides-show.dto';
import { UpdateSlidesShowDto } from './dto/update-slides-show.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { PermissionsGuard } from 'src/identity/authorization/guards/permissions/permissions.guard';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';
import { Auth } from 'src/identity/authentication/decorators/auth.decorator';
import { AuthType } from 'src/identity/authentication/enums/auth-type.enum';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('slides-show')
export class SlidesShowController {
  constructor(private readonly slidesShowService: SlidesShowService) {}

  @Post()
  @Permissions('create-slide-show')
  @UseInterceptors(FileInterceptor('image'))
  create(@Body() createSlidesShowDto: CreateSlidesShowDto, @UploadedFile() image: Express.Multer.File) {
    return this.slidesShowService.create(createSlidesShowDto, image);
  }

  @Get()
  @Auth(AuthType.None)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'direction', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
  ) {
    return this.slidesShowService.findAll(page, limit, order, direction);
  }

  @Get(':id')
  @Auth(AuthType.None)
  findOne(@Param('id') id: string) {
    return this.slidesShowService.findOne(+id);
  }

  @Patch(':id')
  @Permissions('update-slide-show')
  @UseInterceptors(FileInterceptor('image'))
  update(@Param('id') id: string, @Body() updateSlidesShowDto: UpdateSlidesShowDto, @UploadedFile() image: Express.Multer.File) {
    return this.slidesShowService.update(+id, updateSlidesShowDto, image);
  }

  @Delete(':id')
  @Permissions('delete-slide-show')
  remove(@Param('id') id: string) {
    return this.slidesShowService.remove(+id);
  }
}
