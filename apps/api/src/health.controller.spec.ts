import { HealthController } from './health.controller';
import { PrismaService } from './prisma/prisma.service';
import { ServiceUnavailableException } from '@nestjs/common';

describe('HealthController', () => {
  it('reports ready only after the database responds', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const controller = new HealthController(prisma as unknown as PrismaService);
    await expect(controller.check()).resolves.toEqual({ status: 'ok' });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('returns unavailable without exposing database details', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('private database details')) };
    const controller = new HealthController(prisma as unknown as PrismaService);
    await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);
    await expect(controller.check()).rejects.toThrow('Service temporairement indisponible');
  });
});
