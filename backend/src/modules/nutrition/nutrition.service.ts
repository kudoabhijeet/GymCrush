import {
  calcMacroTarget,
  type BodyProfile,
  type CreateFoodInput,
  type Food,
  type LogFoodInput,
  type MacroTarget,
  type Meal,
  type UpsertBodyProfileInput,
} from '@gymcrush/shared';
import { prisma } from '../../db/prisma.js';
import { notFound } from '../../lib/errors.js';
import { mapBodyProfile, mapFood, mapMacroTarget } from '../../lib/mappers.js';

/* ------------------------------ Body profile ----------------------------- */

/** Upsert the body profile and recompute macro targets from the shared formula. */
export async function upsertBodyProfile(
  userId: string,
  input: UpsertBodyProfileInput,
): Promise<{ profile: BodyProfile; target: MacroTarget }> {
  const profile = await prisma.bodyProfile.upsert({
    where: { ownerId: userId },
    create: { ownerId: userId, ...input },
    update: { ...input },
  });

  const computed = calcMacroTarget(input);
  const target = await prisma.macroTarget.upsert({
    where: { ownerId: userId },
    create: { ownerId: userId, ...computed },
    update: { ...computed },
  });

  return { profile: mapBodyProfile(profile), target: mapMacroTarget(target) };
}

export async function getBodyProfile(userId: string): Promise<BodyProfile> {
  const profile = await prisma.bodyProfile.findUnique({ where: { ownerId: userId } });
  if (!profile) throw notFound('Body profile not set');
  return mapBodyProfile(profile);
}

/* ------------------------------ Macro targets ---------------------------- */

export async function getMacroTarget(userId: string): Promise<MacroTarget> {
  const target = await prisma.macroTarget.findUnique({ where: { ownerId: userId } });
  if (!target) throw notFound('No macro target set');
  return mapMacroTarget(target);
}

/** Manually override the macro target (bypasses the calculated value). */
export async function setMacroTarget(userId: string, input: MacroTarget): Promise<MacroTarget> {
  const target = await prisma.macroTarget.upsert({
    where: { ownerId: userId },
    create: { ownerId: userId, ...input },
    update: { ...input },
  });
  return mapMacroTarget(target);
}

/* --------------------------------- Foods --------------------------------- */

/** Global foods plus the user's custom ones, filtered by name. */
export async function listFoods(userId: string, search?: string): Promise<Food[]> {
  const rows = await prisma.food.findMany({
    where: {
      OR: [{ ownerId: null }, { ownerId: userId }],
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { name: 'asc' },
  });
  return rows.map(mapFood);
}

export async function createFood(userId: string, input: CreateFoodInput): Promise<Food> {
  const row = await prisma.food.create({ data: { ownerId: userId, ...input } });
  return mapFood(row);
}

/* ------------------------------- Food log -------------------------------- */

export interface Macros {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DailyLogEntry {
  id: string;
  foodId: string;
  servings: number;
  meal: Meal;
  food: Food;
  macros: Macros;
}

export interface DailyLog {
  date: string;
  entries: DailyLogEntry[];
  totals: Macros;
}

const zeroMacros = (): Macros => ({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });

function entryMacros(food: Food, servings: number): Macros {
  return {
    calories: Math.round(food.calories * servings),
    proteinG: Math.round(food.proteinG * servings),
    carbsG: Math.round(food.carbsG * servings),
    fatG: Math.round(food.fatG * servings),
  };
}

/** The day's food log with per-entry and total macros. Empty if nothing logged. */
export async function getDailyLog(userId: string, date: string): Promise<DailyLog> {
  const log = await prisma.foodLog.findUnique({
    where: { ownerId_date: { ownerId: userId, date } },
    include: { entries: { include: { food: true } } },
  });

  if (!log) return { date, entries: [], totals: zeroMacros() };

  const entries: DailyLogEntry[] = log.entries.map((entry) => {
    const food = mapFood(entry.food);
    return {
      id: entry.id,
      foodId: entry.foodId,
      servings: entry.servings,
      meal: entry.meal,
      food,
      macros: entryMacros(food, entry.servings),
    };
  });

  const totals = entries.reduce<Macros>((acc, e) => ({
    calories: acc.calories + e.macros.calories,
    proteinG: acc.proteinG + e.macros.proteinG,
    carbsG: acc.carbsG + e.macros.carbsG,
    fatG: acc.fatG + e.macros.fatG,
  }), zeroMacros());

  return { date, entries, totals };
}

/** Add a food entry to a day, creating that day's log on first write. */
export async function addFoodEntry(userId: string, input: LogFoodInput): Promise<DailyLog> {
  const food = await prisma.food.findFirst({
    where: { id: input.foodId, OR: [{ ownerId: null }, { ownerId: userId }] },
  });
  if (!food) throw notFound('Food not found');

  const log = await prisma.foodLog.upsert({
    where: { ownerId_date: { ownerId: userId, date: input.date } },
    create: { ownerId: userId, date: input.date },
    update: {},
  });

  await prisma.foodEntry.create({
    data: {
      foodLogId: log.id,
      foodId: input.foodId,
      servings: input.servings,
      meal: input.meal,
    },
  });

  return getDailyLog(userId, input.date);
}

export async function removeFoodEntry(userId: string, entryId: string): Promise<void> {
  const entry = await prisma.foodEntry.findUnique({
    where: { id: entryId },
    include: { foodLog: true },
  });
  if (!entry || entry.foodLog.ownerId !== userId) throw notFound('Entry not found');
  await prisma.foodEntry.delete({ where: { id: entryId } });
}

/* ------------------------------ Bodyweight ------------------------------- */

export interface WeightEntry {
  id: string;
  weightKg: number;
  loggedAt: string;
}

/** Log a bodyweight measurement and keep the body profile's weight in sync. */
export async function logWeight(userId: string, weightKg: number): Promise<WeightEntry> {
  const entry = await prisma.bodyMetricLog.create({ data: { ownerId: userId, weightKg } });
  await prisma.bodyProfile.updateMany({ where: { ownerId: userId }, data: { weightKg } });
  return { id: entry.id, weightKg: entry.weightKg, loggedAt: entry.loggedAt.toISOString() };
}

export async function getWeightHistory(userId: string): Promise<WeightEntry[]> {
  const rows = await prisma.bodyMetricLog.findMany({
    where: { ownerId: userId },
    orderBy: { loggedAt: 'asc' },
  });
  return rows.map((r) => ({ id: r.id, weightKg: r.weightKg, loggedAt: r.loggedAt.toISOString() }));
}
