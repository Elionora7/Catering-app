-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('DAILY', 'EVENT', 'BOTH');

-- AlterTable
ALTER TABLE "meals" ADD COLUMN     "mealType" "MealType" NOT NULL DEFAULT 'DAILY';
