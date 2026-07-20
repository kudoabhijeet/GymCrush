/*
  Warnings:

  - The primary key for the `BodyMetricLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `BodyProfile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Exercise` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `ownerId` column on the `Exercise` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Food` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `ownerId` column on the `Food` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FoodEntry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `FoodLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `LoggedExercise` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `LoggedSet` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `MacroTarget` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PlanDay` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PlanExercise` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `RefreshToken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `WorkoutPlan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `WorkoutSession` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `planId` column on the `WorkoutSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `planDayId` column on the `WorkoutSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `id` on the `BodyMetricLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ownerId` on the `BodyMetricLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `BodyProfile` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ownerId` on the `BodyProfile` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Exercise` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Food` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `FoodEntry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `foodLogId` on the `FoodEntry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `foodId` on the `FoodEntry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `FoodLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ownerId` on the `FoodLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `LoggedExercise` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `sessionId` on the `LoggedExercise` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `exerciseId` on the `LoggedExercise` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `LoggedSet` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `loggedExerciseId` on the `LoggedSet` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `MacroTarget` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ownerId` on the `MacroTarget` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `PlanDay` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `planId` on the `PlanDay` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `PlanExercise` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `dayId` on the `PlanExercise` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `exerciseId` on the `PlanExercise` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `RefreshToken` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `RefreshToken` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `WorkoutPlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ownerId` on the `WorkoutPlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `WorkoutSession` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ownerId` on the `WorkoutSession` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "BodyMetricLog" DROP CONSTRAINT "BodyMetricLog_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "BodyProfile" DROP CONSTRAINT "BodyProfile_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Exercise" DROP CONSTRAINT "Exercise_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Food" DROP CONSTRAINT "Food_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "FoodEntry" DROP CONSTRAINT "FoodEntry_foodId_fkey";

-- DropForeignKey
ALTER TABLE "FoodEntry" DROP CONSTRAINT "FoodEntry_foodLogId_fkey";

-- DropForeignKey
ALTER TABLE "FoodLog" DROP CONSTRAINT "FoodLog_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "LoggedExercise" DROP CONSTRAINT "LoggedExercise_exerciseId_fkey";

-- DropForeignKey
ALTER TABLE "LoggedExercise" DROP CONSTRAINT "LoggedExercise_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "LoggedSet" DROP CONSTRAINT "LoggedSet_loggedExerciseId_fkey";

-- DropForeignKey
ALTER TABLE "MacroTarget" DROP CONSTRAINT "MacroTarget_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "PlanDay" DROP CONSTRAINT "PlanDay_planId_fkey";

-- DropForeignKey
ALTER TABLE "PlanExercise" DROP CONSTRAINT "PlanExercise_dayId_fkey";

-- DropForeignKey
ALTER TABLE "PlanExercise" DROP CONSTRAINT "PlanExercise_exerciseId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutPlan" DROP CONSTRAINT "WorkoutPlan_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutSession" DROP CONSTRAINT "WorkoutSession_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutSession" DROP CONSTRAINT "WorkoutSession_planDayId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutSession" DROP CONSTRAINT "WorkoutSession_planId_fkey";

-- AlterTable
ALTER TABLE "BodyMetricLog" DROP CONSTRAINT "BodyMetricLog_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "ownerId",
ADD COLUMN     "ownerId" UUID NOT NULL,
ADD CONSTRAINT "BodyMetricLog_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "BodyProfile" DROP CONSTRAINT "BodyProfile_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "ownerId",
ADD COLUMN     "ownerId" UUID NOT NULL,
ADD CONSTRAINT "BodyProfile_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Exercise" DROP CONSTRAINT "Exercise_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "ownerId",
ADD COLUMN     "ownerId" UUID,
ADD CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Food" DROP CONSTRAINT "Food_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "ownerId",
ADD COLUMN     "ownerId" UUID,
ADD CONSTRAINT "Food_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "FoodEntry" DROP CONSTRAINT "FoodEntry_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "foodLogId",
ADD COLUMN     "foodLogId" UUID NOT NULL,
DROP COLUMN "foodId",
ADD COLUMN     "foodId" UUID NOT NULL,
ADD CONSTRAINT "FoodEntry_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "FoodLog" DROP CONSTRAINT "FoodLog_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "ownerId",
ADD COLUMN     "ownerId" UUID NOT NULL,
ADD CONSTRAINT "FoodLog_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "LoggedExercise" DROP CONSTRAINT "LoggedExercise_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "sessionId",
ADD COLUMN     "sessionId" UUID NOT NULL,
DROP COLUMN "exerciseId",
ADD COLUMN     "exerciseId" UUID NOT NULL,
ADD CONSTRAINT "LoggedExercise_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "LoggedSet" DROP CONSTRAINT "LoggedSet_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "loggedExerciseId",
ADD COLUMN     "loggedExerciseId" UUID NOT NULL,
ADD CONSTRAINT "LoggedSet_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MacroTarget" DROP CONSTRAINT "MacroTarget_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "ownerId",
ADD COLUMN     "ownerId" UUID NOT NULL,
ADD CONSTRAINT "MacroTarget_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PlanDay" DROP CONSTRAINT "PlanDay_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "planId",
ADD COLUMN     "planId" UUID NOT NULL,
ADD CONSTRAINT "PlanDay_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PlanExercise" DROP CONSTRAINT "PlanExercise_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "dayId",
ADD COLUMN     "dayId" UUID NOT NULL,
DROP COLUMN "exerciseId",
ADD COLUMN     "exerciseId" UUID NOT NULL,
ADD CONSTRAINT "PlanExercise_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "WorkoutPlan" DROP CONSTRAINT "WorkoutPlan_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "ownerId",
ADD COLUMN     "ownerId" UUID NOT NULL,
ADD CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "WorkoutSession" DROP CONSTRAINT "WorkoutSession_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "ownerId",
ADD COLUMN     "ownerId" UUID NOT NULL,
DROP COLUMN "planId",
ADD COLUMN     "planId" UUID,
DROP COLUMN "planDayId",
ADD COLUMN     "planDayId" UUID,
ADD CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "BodyMetricLog_ownerId_loggedAt_idx" ON "BodyMetricLog"("ownerId", "loggedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BodyProfile_ownerId_key" ON "BodyProfile"("ownerId");

-- CreateIndex
CREATE INDEX "Exercise_ownerId_idx" ON "Exercise"("ownerId");

-- CreateIndex
CREATE INDEX "Food_ownerId_idx" ON "Food"("ownerId");

-- CreateIndex
CREATE INDEX "FoodEntry_foodLogId_idx" ON "FoodEntry"("foodLogId");

-- CreateIndex
CREATE INDEX "FoodLog_ownerId_date_idx" ON "FoodLog"("ownerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "FoodLog_ownerId_date_key" ON "FoodLog"("ownerId", "date");

-- CreateIndex
CREATE INDEX "LoggedExercise_sessionId_idx" ON "LoggedExercise"("sessionId");

-- CreateIndex
CREATE INDEX "LoggedSet_loggedExerciseId_idx" ON "LoggedSet"("loggedExerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "MacroTarget_ownerId_key" ON "MacroTarget"("ownerId");

-- CreateIndex
CREATE INDEX "PlanDay_planId_idx" ON "PlanDay"("planId");

-- CreateIndex
CREATE INDEX "PlanExercise_dayId_idx" ON "PlanExercise"("dayId");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "WorkoutPlan_ownerId_idx" ON "WorkoutPlan"("ownerId");

-- CreateIndex
CREATE INDEX "WorkoutSession_ownerId_idx" ON "WorkoutSession"("ownerId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDay" ADD CONSTRAINT "PlanDay_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WorkoutPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanExercise" ADD CONSTRAINT "PlanExercise_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "PlanDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanExercise" ADD CONSTRAINT "PlanExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WorkoutPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_planDayId_fkey" FOREIGN KEY ("planDayId") REFERENCES "PlanDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoggedExercise" ADD CONSTRAINT "LoggedExercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoggedExercise" ADD CONSTRAINT "LoggedExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoggedSet" ADD CONSTRAINT "LoggedSet_loggedExerciseId_fkey" FOREIGN KEY ("loggedExerciseId") REFERENCES "LoggedExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyProfile" ADD CONSTRAINT "BodyProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMetricLog" ADD CONSTRAINT "BodyMetricLog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MacroTarget" ADD CONSTRAINT "MacroTarget_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodLog" ADD CONSTRAINT "FoodLog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodEntry" ADD CONSTRAINT "FoodEntry_foodLogId_fkey" FOREIGN KEY ("foodLogId") REFERENCES "FoodLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodEntry" ADD CONSTRAINT "FoodEntry_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
