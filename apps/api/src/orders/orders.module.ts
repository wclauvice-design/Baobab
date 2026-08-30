import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { SellerOrdersController } from './seller-orders.controller';
import { AdminOrdersController } from './admin-orders.controller';

@Module({
  controllers: [OrdersController, SellerOrdersController, AdminOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
