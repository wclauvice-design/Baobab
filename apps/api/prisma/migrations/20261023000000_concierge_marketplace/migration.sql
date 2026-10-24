-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verifiedPhoneAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "universe" TEXT NOT NULL DEFAULT 'classifieds';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "attributes" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "condition" TEXT NOT NULL DEFAULT 'NEW',
ADD COLUMN     "dimensions" TEXT,
ADD COLUMN     "location" TEXT NOT NULL DEFAULT 'Dubaï',
ADD COLUMN     "minimumOrder" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "moderation" TEXT NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "moderationNote" TEXT,
ADD COLUMN     "packSize" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "shippingDestination" TEXT,
ADD COLUMN     "shippingIncluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subcategory" TEXT NOT NULL DEFAULT 'Autres',
ADD COLUMN     "supplierPrice" DECIMAL(12,2),
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'pièce',
ADD COLUMN     "weightKg" DECIMAL(10,3);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "messagingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "productId" TEXT,
    "subject" TEXT NOT NULL,
    "customerId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'OPEN',
    "needsReply" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeOrder" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "conversationId" TEXT,
    "trackingHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentRevision" INTEGER NOT NULL DEFAULT 0,
    "acceptedRevision" INTEGER,
    "acceptedAt" TIMESTAMP(3),
    "logisticsFinalized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeQuote" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "lines" JSONB NOT NULL,
    "productTotal" DECIMAL(12,2) NOT NULL,
    "supplierTotal" DECIMAL(12,2) NOT NULL,
    "logisticsCharge" DECIMAL(12,2) NOT NULL,
    "logisticsEstimate" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "terms" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "estimatedDelivery" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeEntry" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "reference" TEXT NOT NULL,
    "note" TEXT,
    "supplierId" TEXT,
    "requestKey" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "confirmedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "TradeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeNotice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "processingAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_tokenHash_key" ON "Conversation"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_conversationId_requestKey_key" ON "ChatMessage"("conversationId", "requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "TradeOrder_reference_key" ON "TradeOrder"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "TradeOrder_trackingHash_key" ON "TradeOrder"("trackingHash");

-- CreateIndex
CREATE UNIQUE INDEX "TradeQuote_orderId_revision_key" ON "TradeQuote"("orderId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "TradeEntry_orderId_requestKey_key" ON "TradeEntry"("orderId", "requestKey");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOrder" ADD CONSTRAINT "TradeOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOrder" ADD CONSTRAINT "TradeOrder_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeQuote" ADD CONSTRAINT "TradeQuote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TradeOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeEntry" ADD CONSTRAINT "TradeEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TradeOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeEvent" ADD CONSTRAINT "TradeEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TradeOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeNotice" ADD CONSTRAINT "TradeNotice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TradeOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Keep commercial data accessible only through the authenticated API database role.
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TradeOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TradeQuote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TradeEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TradeEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TradeNotice" ENABLE ROW LEVEL SECURITY;

-- Preserve existing IDs and products while grouping the catalogue into four universes.
UPDATE "Category" SET "universe" = 'home' WHERE "slug" IN ('maison-cuisine', 'maison-jardin', 'meubles');
INSERT INTO "Category" ("id", "name", "slug", "universe") VALUES
 ('baobab-motors', 'Véhicules', 'baobab-motors', 'motors'),
 ('baobab-classifieds', 'Objets & équipements', 'baobab-classifieds', 'classifieds'),
 ('baobab-home', 'Maison & jardin', 'baobab-home', 'home'),
 ('baobab-trade', 'Travaux & artisans', 'baobab-trade', 'trade')
ON CONFLICT ("slug") DO NOTHING;
UPDATE "Product" SET "supplierPrice" = "price" WHERE "supplierPrice" IS NULL;
CREATE INDEX "TradeOrder_customerId_idx" ON "TradeOrder"("customerId");
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");
CREATE INDEX "TradeNotice_state_createdAt_idx" ON "TradeNotice"("state", "createdAt");
