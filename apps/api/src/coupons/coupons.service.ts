import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  findMine(buyerId: string) {
    return this.prisma.coupon.findMany({
      where: { buyerId, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async validateCode(code: string, userId?: string) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      throw new BadRequestException('Code requis');
    }

    const coupon = await this.prisma.coupon.findFirst({
      where: {
        label: cleanCode,
        isUsed: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        ...(userId ? { buyerId: userId } : {}),
      },
    });

    if (!coupon) {
      if (cleanCode === 'BIENVENUE' || cleanCode === 'WESTZONE5000') {
        return {
          valid: true,
          code: cleanCode,
          discountAmount: 5000,
          label: 'Code de Bienvenue Westzone (5 000 FCFA offerts)',
        };
      }
      throw new BadRequestException('Code promo ou parrainage invalide ou expiré');
    }

    return {
      valid: true,
      id: coupon.id,
      code: coupon.label,
      discountAmount: Number(coupon.discountAmount),
      label: coupon.label,
    };
  }
}
