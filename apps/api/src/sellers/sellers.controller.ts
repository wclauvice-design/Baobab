import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role, SellerStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { SellersService } from './sellers.service';
import { RegisterSellerDto } from './dto/register-seller.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class SellersController {
  constructor(private sellersService: SellersService) {}

  @Post('sellers/register')
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterSellerDto) {
    return this.sellersService.register(user.id, dto.shopName, dto.city);
  }

  @Get('sellers/me/dashboard')
  @UseGuards(RolesGuard)
  @Roles(Role.SELLER)
  dashboard(@CurrentUser() user: AuthUser) {
    return this.sellersService.dashboard(user.id);
  }

  @Get('admin/sellers')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listAll(@Query('status') status?: SellerStatus) {
    return this.sellersService.listAll(status);
  }

  @Patch('admin/sellers/:id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  setStatus(@Param('id') id: string, @Body('status') status: SellerStatus) {
    return this.sellersService.setStatus(id, status);
  }
}
