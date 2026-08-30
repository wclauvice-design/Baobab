import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@Controller('orders/:orderId/payment')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initiate')
  initiate(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiate(user.id, orderId, dto.provider);
  }

  @Get('status')
  status(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.paymentsService.status(user.id, orderId);
  }
}
