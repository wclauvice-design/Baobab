import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '@prisma/client';
import { ManualOrangeMoneyProvider } from './manual-orange-money.provider';

describe('ManualOrangeMoneyProvider', () => {
  const order = { id: 'order1', totalAmount: 25000, currency: 'XOF' } as any;

  function buildProvider(existingReferences: string[] = []) {
    const prisma = {
      payment: {
        findUnique: jest.fn(({ where: { reference } }: any) =>
          existingReferences.includes(reference) ? { reference } : null,
        ),
      },
    } as any;
    const config = { get: () => '+225 07 00 00 00 00' } as unknown as ConfigService;
    return new ManualOrangeMoneyProvider(prisma, config);
  }

  it('generates a BA-#### reference and PENDING status with instructions', async () => {
    const provider = buildProvider();
    const result = await provider.initiate(order);

    expect(result.reference).toMatch(/^BA-\d{4}$/);
    expect(result.status).toBe(PaymentStatus.PENDING);
    expect(result.instructions).toContain(result.reference);
    expect(result.instructions).toContain('25000');
    expect(result.merchantNumber).toBe('+225 07 00 00 00 00');
  });

  it('retries generation until it finds a reference not already taken', async () => {
    const clashing = 'BA-1234';
    const provider = buildProvider([clashing]);
    jest
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.234) // -> BA-1234 (taken)
      .mockReturnValueOnce(0.876); // -> next distinct candidate

    const result = await provider.initiate(order);
    expect(result.reference).not.toBe(clashing);

    (Math.random as jest.Mock).mockRestore();
  });
});
