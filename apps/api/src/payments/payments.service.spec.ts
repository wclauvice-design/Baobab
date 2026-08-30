import { PaymentAuditAction, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('PaymentsService.validate', () => {
  function buildService() {
    const payment = {
      id: 'pay1',
      orderId: 'order1',
      status: PaymentStatus.PENDING,
      amount: 25000,
      order: { buyerId: 'buyer1', buyer: { phone: '+22507000000' } },
    };

    const prisma = {
      order: { findUnique: jest.fn(), findMany: jest.fn() },
      payment: {
        findUnique: jest.fn().mockResolvedValue(payment),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      paymentAudit: { create: jest.fn() },
      $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
    } as any;

    const notifications = { notifyUser: jest.fn() } as any;
    const orders = {
      markConfirmed: jest.fn().mockResolvedValue({ id: 'order1' }),
      markCancelled: jest.fn().mockResolvedValue({ id: 'order1' }),
    } as any;
    const service = new PaymentsService(prisma, notifications, orders, {} as any, {} as any);
    return { service, prisma, notifications, orders, payment };
  }

  it('rejects re-validating a payment that is no longer PENDING', async () => {
    const { service, prisma, payment } = buildService();
    prisma.payment.findUnique.mockResolvedValueOnce({ ...payment, status: PaymentStatus.CONFIRMED });

    await expect(service.validate('admin1', 'pay1')).rejects.toThrow(
      'Ce paiement a déjà été traité',
    );
  });

  it('validate() writes an audit row and flips the order to CONFIRMED, then notifies the buyer', async () => {
    const { service, prisma, notifications, orders } = buildService();
    prisma.payment.findUnique.mockResolvedValueOnce({
      id: 'pay1',
      status: PaymentStatus.PENDING,
      orderId: 'order1',
      amount: 25000,
      order: { buyerId: 'buyer1', buyer: { phone: '+22507000000' } },
    }).mockResolvedValueOnce({ id: 'pay1', status: PaymentStatus.CONFIRMED });

    await service.validate('admin1', 'pay1');

    expect(prisma.paymentAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: PaymentAuditAction.VALIDATE, adminId: 'admin1' }),
      }),
    );
    expect(orders.markConfirmed).toHaveBeenCalledWith('order1');
    expect(orders.markCancelled).not.toHaveBeenCalled();
    expect(notifications.notifyUser).toHaveBeenCalledWith(
      'buyer1',
      '+22507000000',
      expect.stringContaining('confirmé'),
    );
  });

  it('reject() cancels the order instead of confirming it', async () => {
    const { service, prisma, notifications, orders } = buildService();
    prisma.payment.findUnique.mockResolvedValueOnce({
      id: 'pay1',
      status: PaymentStatus.PENDING,
      orderId: 'order1',
      amount: 25000,
      order: { buyerId: 'buyer1', buyer: { phone: '+22507000000' } },
    }).mockResolvedValueOnce({ id: 'pay1', status: PaymentStatus.FAILED });

    await service.reject('admin1', 'pay1');

    expect(orders.markCancelled).toHaveBeenCalledWith('order1');
    expect(orders.markConfirmed).not.toHaveBeenCalled();
    expect(notifications.notifyUser).toHaveBeenCalledWith(
      'buyer1',
      '+22507000000',
      expect.stringContaining("n'a pas pu être validé"),
    );
  });
});
