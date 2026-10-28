import { OrderStatus, PaymentProviderType, PaymentStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from './orders.service';

function config(): ConfigService {
  return { get: () => 45 } as unknown as ConfigService;
}

describe('OrdersService.expireUnpaidOrders', () => {
  it('marks overdue PENDING_PAYMENT orders as EXPIRED, releases stock, and expires their payment', async () => {
    const staleOrder = {
      id: 'order1',
      items: [{ productId: 'p1', quantity: 2 }],
      payment: { id: 'pay1', status: PaymentStatus.PENDING },
    };
    const product = {
      id: 'p1',
      stock: 3,
      catalogVersion: 4,
      variants: [],
    };

    const tx = {
      order: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
      },
      product: {
        findUnique: jest.fn().mockResolvedValue(product),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      payment: { update: jest.fn() },
      deliveryEvent: { create: jest.fn() },
    };

    const prisma = {
      order: { findMany: jest.fn().mockResolvedValue([staleOrder]) },
      $transaction: jest.fn((fn: any) => fn(tx)),
    } as any;

    const service = new OrdersService(prisma, config());
    await service.expireUnpaidOrders();

    expect(tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order1', status: OrderStatus.PENDING_PAYMENT },
      data: { status: OrderStatus.EXPIRED },
    });
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', catalogVersion: 4 },
      data: {
        stock: { increment: 2 },
        variants: [],
        catalogVersion: { increment: 1 },
      },
    });
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay1' },
      data: { status: PaymentStatus.EXPIRED },
    });
    expect(tx.deliveryEvent.create).toHaveBeenCalledWith({
      data: { orderId: 'order1', status: OrderStatus.EXPIRED },
    });
  });

  it('restores the reserved quantity on the exact variant', async () => {
    const staleOrder = {
      id: 'order-variant',
      items: [{ productId: 'p1', variantId: 'v1', quantity: 2 }],
      payment: { id: 'pay1', status: PaymentStatus.PENDING },
    };
    const product = {
      id: 'p1',
      stock: 1,
      catalogVersion: 9,
      variants: [
        {
          id: 'v1',
          sku: 'BB-NOIR',
          values: { Couleur: 'Noir' },
          price: 5000,
          supplierPrice: 2857,
          stock: 1,
          images: [],
          active: true,
        },
      ],
    };
    const tx = {
      order: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
      },
      product: {
        findUnique: jest.fn().mockResolvedValue(product),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      payment: { update: jest.fn() },
      deliveryEvent: { create: jest.fn() },
    };
    const prisma = {
      order: { findMany: jest.fn().mockResolvedValue([staleOrder]) },
      $transaction: jest.fn((fn: any) => fn(tx)),
    } as any;

    await new OrdersService(prisma, config()).expireUnpaidOrders();

    const data = tx.product.updateMany.mock.calls[0][0].data;
    expect(data.stock).toEqual({ increment: 2 });
    expect(data.variants[0].stock).toBe(3);
    expect(tx.payment.update).toHaveBeenCalled();
  });

  it('does not touch a payment that is already CONFIRMED', async () => {
    const staleOrder = {
      id: 'order2',
      items: [{ productId: 'p2', quantity: 1 }],
      payment: { id: 'pay2', status: PaymentStatus.CONFIRMED },
    };
    const tx = {
      order: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
      },
      product: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'p2',
          stock: 5,
          catalogVersion: 1,
          variants: [],
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      payment: { update: jest.fn() },
      deliveryEvent: { create: jest.fn() },
    };
    const prisma = {
      order: { findMany: jest.fn().mockResolvedValue([staleOrder]) },
      $transaction: jest.fn((fn: any) => fn(tx)),
    } as any;

    await new OrdersService(prisma, config()).expireUnpaidOrders();

    expect(tx.payment.update).not.toHaveBeenCalled();
  });

  it('does not release stock twice when another worker already expired the order', async () => {
    const staleOrder = {
      id: 'order3',
      items: [{ productId: 'p1', quantity: 1 }],
      payment: null,
    };
    const tx = {
      order: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      payment: { update: jest.fn() },
      deliveryEvent: { create: jest.fn() },
    };
    const prisma = {
      order: { findMany: jest.fn().mockResolvedValue([staleOrder]) },
      $transaction: jest.fn((fn: any) => fn(tx)),
    } as any;

    await new OrdersService(prisma, config()).expireUnpaidOrders();

    expect(tx.product.findUnique).not.toHaveBeenCalled();
    expect(tx.product.updateMany).not.toHaveBeenCalled();
  });
});

describe('OrdersService.create', () => {
  const baseProduct = {
    id: 'p1',
    price: 3500,
    stock: 10,
    moderation: 'PUBLISHED',
    minimumOrder: 1,
    packSize: 1,
    name: 'Beurre de karité',
    catalogVersion: 0,
    variants: [],
    seller: null,
  };

  const variantProduct = {
    id: 'p2',
    price: 5000,
    stock: 3,
    moderation: 'PUBLISHED',
    minimumOrder: 1,
    packSize: 1,
    name: 'Écouteurs sans fil',
    catalogVersion: 2,
    seller: null,
    variants: [
      {
        id: 'v1',
        sku: 'BB-EAR-NOIR',
        values: { Couleur: 'Noir' },
        price: 5000,
        supplierPrice: 2857,
        stock: 3,
        images: [],
        active: true,
      },
    ],
  };

  function buildService(product: any = baseProduct) {
    const tx = {
      order: {
        create: jest
          .fn()
          .mockResolvedValue({ id: 'order1', status: OrderStatus.PENDING_PAYMENT }),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([product]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      deliveryEvent: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((fn: any) => fn(tx)),
    } as any;
    return { service: new OrdersService(prisma, config()), tx };
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
      expect.objectContaining({
        data: expect.objectContaining({ totalAmount: 3500, deliveryFee: 0 }),
      }),
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
      expect.objectContaining({
        data: expect.objectContaining({ totalAmount: 4500, deliveryFee: 1000 }),
      }),
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

  it('reserves the chosen variant and snapshots its label and SKU', async () => {
    const { service, tx } = buildService(variantProduct);
    await service.create('buyer1', {
      items: [{ productId: 'p2', variantId: 'v1', quantity: 2 }],
      deliveryAddress: 'Ouagadougou',
      deliveryMode: 'STANDARD' as any,
      provider: PaymentProviderType.MANUAL_ORANGE_MONEY,
    });

    const orderData = tx.order.create.mock.calls[0][0].data;
    expect(orderData.totalAmount).toBe(10000);
    expect(orderData.items.create[0]).toEqual(
      expect.objectContaining({
        productId: 'p2',
        variantId: 'v1',
        variantSku: 'BB-EAR-NOIR',
        quantity: 2,
        unitPrice: 5000,
      }),
    );
    expect(orderData.items.create[0].variantLabel).toContain('Couleur');

    const reservation = tx.product.updateMany.mock.calls[0][0];
    expect(reservation.where).toEqual({
      id: 'p2',
      catalogVersion: 2,
      moderation: 'PUBLISHED',
    });
    expect(reservation.data.stock).toBe(1);
    expect(reservation.data.variants[0].stock).toBe(1);
  });

  it('rejects a missing variant when the listing has active combinations', async () => {
    const { service } = buildService(variantProduct);
    await expect(
      service.create('buyer1', {
        items: [{ productId: 'p2', quantity: 1 }],
        deliveryAddress: 'Ouagadougou',
        deliveryMode: 'STANDARD' as any,
        provider: PaymentProviderType.MANUAL_ORANGE_MONEY,
      }),
    ).rejects.toThrow(/variante/i);
  });

  it('rejects a quantity above the variant stock', async () => {
    const { service } = buildService(variantProduct);
    await expect(
      service.create('buyer1', {
        items: [{ productId: 'p2', variantId: 'v1', quantity: 4 }],
        deliveryAddress: 'Ouagadougou',
        deliveryMode: 'STANDARD' as any,
        provider: PaymentProviderType.MANUAL_ORANGE_MONEY,
      }),
    ).rejects.toThrow(/stock/i);
  });

  it('fails cleanly when the listing changed between read and reservation', async () => {
    const { service, tx } = buildService(variantProduct);
    tx.product.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.create('buyer1', {
        items: [{ productId: 'p2', variantId: 'v1', quantity: 1 }],
        deliveryAddress: 'Ouagadougou',
        deliveryMode: 'STANDARD' as any,
        provider: PaymentProviderType.MANUAL_ORANGE_MONEY,
      }),
    ).rejects.toThrow(/actualisez/i);
  });
});

describe('OrdersService.markConfirmed / markCancelled', () => {
  function buildService() {
    const order = {
      id: 'order1',
      status: OrderStatus.CONFIRMED,
      items: [],
      payment: null,
    };
    const tx = {
      order: {
        findUnique: jest.fn().mockResolvedValue(order),
        update: jest.fn().mockResolvedValue({ id: 'order1' }),
      },
      product: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      payment: { update: jest.fn() },
      deliveryEvent: { create: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((fn: any) => fn(tx)) } as any;
    return { service: new OrdersService(prisma, {} as ConfigService), tx };
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

  it('markCancelled releases the reserved variant stock', async () => {
    const { service, tx } = buildService();
    tx.order.findUnique.mockResolvedValue({
      id: 'order1',
      status: OrderStatus.CONFIRMED,
      items: [{ productId: 'p2', variantId: 'v1', quantity: 2 }],
      payment: null,
    });
    tx.product.findUnique.mockResolvedValue({
      id: 'p2',
      stock: 1,
      catalogVersion: 3,
      variants: [
        {
          id: 'v1',
          sku: 'BB-EAR-NOIR',
          values: { Couleur: 'Noir' },
          price: 5000,
          supplierPrice: 2857,
          stock: 1,
          images: [],
          active: true,
        },
      ],
    });
    tx.product.updateMany.mockResolvedValue({ count: 1 });

    await service.markCancelled('order1');

    const data = tx.product.updateMany.mock.calls[0][0].data;
    expect(data.stock).toEqual({ increment: 2 });
    expect(data.variants[0].stock).toBe(3);
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order1' },
      data: { status: OrderStatus.CANCELLED },
    });
  });
});
