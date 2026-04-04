/*
  Warnings:

  - You are about to drop the column `createdAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `prebookings` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `subtotal` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('STANDARD', 'EVENT');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "DeliveryZoneType" AS ENUM ('ZONE_1', 'ZONE_2');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- DropForeignKey
ALTER TABLE "prebookings" DROP CONSTRAINT "prebookings_eventId_fkey";

-- DropForeignKey
ALTER TABLE "prebookings" DROP CONSTRAINT "prebookings_userId_fkey";

-- AlterTable
ALTER TABLE "delivery_zones" ADD COLUMN     "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "minimumOrder" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryType" "DeliveryType" NOT NULL DEFAULT 'DELIVERY',
ADD COLUMN     "deliveryZone" "DeliveryZoneType",
ADD COLUMN     "isEventConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "prebookings";

-- DropEnum
DROP TYPE "PrebookingStatus";

-- CreateTable
CREATE TABLE "quote_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "estimatedGuests" INTEGER,
    "preferredDate" TIMESTAMP(3),
    "suburb" TEXT NOT NULL,
    "budgetRange" TEXT,
    "message" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);
