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
   * Connexion sans OTP pour n'importe quel numéro, le temps de brancher un
   * vrai fournisseur SMS. Volontairement ouverte à tous les numéros pendant
   * cette phase de test (pas de liste blanche) — reste gardée derrière
   * ENABLE_DEV_LOGIN, qui doit être désactivé avant tout lancement public.
   * À supprimer (cette méthode + l'écran de connexion correspondant côté
   * PWA/admin) une fois un SmsProvider réel en place.
   */
  async devLogin(phone: string) {
    if (this.config.get('ENABLE_DEV_LOGIN') !== 'true') {
      throw new ForbiddenException();
    }

    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
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
