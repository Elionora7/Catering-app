-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('PER_ITEM', 'PER_DOZEN', 'PER_PERSON', 'PER_SKEWER', 'SIZED');

-- AlterEnum
ALTER TYPE "DeliveryZoneType" ADD VALUE 'ZONE_3';

-- AlterTable
ALTER TABLE "meals" ADD COLUMN     "minimumQuantity" INTEGER,
ADD COLUMN     "priceBainMarie" DOUBLE PRECISION,
ADD COLUMN     "priceLarge" DOUBLE PRECISION,
ADD COLUMN     "priceMedium" DOUBLE PRECISION,
ADD COLUMN     "priceSmall" DOUBLE PRECISION,
ADD COLUMN     "pricingType" "PricingType" NOT NULL DEFAULT 'PER_ITEM';

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "bainMarieFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "size" TEXT;
