CREATE TABLE "BusinessSetting" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessSetting_pkey" PRIMARY KEY ("key")
);
ALTER TABLE "BusinessSetting" ENABLE ROW LEVEL SECURITY;
-- Supplier prices are private; public catalogue access passes through the API.
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
INSERT INTO "BusinessSetting" ("key", "value", "updatedBy") VALUES
 ('whatsapp', '+971568934905', 'initial-configuration');
