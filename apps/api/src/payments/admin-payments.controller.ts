import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminPaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('queue')
  queue() {
    return this.paymentsService.queue();
  }

  @Post(':id/validate')
  validate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.paymentsService.validate(user.id, id);
  }

  @Post(':id/reject')
  reject(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.paymentsService.reject(user.id, id);
  }
}
