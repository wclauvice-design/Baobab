import { Inject, Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NOTIFICATION_PROVIDER, NotificationProvider } from './notification-provider.interface';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(NOTIFICATION_PROVIDER) private provider: NotificationProvider,
  ) {}

  async notifyUser(userId: string, phone: string, content: string) {
    for (const channel of [NotificationChannel.SMS, NotificationChannel.WHATSAPP]) {
      await this.provider.send(phone, channel, content);
      await this.prisma.notification.create({
        data: { userId, channel, content },
      });
    }
  }
}
