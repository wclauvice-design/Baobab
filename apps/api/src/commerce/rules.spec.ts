import { amount, financials, minor, phone, quantity } from "./rules";
const order = (entries: any[] = [], extra: any = {}) => ({
  status: "CONFIRMED",
  acceptedRevision: 1,
  currentRevision: 1,
  quotes: [
    {
      revision: 1,
      total: "150.30",
      supplierTotal: "80.10",
      logisticsEstimate: "20.20",
    },
  ],
  entries,
  ...extra,
});
const entry = (kind: string, value: string, state = "CONFIRMED") => ({
  kind,
  amount: value,
  state,
});
describe("Westzone financial and wholesale rules", () => {
  it("keeps exact minor units and rejects ambiguous money", () => {
    expect(amount(minor("0.10") + minor("0.20"))).toBe("0.30");
    for (const value of ["-1", "1e3", "0.001", "NaN", "1,25", "10000000000"])
      expect(() => minor(value)).toThrow();
  });
  it("enforces minimum and pack independently", () => {
    expect(quantity(12, 6, 6)).toBe(12);
    for (const n of [0, 1, 7, 1.5]) expect(() => quantity(n, 6, 6)).toThrow();
    expect(quantity(6, 1, 6)).toBe(6);
  });
  it("normalizes international phone without guessing a country", () => {
    expect(phone("+226 76 95 00 89")).toBe("+22676950089");
    expect(() => phone("76950089")).toThrow();
  });
  it("does not count a declaration or rejected payment as received", () => {
    const f = financials(
      order([
        entry("CLIENT_PAYMENT", "50", "PENDING"),
        entry("CLIENT_PAYMENT", "40", "REJECTED"),
      ]),
    );
    expect(f.paid).toBe("0.00");
    expect(f.due).toBe("150.30");
    expect(f.pendingPayments).toBe(1);
  });
  it("keeps courier cash separate and never counts its remittance as a second customer payment", () => {
    const f = financials(
      order([
        entry("CLIENT_PAYMENT", "50.10"),
        entry("COD_COLLECTION", "100.20"),
        entry("COURIER_REMITTANCE", "70.20"),
      ]),
    );
    expect(f.paid).toBe("150.30");
    expect(f.due).toBe("0.00");
    expect(f.courierDue).toBe("30.00");
    expect(f.cashReceived).toBe("120.30");
  });
  it("keeps accepted economics while a revised quote waits for approval", () => {
    const o = order([], { currentRevision: 2, status: "QUOTED" });
    o.quotes.push({
      revision: 2,
      total: "250.30",
      supplierTotal: "180.10",
      logisticsEstimate: "20.20",
    });
    expect(financials(o).due).toBe("150.30");
  });
  it("does not charge a draft and accounts for cancellation refunds", () => {
    expect(financials(order([], { acceptedRevision: null })).due).toBe("0.00");
    const f = financials(
      order(
        [entry("CLIENT_PAYMENT", "60.10"), entry("CUSTOMER_REFUND", "10.10")],
        { status: "CANCELLED" },
      ),
    );
    expect(f.due).toBe("0.00");
    expect(f.refundDue).toBe("50.00");
    expect(f.supplierDue).toBe("0.00");
  });
  it("separates cash balance from realized margin and waits for cost closure", () => {
    const entries = [
      entry("CLIENT_PAYMENT", "150.30"),
      entry("SUPPLIER_PAYMENT", "40.00"),
      entry("LOGISTICS_COST", "25.10"),
    ];
    expect(
      financials(order(entries, { status: "DELIVERED" })).actualMargin,
    ).toBeNull();
    const f = financials(
      order(entries, { status: "DELIVERED", logisticsFinalized: true }),
    );
    expect(f.actualMargin).toBe("45.10");
    expect(f.cashBalance).toBe("85.20");
    expect(f.supplierDue).toBe("40.10");
  });
});
