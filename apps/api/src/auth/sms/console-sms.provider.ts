import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from './sms-provider.interface';

/**
 * Dev-only stand-in for a real local SMS gateway. Logs the OTP instead of sending it.
 * Swap for a real implementation of SmsProvider once a vendor is chosen —
 * AuthService never needs to change.
 */
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger(ConsoleSmsProvider.name);

  async sendOtp(phone: string, code: string): Promise<void> {
    this.logger.log(`OTP for ${phone}: ${code}`);
  }
}
