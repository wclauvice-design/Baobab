import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { AdminPaymentsController } from './admin-payments.controller';
import { ManualOrangeMoneyProvider } from './providers/manual-orange-money.provider';
import { CashOnDeliveryProvider } from './providers/cash-on-delivery.provider';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [NotificationsModule, OrdersModule],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [PaymentsService, ManualOrangeMoneyProvider, CashOnDeliveryProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
