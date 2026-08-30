import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SMS_PROVIDER, SmsProvider } from './sms/sms-provider.interface';

const OTP_TTL_MINUTES = 5;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
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

    const accessToken = this.jwt.sign({ sub: user.id, phone: user.phone, role: user.role });
    return { accessToken, user };
  }

  async validateUserById(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
