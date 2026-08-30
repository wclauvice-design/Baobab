import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ConsoleNotificationProvider } from './console-notification.provider';
import { NOTIFICATION_PROVIDER } from './notification-provider.interface';

@Module({
  providers: [
    NotificationsService,
    { provide: NOTIFICATION_PROVIDER, useClass: ConsoleNotificationProvider },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
