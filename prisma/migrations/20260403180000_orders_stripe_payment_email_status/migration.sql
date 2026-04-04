-- Align `orders` with schema (Stripe, deposits, email tracking).
-- Neon / production DBs that only had `migrate deploy` were missing these columns and enum values,
-- which caused Prisma INSERT failures → HTTP 500 on POST /api/orders.

-- PaymentMethod enum (safe if already created e.g. via db push)
DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'BANK_TRANSFER');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- OrderStatus: values used by checkout (e.g. PENDING_PAYMENT for bank, CONFIRMED for Stripe)
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'STRIPE';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "stripeFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "depositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "depositPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "postcode" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "allergiesNote" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "emailStatus" TEXT NOT NULL DEFAULT 'PENDING';
