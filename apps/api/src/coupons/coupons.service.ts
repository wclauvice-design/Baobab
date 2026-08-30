import { Injectable } from '@nestjs/common';
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
}
