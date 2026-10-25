import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { Roles } from './common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminCountsController {
  constructor(private prisma: PrismaService) {}

  @Get('counts')
  async counts() {
    const [pendingSellers, pendingListings, unreadMessages] = await Promise.all([
      this.prisma.seller.count({ where: { status: 'PENDING' } }),
      this.prisma.product.count({ where: { moderation: 'PENDING' } }),
      this.prisma.conversation.count({ where: { needsReply: true, state: 'OPEN' } }),
    ]);
    return {
      pendingSellers,
      pendingListings,
      unreadMessages,
      totalAlerts: pendingSellers + pendingListings + unreadMessages,
    };
  }
}
