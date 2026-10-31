import { BadRequestException, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SMS_PROVIDER, SmsProvider } from './sms/sms-provider.interface';

const OTP_TTL_MINUTES = 5;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    @Inject(SMS_PROVIDER) private smsProvider: SmsProvider,
  ) {}

  async requestOtp(phone: string) {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

    await this.prisma.otpCode.create({ data: { phone, code, expiresAt } });
    await this.smsProvider.sendOtp(phone, code);

    return { message: 'Code envoyé', expiresInMinutes: OTP_TTL_MINUTES };
  }

  async verifyOtp(phone: string, code: string) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, code, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Code invalide ou expiré');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    return this.issueToken(user);
  }

  /**
   * Connexion rapide dev-login : strictement désactivée si ENABLE_DEV_LOGIN !== 'true'.
   * La liste blanche DEV_LOGIN_WHITELIST est obligatoire : sans elle (et sans
   * DEV_LOGIN_ALLOW_ALL=true en local), le mode est refusé (fail-closed) pour
   * qu'aucun numéro ne puisse être usurpé.
   */
  async devLogin(phone: string) {
    const isDevLoginEnabled = this.config.get('ENABLE_DEV_LOGIN') === 'true';
    if (!isDevLoginEnabled) {
      throw new ForbiddenException('Le mode dev-login est désactivé. Veuillez vous connecter via vérification OTP.');
    }

    if (typeof phone !== 'string') {
      throw new BadRequestException('Numéro de téléphone requis');
    }

    const normalizedPhone = phone.trim().replace(/\s+/g, '');
    if (!normalizedPhone) {
      throw new BadRequestException('Numéro de téléphone requis');
    }

    const whitelistRaw = this.config.get<string>('DEV_LOGIN_WHITELIST') || '';
    const whitelist = whitelistRaw
      .split(',')
      .map(p => p.trim().replace(/\s+/g, ''))
      .filter(Boolean);

    const isProduction =
      this.config.get('NODE_ENV') === 'production' ||
      this.config.get('ENVIRONMENT') === 'production';
    // Fail-closed : sans liste blanche explicite (ou autorisation locale
    // explicite), le dev-login reste fermé. Une variable oubliée ne doit
    // jamais ouvrir la connexion de n'importe quel numéro.
    const allowAll = this.config.get('DEV_LOGIN_ALLOW_ALL') === 'true';

    if (whitelist.length === 0 && !allowAll) {
      throw new ForbiddenException(
        isProduction
          ? 'Le mode dev-login est désactivé en production. Veuillez vous connecter via vérification OTP.'
          : 'Le mode dev-login est désactivé. Renseignez DEV_LOGIN_WHITELIST ou DEV_LOGIN_ALLOW_ALL=true.',
      );
    }

    if (whitelist.length > 0 && !whitelist.includes(normalizedPhone)) {
      throw new ForbiddenException('Ce numéro n\'est pas autorisé en mode dev-login.');
    }

    const user = await this.prisma.user.upsert({
      where: { phone: normalizedPhone },
      update: {},
      create: { phone: normalizedPhone },
    });

    return this.issueToken(user);
  }

  private issueToken(user: { id: string; phone: string; role: string }) {
    const accessToken = this.jwt.sign({ sub: user.id, phone: user.phone, role: user.role });
    return { accessToken, user };
  }

  async validateUserById(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
