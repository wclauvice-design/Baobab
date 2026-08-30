import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { NotificationProvider } from './notification-provider.interface';

/**
 * Dev-only stand-in for a real SMS gateway / WhatsApp Business API.
 * Swap for a real implementation of NotificationProvider once a vendor is chosen —
 * nothing else in the codebase needs to change.
 */
@Injectable()
export class ConsoleNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(ConsoleNotificationProvider.name);

  async send(phone: string, channel: NotificationChannel, content: string): Promise<void> {
    this.logger.log(`[${channel}] -> ${phone}: ${content}`);
  }
}
