import { OrderStatus, PaymentProviderType, PaymentStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from './orders.service';

describe('OrdersService.expireUnpaidOrders', () => {
  it('marks overdue PENDING_PAYMENT orders as EXPIRED, releases stock, and expires their payment', async () => {
    const staleOrder = {
      id: 'order1',
      items: [{ productId: 'p1', quantity: 2 }],
      payment: { id: 'pay1', status: PaymentStatus.PENDING },
    };

    const tx = {
      order: { update: jest.fn() },
      product: { update: jest.fn() },
      payment: { update: jest.fn() },
      deliveryEvent: { create: jest.fn() },
    };

    const prisma = {
      order: { findMany: jest.fn().mockResolvedValue([staleOrder]) },
      $transaction: jest.fn((fn: any) => fn(tx)),
    } as any;

    const config = { get: () => 45 } as unknown as ConfigService;
    const service = new OrdersService(prisma, config);

    await service.expireUnpaidOrders();

    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order1' },
      data: { status: OrderStatus.EXPIRED },
    });
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { stock: { increment: 2 } },
    });
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay1' },
      data: { status: PaymentStatus.EXPIRED },
    });
    expect(tx.deliveryEvent.create).toHaveBeenCalledWith({
      data: { orderId: 'order1', status: OrderStatus.EXPIRED },
    });
  });

  it('does not touch a payment that is already CONFIRMED', async () => {
    const staleOrder = {
      id: 'order2',
      items: [{ productId: 'p2', quantity: 1 }],
      payment: { id: 'pay2', status: PaymentStatus.CONFIRMED },
    };

    const tx = {
      order: { update: jest.fn() },
      product: { update: jest.fn() },
      payment: { update: jest.fn() },
      deliveryEvent: { create: jest.fn() },
    };

    const prisma = {
      order: { findMany: jest.fn().mockResolvedValue([staleOrder]) },
      $transaction: jest.fn((fn: any) => fn(tx)),
    } as any;

    const config = { get: () => 45 } as unknown as ConfigService;
    const service = new OrdersService(prisma, config);

    await service.expireUnpaidOrders();

    expect(tx.payment.update).not.toHaveBeenCalled();
  });
});

describe('OrdersService.create', () => {
  function buildService() {
    const product = { id: 'p1', price: 3500, stock: 10, name: 'Beurre de karité' };
    const tx = {
      order: { create: jest.fn().mockResolvedValue({ id: 'order1', status: OrderStatus.PENDING_PAYMENT }) },
      product: { update: jest.fn() },
      deliveryEvent: { create: jest.fn() },
    };
    const prisma = {
      product: { findMany: jest.fn().mockResolvedValue([product]) },
      $transaction: jest.fn((fn: any) => fn(tx)),
    } as any;
    const config = { get: () => 45 } as unknown as ConfigService;
    return { service: new OrdersService(prisma, config), tx };
  }

  it('adds no delivery fee for Manual Orange Money', async () => {
    const { service, tx } = buildService();
    await service.create('buyer1', {
      items: [{ productId: 'p1', quantity: 1 }],
      deliveryAddress: 'Cocody',
      deliveryMode: 'STANDARD' as any,
      provider: PaymentProviderType.MANUAL_ORANGE_MONEY,
    });

    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ totalAmount: 3500, deliveryFee: 0 }) }),
    );
  });

  it('adds the 1000 XOF cash-on-delivery fee on top of the items total', async () => {
    const { service, tx } = buildService();
    await service.create('buyer1', {
      items: [{ productId: 'p1', quantity: 1 }],
      deliveryAddress: 'Cocody',
      deliveryMode: 'STANDARD' as any,
      provider: PaymentProviderType.CASH_ON_DELIVERY,
    });

    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ totalAmount: 4500, deliveryFee: 1000 }) }),
    );
  });

  it('logs an initial PENDING_PAYMENT delivery event', async () => {
    const { service, tx } = buildService();
    await service.create('buyer1', {
      items: [{ productId: 'p1', quantity: 1 }],
      deliveryAddress: 'Cocody',
      deliveryMode: 'STANDARD' as any,
      provider: PaymentProviderType.MANUAL_ORANGE_MONEY,
    });

    expect(tx.deliveryEvent.create).toHaveBeenCalledWith({
      data: { orderId: 'order1', status: OrderStatus.PENDING_PAYMENT },
    });
  });
});

describe('OrdersService.markConfirmed / markCancelled', () => {
  function buildService() {
    const tx = {
      order: { update: jest.fn().mockResolvedValue({ id: 'order1' }) },
      deliveryEvent: { create: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((fn: any) => fn(tx)) } as any;
    const config = {} as ConfigService;
    return { service: new OrdersService(prisma, config), tx };
  }

  it('markConfirmed sets CONFIRMED and logs the event', async () => {
    const { service, tx } = buildService();
    await service.markConfirmed('order1');

    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order1' },
      data: { status: OrderStatus.CONFIRMED },
    });
    expect(tx.deliveryEvent.create).toHaveBeenCalledWith({
      data: { orderId: 'order1', status: OrderStatus.CONFIRMED },
    });
  });

  it('markCancelled sets CANCELLED and logs the event', async () => {
    const { service, tx } = buildService();
    await service.markCancelled('order1');

    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order1' },
      data: { status: OrderStatus.CANCELLED },
    });
    expect(tx.deliveryEvent.create).toHaveBeenCalledWith({
      data: { orderId: 'order1', status: OrderStatus.CANCELLED },
    });
  });
});
