import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(buyerId: string, dto: CreateReviewDto) {
    const delivered = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: { buyerId, status: OrderStatus.DELIVERED },
      },
    });
    if (!delivered) {
      throw new BadRequestException("Vous ne pouvez laisser un avis qu'après livraison de ce produit");
    }

    return this.prisma.review.create({
      data: { productId: dto.productId, buyerId, rating: dto.rating, comment: dto.comment },
    });
  }

  findForProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      include: { buyer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findMine(buyerId: string) {
    return this.prisma.review.findMany({
      where: { buyerId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
