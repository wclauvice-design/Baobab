import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './sms-provider.interface';

/**
 * Passerelle SMS réelle (Orange SMS API, Twilio, agrégateur local…).
 *
 * Activée automatiquement dès que `SMS_GATEWAY_URL` est défini dans
 * l'environnement. Contrat attendu : `POST` JSON `{ to, message, sender }`
 * avec un en-tête `Authorization: Bearer <SMS_GATEWAY_TOKEN>` facultatif.
 * La plupart des agrégateurs (Twilio, Orange, Termii, Vonage) s'y adaptent
 * via un petit proxy, ce qui évite de coupler le code à un fournisseur.
 */
@Injectable()
export class HttpSmsProvider implements SmsProvider {
  private readonly logger = new Logger(HttpSmsProvider.name);

  constructor(private readonly config: ConfigService) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const url = this.config.get<string>('SMS_GATEWAY_URL');
    if (!url) {
      throw new Error('SMS_GATEWAY_URL manquant : impossible d’envoyer le code.');
    }

    const token = this.config.get<string>('SMS_GATEWAY_TOKEN');
    const sender = this.config.get<string>('SMS_SENDER') || 'WESTZONE';
    const message = `WESTZONE : votre code de connexion est ${code}. Valable 5 minutes. Ne le partagez avec personne.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ to: phone, message, sender }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        this.logger.error(
          `Envoi SMS refusé (${response.status}) ${detail.slice(0, 200)}`,
        );
        throw new Error(
          'L’envoi du code par SMS a échoué. Réessayez ou écrivez-nous sur WhatsApp.',
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
