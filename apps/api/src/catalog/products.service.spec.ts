import { Role } from "@prisma/client";
import { ProductsService } from "./products.service";
import { quantity } from "../commerce/rules";

describe("Permanent listing deletion", () => {
  const tx = {
    product: { findUnique: jest.fn(), delete: jest.fn() },
    orderItem: { count: jest.fn() },
    review: { deleteMany: jest.fn() },
  };
  const prisma = { $transaction: jest.fn((fn) => fn(tx)) };
  const service = new ProductsService(prisma as any, {} as any);
  beforeEach(() => {
    jest.clearAllMocks();
    tx.product.findUnique.mockResolvedValue({ id: "p1" });
    tx.orderItem.count.mockResolvedValue(0);
    tx.product.delete.mockResolvedValue({ id: "p1" });
  });
  it("rejects sellers before accessing the database", async () => {
    await expect(service.deleteListing("p1", Role.SELLER)).rejects.toThrow();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it("preserves products and reviews when an order references the listing", async () => {
    tx.orderItem.count.mockResolvedValue(1);
    await expect(service.deleteListing("p1", Role.ADMIN)).rejects.toThrow("commande");
    expect(tx.review.deleteMany).not.toHaveBeenCalled();
    expect(tx.product.delete).not.toHaveBeenCalled();
  });
  it("deletes an unreferenced listing and its reviews", async () => {
    await expect(service.deleteListing("p1", Role.ADMIN)).resolves.toEqual({ deleted: true, id: "p1" });
    expect(tx.product.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
    expect(tx.review.deleteMany).toHaveBeenCalledWith({ where: { productId: "p1" } });
  });
  it("reports missing listings", async () => {
    tx.product.findUnique.mockResolvedValue(null);
    await expect(service.deleteListing("missing", Role.ADMIN)).rejects.toThrow("introuvable");
    expect(tx.product.delete).not.toHaveBeenCalled();
  });
  it("handles a concurrent order safely via the database constraint", async () => {
    tx.product.delete.mockRejectedValueOnce({ code: "P2003" });
    await expect(service.deleteListing("p1", Role.ADMIN)).rejects.toThrow("commande");
  });
});

describe("Wholesale listings", () => {
  const create = jest.fn(async ({ data }) => data);
  const service = new ProductsService({ product: { create }, seller: { findFirst: jest.fn(async () => ({ id: "seller-baobab-official" })) } } as any, {} as any);
  const listing = { name: "Carton", description: "100 pièces", price: 500, stock: 500, categoryId: "trade", packSize: 100 };

  it("allows whole cartons without an additional minimum", async () => {
    await expect(service.create("admin", Role.ADMIN, listing)).resolves.toMatchObject({ packSize: 100 });
    await expect(service.create("admin", Role.ADMIN, { ...listing, minimumOrder: 1 })).resolves.toMatchObject({ minimumOrder: 1 });
    expect(quantity(100, 1, 100)).toBe(100);
    expect(() => quantity(1, 1, 100)).toThrow();
  });

  it("requires an explicit minimum to respect whole cartons", async () => {
    await expect(service.create("admin", Role.ADMIN, { ...listing, minimumOrder: 150 })).rejects.toThrow("multiple");
    await expect(service.create("admin", Role.ADMIN, { ...listing, minimumOrder: 200 })).resolves.toMatchObject({ minimumOrder: 200 });
  });
});
