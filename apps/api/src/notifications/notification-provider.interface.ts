import { NotificationChannel } from '@prisma/client';

export const NOTIFICATION_PROVIDER = 'NOTIFICATION_PROVIDER';

export interface NotificationProvider {
  send(phone: string, channel: NotificationChannel, content: string): Promise<void>;
}
