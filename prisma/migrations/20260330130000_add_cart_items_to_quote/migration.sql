-- AlterTable
ALTER TABLE "quote_requests" ADD COLUMN IF NOT EXISTS "cartItems" JSONB;
