import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { PermissionsGuard } from 'src/identity/authorization/guards/permissions/permissions.guard';
import { Permissions } from 'src/identity/authorization/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('balances')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get()
  @Permissions('list-balances')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('order') order?: string,
    @Query('direction') direction?: string,
  ) {
    return this.balancesService.findAll(page, limit, order, direction);
  }

  @Get(':id')
  @Permissions('select-balance')
  findOne(@Param('id') id: string) {
    return this.balancesService.findOne(+id);
  }

  @Delete(':id')
  @Permissions('delete-balance')
  remove(@Param('id') id: string) {
    return this.balancesService.remove(+id);
  }
}
