/*
  Warnings:

  - Added the required column `deliveryDate` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "meals" ADD COLUMN     "allergyNotes" TEXT,
ADD COLUMN     "containsEgg" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "containsPeanut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "containsWheat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ingredients" TEXT,
ADD COLUMN     "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVegan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVegetarian" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryDate" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "suburb" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);
