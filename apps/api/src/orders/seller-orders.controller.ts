import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('sellers/me/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
export class SellerOrdersController {
  constructor(
    private ordersService: OrdersService,
    private prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: user.id } });
    if (!seller) return [];
    return this.ordersService.listForSeller(seller.id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(user.id, Role.SELLER, id, status);
  }
}
