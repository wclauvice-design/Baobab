import { Role } from "@prisma/client";
import { ProductsService } from "./products.service";
import { quantity } from "../commerce/rules";

describe("Wholesale listings", () => {
  const create = jest.fn(async ({ data }) => data);
  const service = new ProductsService({ product: { create } } as any, {} as any);
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
