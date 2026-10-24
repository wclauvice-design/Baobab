const assert = require("node:assert/strict");
const { randomUUID } = require("crypto");
const { CommerceService } = require("./dist/commerce/commerce.service");
const { ProductsService } = require("./dist/catalog/products.service");
const { SellersService } = require("./dist/sellers/sellers.service");
module.exports = async (db) => {
  const config = { get: () => undefined },
    service = new CommerceService(db, config),
    catalog = new ProductsService(db, {}),
    sellers = new SellersService(db);
  const stamp = Date.now().toString().slice(-9),
    actor = "integration-admin";
  let checks = 0;
  async function rejects(fn, message) {
    await assert.rejects(fn, undefined, message);
    checks++;
  }
  const customer = await service.createCustomer({
    firstName: "Client",
    lastName: "TEST ISOLÉ",
    phone: `+226${stamp}`,
    country: "Burkina Faso",
    city: "Ouagadougou",
    address: "Adresse fictive — test isolé",
    messagingOptIn: false,
  });
  await rejects(
    () => service.createCustomer({ ...customer, phone: `+226 ${stamp}` }),
    "duplicate customer",
  );
  const sellerUser = await db.user.create({
    data: { phone: `+225${stamp}`, role: "SELLER" },
  });
  const seller = await db.seller.create({
    data: {
      userId: sellerUser.id,
      shopName: "Fournisseur TEST",
      city: "Dubai",
      status: "APPROVED",
    },
  });
  const product = await catalog.create(sellerUser.id, "SELLER", {
    name: "Téléphones en gros — TEST",
    description: "Annonce de test, non publiée en production",
    price: 100,
    supplierPrice: 60,
    stock: 50,
    categoryId: "baobab-classifieds",
    minimumOrder: 4,
    packSize: 2,
    subcategory: "Téléphones & tablettes",
    images: [],
  });
  assert.equal(product.moderation, "PENDING");
  await rejects(() => catalog.findOne(product.id), "moderation");
  await catalog.moderate(product.id, {
    moderation: "PUBLISHED",
    publicPrice: "100",
  });
  const visible = await catalog.findOne(product.id);
  assert.equal(visible.supplierPrice, undefined);
  assert.equal(visible.seller.userId, undefined);
  checks++;
  const conv = await service.startConversation({
    productId: product.id,
    body: "Je souhaite commander dix téléphones.",
    requestKey: randomUUID(),
  });
  await rejects(
    () => service.readConversation(conv.id, "x".repeat(43)),
    "private chat",
  );
  const msg = { body: "Destination Ouagadougou", requestKey: randomUUID() };
  await Promise.all([
    service.message(conv.id, msg, "CLIENT", conv.token),
    service.message(conv.id, msg, "CLIENT", conv.token),
  ]);
  assert.equal(
    (await service.readConversation(conv.id, conv.token)).messages.filter(
      (m) => m.body === msg.body,
    ).length,
    1,
  );
  checks++;
  await service.link(conv.id, customer.id);
  const order = await service.create(
      { customerId: customer.id, conversationId: conv.id },
      actor,
    ),
    token = order.trackingUrl.split("#")[1];
  const quote = {
    expectedRevision: 0,
    lines: [{ productId: product.id, quantity: 10, unitPrice: "100.00" }],
    logisticsCharge: "100.00",
    logisticsEstimate: "80.00",
    discount: "0.00",
    terms: "Transport inclus jusqu’à Ouagadougou. Paiement à la livraison.",
    destination: "Ouagadougou, Burkina Faso",
    paymentMode: "COD",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  };
  await rejects(
    () =>
      service.quote(
        order.id,
        { ...quote, lines: [{ ...quote.lines[0], quantity: 2 }] },
        actor,
      ),
    "MOQ",
  );
  await rejects(
    () =>
      service.quote(
        order.id,
        { ...quote, lines: [{ ...quote.lines[0], quantity: 5 }] },
        actor,
      ),
    "pack",
  );
  await service.quote(order.id, quote, actor);
  await rejects(() => service.quote(order.id, quote, actor), "stale revision");
  await rejects(
    () =>
      service.entry(
        order.id,
        {
          kind: "CLIENT_PAYMENT",
          amount: "10",
          reference: "test",
          requestKey: randomUUID(),
        },
        actor,
      ),
    "payment before acceptance",
  );
  await Promise.all([
    service.accept(order.id, token, { revision: 1 }),
    service.accept(order.id, token, { revision: 1 }),
  ]);
  assert.equal(
    (await db.product.findUnique({ where: { id: product.id } })).stock,
    40,
  );
  checks++;
  const publicOrder = await service.track(order.id, token);
  assert.equal(publicOrder.quote.lines[0].supplierUnitPrice, undefined);
  assert.equal(publicOrder.customer, undefined);
  checks++;
  const payment = {
    kind: "CLIENT_PAYMENT",
    amount: "600.00",
    reference: "receipt-A",
    requestKey: randomUUID(),
  };
  const concurrent = await Promise.allSettled([
    service.entry(order.id, payment, actor),
    service.entry(
      order.id,
      { ...payment, reference: "receipt-B", requestKey: randomUUID() },
      actor,
    ),
  ]);
  assert.equal(concurrent.filter((r) => r.status === "fulfilled").length, 1);
  checks++;
  const first = await service.one(order.id),
    existing = first.entries.find((e) => e.kind === "CLIENT_PAYMENT");
  await service.entry(
    order.id,
    {
      ...payment,
      reference: existing.reference,
      requestKey: existing.requestKey,
    },
    actor,
  );
  assert.equal((await service.one(order.id)).finance.paid, "600.00");
  checks++;
  await service.declare(order.id, token, {
    amount: "100",
    reference: "client declaration",
    requestKey: randomUUID(),
  });
  const pending = await service.one(order.id);
  assert.equal(pending.finance.due, "500.00");
  assert.equal(pending.finance.pendingPayments, 1);
  await rejects(
    () => service.reminder(order.id, "WHATSAPP"),
    "reminder while pending",
  );
  await service.confirmEntry(
    order.id,
    pending.entries.find((e) => e.state === "PENDING").id,
    true,
    actor,
  );
  assert.equal((await service.one(order.id)).finance.due, "400.00");
  checks++;
  await service.quote(
    order.id,
    {
      ...quote,
      expectedRevision: 1,
      lines: [{ ...quote.lines[0], quantity: 12 }],
    },
    actor,
  );
  assert.equal((await service.one(order.id)).finance.total, "1100.00");
  await rejects(
    () => service.accept(order.id, token, { revision: 1 }),
    "superseded quote",
  );
  await service.accept(order.id, token, { revision: 2 });
  assert.equal(
    (await db.product.findUnique({ where: { id: product.id } })).stock,
    38,
  );
  assert.equal((await service.one(order.id)).finance.due, "600.00");
  checks++;
  await service.entry(
    order.id,
    {
      kind: "COD_COLLECTION",
      amount: "600",
      reference: "collected by courier",
      requestKey: randomUUID(),
    },
    actor,
  );
  let f = (await service.one(order.id)).finance;
  assert.equal(f.due, "0.00");
  assert.equal(f.courierDue, "600.00");
  assert.equal(f.cashReceived, "700.00");
  await rejects(
    () =>
      service.entry(
        order.id,
        {
          kind: "COURIER_REMITTANCE",
          amount: "601",
          reference: "excess remittance",
          requestKey: randomUUID(),
        },
        actor,
      ),
    "excess courier remittance",
  );
  await service.entry(
    order.id,
    {
      kind: "COURIER_REMITTANCE",
      amount: "600",
      reference: "received from courier",
      requestKey: randomUUID(),
    },
    actor,
  );
  f = (await service.one(order.id)).finance;
  assert.equal(f.paid, "1300.00");
  assert.equal(f.cashReceived, "1300.00");
  assert.equal(f.courierDue, "0.00");
  checks++;
  await rejects(
    () => service.reminder(order.id, "WHATSAPP"),
    "reminder when settled",
  );
  await rejects(
    () =>
      service.status(
        order.id,
        { status: "DELIVERED", message: "skip test" },
        actor,
      ),
    "skip logistics",
  );
  for (const status of [
    "PREPARING",
    "HANDED_TO_CARRIER",
    "IN_TRANSIT",
    "ARRIVED",
    "CUSTOMS",
    "LOCAL_DELIVERY",
    "DELIVERED",
  ])
    await service.status(
      order.id,
      { status, message: `Étape de test ${status}` },
      actor,
    );
  await service.entry(
    order.id,
    {
      kind: "LOGISTICS_COST",
      amount: "90",
      reference: "logistics invoice",
      requestKey: randomUUID(),
    },
    actor,
  );
  await service.entry(
    order.id,
    {
      kind: "SUPPLIER_PAYMENT",
      amount: "720",
      supplierId: seller.id,
      reference: "supplier receipt",
      requestKey: randomUUID(),
    },
    actor,
  );
  await service.closeCosts(order.id, actor);
  await service.closeCosts(order.id, actor);
  f = (await service.one(order.id)).finance;
  assert.equal(f.actualMargin, "490.00");
  assert.equal(f.supplierDue, "0.00");
  await rejects(
    () =>
      service.entry(
        order.id,
        {
          kind: "LOGISTICS_COST",
          amount: "1",
          reference: "late invoice",
          requestKey: randomUUID(),
        },
        actor,
      ),
    "closed costs",
  );
  const dashboard = await sellers.dashboard(sellerUser.id);
  assert.equal(dashboard.paid, "720.00");
  assert.equal(dashboard.settlements[0].customer, undefined);
  assert.equal(dashboard.settlements[0].trackingHash, undefined);
  checks++;
  const newLink = await service.rotate(order.id, actor);
  await rejects(() => service.track(order.id, token), "revoked link");
  assert.equal(
    (await service.track(order.id, newLink.trackingUrl.split("#")[1]))
      .reference,
    order.reference,
  );
  const buyer = await db.user.create({ data: { phone: customer.phone } });
  assert.equal((await service.mine(buyer.id)).verificationRequired, true);
  checks++;
  const cancelled = await service.create({ customerId: customer.id }, actor),
    ct = cancelled.trackingUrl.split("#")[1];
  await service.quote(cancelled.id, quote, actor);
  await service.accept(cancelled.id, ct, { revision: 1 });
  await service.entry(
    cancelled.id,
    {
      kind: "CLIENT_PAYMENT",
      amount: "100",
      reference: "deposit to refund",
      requestKey: randomUUID(),
    },
    actor,
  );
  await service.status(
    cancelled.id,
    { status: "CANCELLED", message: "Annulation demandée en test" },
    actor,
  );
  assert.equal((await service.one(cancelled.id)).finance.refundDue, "100.00");
  assert.equal(
    (await db.product.findUnique({ where: { id: product.id } })).stock,
    38,
  );
  checks++;
  await service.entry(
    cancelled.id,
    {
      kind: "CUSTOMER_REFUND",
      amount: "100",
      reference: "refunded deposit",
      requestKey: randomUUID(),
    },
    actor,
  );
  assert.equal((await service.one(cancelled.id)).finance.refundDue, "0.00");
  // Seed login accounts only in the isolated schema for browser/API permission checks.
  await db.user.upsert({
    where: { phone: "+2250101010101" },
    update: {},
    create: { phone: "+2250101010101", role: "ADMIN" },
  });
  await db.user.upsert({
    where: { phone: "+2250101010102" },
    update: {},
    create: { phone: "+2250101010102", role: "BUYER" },
  });
  console.log(
    `${checks} critical integration assertions: money, stock, idempotency, revision, privacy, COD, cancellation.`,
  );
};
