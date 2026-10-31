import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { SmsProvider } from './sms-provider.interface';

/**
 * Repli utilisé quand aucune passerelle SMS n'est configurée.
 *
 * Par défaut il refuse l'envoi : mieux vaut une erreur claire (le client est
 * alors redirigé vers WhatsApp) qu'un écran « code envoyé » qui ne reçoit rien.
 * Pour le développement local uniquement : ALLOW_CONSOLE_OTP=true journalise
 * le code dans la console.
 */
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger(ConsoleSmsProvider.name);

  async sendOtp(phone: string, code: string): Promise<void> {
    if (process.env.ALLOW_CONSOLE_OTP === 'true') {
      this.logger.warn(`Code OTP (console) pour ${phone} : ${code}`);
      return;
    }

    this.logger.error(
      `Aucune passerelle SMS configurée (SMS_GATEWAY_URL) : code non envoyé à ${phone}.`,
    );
    throw new ServiceUnavailableException(
      'L’envoi de code par SMS n’est pas encore activé. Écrivez-nous sur WhatsApp au +226 76 95 00 89 pour créer votre compte.',
    );
  }
}
