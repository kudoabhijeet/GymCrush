-- CreateEnum
CREATE TYPE "Meal" AS ENUM ('breakfast', 'lunch', 'dinner', 'snacks');

-- AlterTable
ALTER TABLE "FoodEntry" ADD COLUMN     "meal" "Meal" NOT NULL DEFAULT 'breakfast';
