import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors } from '@nestjs/common';
import { LicenseKeysService } from './license-keys.service';
import { CreateLicenseKeyDto } from './dto/create-license-key.dto';
import { UpdateLicenseKeyDto } from './dto/update-license-key.dto';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('license-keys')
export class LicenseKeysController {
  constructor(private readonly licenseKeysService: LicenseKeysService) {}

  @Post()
  @Permissions('create-license-key')
  @UseInterceptors(FileInterceptor(''))
  create(@Body() createLicenseKeyDto: CreateLicenseKeyDto) {
    return this.licenseKeysService.create(createLicenseKeyDto);
  }

  @Get()
  @Permissions('list-license-keys')
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'direction', required: false })
  findAll(
    @Query('productId') productId?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
  ) {
    return this.licenseKeysService.findAll(productId, page, limit, order, direction);
  }

  @Get(':id')
  @Permissions('select-license-key')
  findOne(@Param('id') id: string) {
    return this.licenseKeysService.findOne(+id);
  }

  @Get('count/:productId')
  @Permissions('count-license-keys')
  countByProductId(@Param('productId') productId: string) {
    return this.licenseKeysService.countByProductId(+productId);
  }

  @Patch(':id')
  @Permissions('update-license-key')
  @UseInterceptors(FileInterceptor(''))
  update(@Param('id') id: string, @Body() updateLicenseKeyDto: UpdateLicenseKeyDto) {
    return this.licenseKeysService.update(+id, updateLicenseKeyDto);
  }

  @Delete(':id')
  @Permissions('delete-license-key')
  remove(@Param('id') id: string) {
    return this.licenseKeysService.remove(+id);
  }
}
