import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { LicenseKeysService } from './license-keys.service';
import { CreateLicenseKeyDto } from './dto/create-license-key.dto';
import { UpdateLicenseKeyDto } from './dto/update-license-key.dto';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ImportLicenseKeysDto } from './dto/import-license-key.dto';

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

  @Post('import')
  @Permissions('create-license-key')
  @UseInterceptors(FileInterceptor(''))
  import(@Body() importLicenseKeyDto: ImportLicenseKeysDto) {
    return this.licenseKeysService.import(importLicenseKeyDto);
  }

  @Get()
  @Permissions('list-license-keys')
  @ApiQuery({ name: 'productSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'direction', required: false })
  findAll(
    @Query('productSlug') productSlug?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
  ) {
    return this.licenseKeysService.findAll(productSlug, page, limit, order, direction);
  }

  @Get('stats/:groupBy')
  async getStats(@Param('groupBy') groupBy: string) {
    const allowedGroups = ['daily', 'weekly', 'monthly', 'yearly'] as const;
    const groupByTyped = allowedGroups.includes(groupBy as any) ? groupBy as typeof allowedGroups[number] : undefined;
    return this.licenseKeysService.getLicenseKeyStats(groupByTyped);
  }

  @Get(':id')
  @Permissions('select-license-key')
  findOne(@Param('id') id: string) {
    return this.licenseKeysService.findOne(id);
  }

  @Get('count/:productSlug')
  @Permissions('count-license-keys')
  countByProductSlug(@Param('productSlug') productSlug: string) {
    return this.licenseKeysService.countByProductSlug(productSlug);
  }

  @Patch(':id')
  @Permissions('update-license-key')
  @UseInterceptors(FileInterceptor(''))
  update(@Param('id') id: string, @Body() updateLicenseKeyDto: UpdateLicenseKeyDto) {
    return this.licenseKeysService.update(id, updateLicenseKeyDto);
  }

  @Delete(':id')
  @Permissions('delete-license-key')
  remove(@Param('id') id: string) {
    return this.licenseKeysService.remove(id);
  }
}
