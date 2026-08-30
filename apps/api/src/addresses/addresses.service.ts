import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  findMine(buyerId: string) {
    return this.prisma.address.findMany({
      where: { buyerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(buyerId: string, dto: CreateAddressDto) {
    const existingCount = await this.prisma.address.count({ where: { buyerId } });
    const makeDefault = dto.isDefault || existingCount === 0;

    return this.prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.address.updateMany({ where: { buyerId }, data: { isDefault: false } });
      }
      return tx.address.create({
        data: { ...dto, buyerId, isDefault: makeDefault },
      });
    });
  }

  async update(buyerId: string, id: string, dto: UpdateAddressDto) {
    await this.assertOwnership(buyerId, id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({ where: { buyerId }, data: { isDefault: false } });
      }
      return tx.address.update({ where: { id }, data: dto });
    });
  }

  async setDefault(buyerId: string, id: string) {
    await this.assertOwnership(buyerId, id);

    return this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({ where: { buyerId }, data: { isDefault: false } });
      return tx.address.update({ where: { id }, data: { isDefault: true } });
    });
  }

  async remove(buyerId: string, id: string) {
    const address = await this.assertOwnership(buyerId, id);
    await this.prisma.address.delete({ where: { id } });

    if (address.isDefault) {
      const next = await this.prisma.address.findFirst({
        where: { buyerId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await this.prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
  }

  private async assertOwnership(buyerId: string, id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Adresse introuvable');
    if (address.buyerId !== buyerId) throw new ForbiddenException();
    return address;
  }
}
