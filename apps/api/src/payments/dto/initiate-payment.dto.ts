import { IsEnum } from 'class-validator';
import { PaymentProviderType } from '@prisma/client';

export class InitiatePaymentDto {
  @IsEnum(PaymentProviderType)
  provider: PaymentProviderType;
}
