import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from './sms-provider.interface';

/**
 * Repli utilisé quand aucune passerelle SMS n'est configurée.
 * Le code est journalisé (jamais envoyé) : à réserver au développement.
 */
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger(ConsoleSmsProvider.name);

  async sendOtp(phone: string, code: string): Promise<void> {
    this.logger.warn(
      `Aucune passerelle SMS configurée (SMS_GATEWAY_URL). Code pour ${phone} : ${code}`,
    );
  }
}
