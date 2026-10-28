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
  const service = new ProductsService({ product: { create }, seller: { findFirst: jest.fn(async () => ({ id: "seller-westzone-official" })) } } as any, {} as any);
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

describe("Listing publication and variants", () => {
  function buildPrisma(existing?: any) {
    const create = jest.fn(async ({ data }) => ({ id: "p-new", ...data }));
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findUnique = jest
      .fn()
      .mockResolvedValueOnce(existing)
      .mockImplementation(async () => ({ id: "p1", ...existing }));
    const prisma = {
      product: { create, updateMany, findUnique },
      seller: {
        findFirst: jest.fn(async () => ({ id: "seller-westzone-official" })),
        findUnique: jest.fn(async () => ({ id: "s1", status: "APPROVED" })),
      },
    } as any;
    return { service: new ProductsService(prisma, {} as any), prisma, create, updateMany };
  }

  const baseDto = {
    name: "Mèches lisses",
    description: "Cheveux humains, 12 pouces",
    price: 100,
    stock: 10,
    categoryId: "cat-beauty",
    sourcePrice: 100,
    sourceCurrency: "AED",
  };

  it("applies the ×1,75 public markup to a merchant listing", async () => {
    const { service, create } = buildPrisma();
    await service.create("seller-user", Role.SELLER, baseDto);

    const data = create.mock.calls[0][0].data;
    expect(data.supplierPrice).toBe(16500);
    expect(data.price).toBe(28875);
    expect(data.attributes.sourcePrice).toBe("100");
    expect(data.attributes.sourceCurrency).toBe("AED");
    expect(data.moderation).toBe("PENDING");
  });

  it("lets the admin fix the public price without applying the markup", async () => {
    const { service, create } = buildPrisma();
    await service.create("admin", Role.ADMIN, {
      ...baseDto,
      supplierPrice: 16500,
      price: 25000,
      sourcePrice: 100,
      sourcePublicPrice: 151.52,
    });

    const data = create.mock.calls[0][0].data;
    expect(data.supplierPrice).toBe(16500);
    expect(data.price).toBe(25000.8);
    expect(data.moderation).toBe("PUBLISHED");
  });

  it("derives the listing price and stock from active variants", async () => {
    const { service, create } = buildPrisma();
    await service.create("admin", Role.ADMIN, {
      name: "Écouteurs",
      description: "Bluetooth",
      price: 999,
      stock: 999,
      categoryId: "cat-tech",
      productType: "general",
      variantOptions: [{ name: "Couleur", values: ["Noir", "Blanc"] }],
      variants: [
        {
          id: "v1",
          sku: "BB-NOIR",
          values: { Couleur: "Noir" },
          price: 5000,
          supplierPrice: 3000,
          stock: 2,
          images: [],
          active: true,
        },
        {
          id: "v2",
          sku: "BB-BLANC",
          values: { Couleur: "Blanc" },
          price: 7000,
          supplierPrice: 4000,
          stock: 3,
          images: [],
          active: true,
        },
        {
          id: "v3",
          sku: "",
          values: { Couleur: "Rouge" },
          price: 0,
          stock: 0,
          images: [],
          active: false,
        },
      ],
    });

    const data = create.mock.calls[0][0].data;
    expect(data.price).toBe(5000);
    expect(data.supplierPrice).toBe(3000);
    expect(data.stock).toBe(5);
    expect(data.variants[2]).toMatchObject({ id: "v3", active: false, price: 0 });
  });

  it("recomputes every seller variant price from its merchant price", async () => {
    const { service, create } = buildPrisma();
    await service.create("seller-user", Role.SELLER, {
      name: "Écouteurs",
      description: "Bluetooth",
      price: 100,
      stock: 5,
      categoryId: "cat-tech",
      sourcePrice: 100,
      sourceCurrency: "AED",
      variantOptions: [{ name: "Couleur", values: ["Noir"] }],
      variants: [
        {
          id: "v1",
          sku: "BB-NOIR",
          values: { Couleur: "Noir" },
          price: 1,
          supplierPrice: 16500,
          stock: 5,
          images: [],
          active: true,
        },
      ],
    });

    const data = create.mock.calls[0][0].data;
    expect(data.variants[0].supplierPrice).toBe(16500);
    expect(data.variants[0].price).toBe(28875);
    expect(data.price).toBe(28875);
  });

  it("rejects an incomplete active combination", async () => {
    const { service } = buildPrisma();
    await expect(
      service.create("admin", Role.ADMIN, {
        ...baseDto,
        variantOptions: [{ name: "Couleur", values: ["Noir"] }],
        variants: [
          {
            id: "v1",
            sku: "",
            values: { Couleur: "Noir" },
            price: 0,
            stock: 1,
            images: [],
            active: true,
          },
        ],
      }),
    ).rejects.toThrow(/SKU|Prix/i);
  });

  it("refuses a stale catalog version instead of overwriting stock", async () => {
    const existing = {
      id: "p1",
      name: "Écouteurs",
      description: "Bluetooth",
      price: 5000,
      supplierPrice: 3000,
      stock: 5,
      categoryId: "cat-tech",
      categoryIds: ["cat-tech"],
      subcategory: "Autres",
      subcategories: ["Autres"],
      packSize: 1,
      minimumOrder: 1,
      images: [],
      variants: [],
      variantOptions: [],
      productType: "general",
      attributes: {},
      sellerId: "s1",
      moderation: "PUBLISHED",
      catalogVersion: 4,
    };
    const { service, updateMany } = buildPrisma(existing);

    await expect(
      service.update("admin", Role.ADMIN, "p1", {
        stock: 4,
        catalogVersion: 3,
      }),
    ).rejects.toThrow(/chang/i);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("fails cleanly when the stock changed between read and write", async () => {
    const existing = {
      id: "p1",
      name: "Écouteurs",
      description: "Bluetooth",
      price: 5000,
      supplierPrice: 3000,
      stock: 5,
      categoryId: "cat-tech",
      categoryIds: ["cat-tech"],
      subcategory: "Autres",
      subcategories: ["Autres"],
      packSize: 1,
      minimumOrder: 1,
      images: [],
      variants: [],
      variantOptions: [],
      productType: "general",
      attributes: {},
      sellerId: "s1",
      moderation: "PUBLISHED",
      catalogVersion: 4,
    };
    const { service, updateMany } = buildPrisma(existing);
    updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.update("admin", Role.ADMIN, "p1", {
        stock: 4,
        catalogVersion: 4,
      }),
    ).rejects.toThrow(/entre-temps/i);
  });

  it("never exposes merchant prices or internal attributes publicly", () => {
    const service = new ProductsService({} as any, {} as any);
    const product = {
      id: "p1",
      name: "Écouteurs",
      price: 5000,
      supplierPrice: 3000,
      attributes: {
        Couleur: "Noir",
        sourcePrice: "100",
        sourceCurrency: "AED",
        fxRate: "165",
        "Prix fournisseur": "3000",
        "Marge interne": "40",
      },
      variants: [
        {
          id: "v1",
          sku: "BB-NOIR",
          values: { Couleur: "Noir" },
          price: 5000,
          supplierPrice: 3000,
          cost: 2800,
          stock: 2,
          images: [],
          active: true,
        },
        {
          id: "v2",
          sku: "BB-BLANC",
          values: { Couleur: "Blanc" },
          price: 5000,
          supplierPrice: 3000,
          stock: 1,
          images: [],
          active: false,
        },
      ],
      category: null,
      seller: null,
      reviews: [],
    };

    const result = (service as any).publicProduct(product);

    expect(result.supplierPrice).toBeUndefined();
    expect(result.attributes).toEqual({ Couleur: "Noir" });
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]).toMatchObject({
      id: "v1",
      sku: "BB-NOIR",
      price: 5000,
      stock: 2,
      active: true,
    });
    expect(result.variants[0]).not.toHaveProperty("supplierPrice");
    expect(result.variants[0]).not.toHaveProperty("cost");
  });

  it("keeps the option values of an existing variant immutable", async () => {
    const existing = {
      id: "p1",
      name: "Écouteurs",
      description: "Bluetooth",
      price: 5000,
      supplierPrice: 3000,
      stock: 5,
      categoryId: "cat-tech",
      categoryIds: ["cat-tech"],
      subcategory: "Autres",
      subcategories: ["Autres"],
      packSize: 1,
      minimumOrder: 1,
      images: [],
      variants: [
        {
          id: "v1",
          sku: "BB-NOIR",
          values: { Couleur: "Noir" },
          price: 5000,
          supplierPrice: 3000,
          stock: 5,
          images: [],
          active: true,
        },
      ],
      variantOptions: [{ name: "Couleur", values: ["Noir", "Blanc"] }],
      productType: "general",
      attributes: {},
      sellerId: "s1",
      moderation: "PUBLISHED",
      catalogVersion: 4,
    };
    const { service, updateMany } = buildPrisma(existing);

    await expect(
      service.update("admin", Role.ADMIN, "p1", {
        catalogVersion: 4,
        variants: [
          {
            id: "v1",
            sku: "BB-NOIR",
            values: { Couleur: "Blanc" },
            price: 5000,
            supplierPrice: 3000,
            stock: 5,
            images: [],
            active: true,
          },
        ],
      }),
    ).rejects.toThrow(/conserve/i);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
