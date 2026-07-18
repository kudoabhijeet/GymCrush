import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { calcMacroTarget } from '@gymcrush/shared';
import {
  FB_SESSIONS,
  FOOD_DAYS,
  PLANS,
  PPL_SESSIONS,
  UL_SESSIONS,
  weightTrend,
  type PlanSeed,
  type SessionSeed,
} from './fixtures.js';

const prisma = new PrismaClient();

/**
 * Demo users with rich sample data, for exercising the app's data-heavy
 * screens. Idempotent: existing users are skipped. Local/testing only —
 * kept separate from the main `db:seed` so demo accounts never leak elsewhere.
 *
 * Requires the catalog seed (`pnpm db:seed`) to have run first (global
 * exercises + foods). Run with `pnpm db:seed:demo`.
 */

const PASSWORD = 'demopass123';

interface Persona {
  email: string;
  displayName: string;
  profile: Parameters<typeof calcMacroTarget>[0];
  plan: PlanSeed;
  sessions: SessionSeed[];
  weightStart: number;
  weightEnd: number;
}

const PERSONAS: Persona[] = [
  {
    email: 'alex@demo.gymcrush.app',
    displayName: 'Alex',
    profile: { sex: 'male', age: 28, heightCm: 180, weightKg: 80.4, activityLevel: 'moderate', nutritionGoal: 'lean_bulk' },
    plan: PLANS.ppl,
    sessions: PPL_SESSIONS,
    weightStart: 79,
    weightEnd: 80.4,
  },
  {
    email: 'sam@demo.gymcrush.app',
    displayName: 'Sam',
    profile: { sex: 'female', age: 31, heightCm: 166, weightKg: 63, activityLevel: 'active', nutritionGoal: 'cut' },
    plan: PLANS.ul,
    sessions: UL_SESSIONS,
    weightStart: 66,
    weightEnd: 63,
  },
  {
    email: 'jordan@demo.gymcrush.app',
    displayName: 'Jordan',
    profile: { sex: 'male', age: 35, heightCm: 175, weightKg: 78, activityLevel: 'light', nutritionGoal: 'maintain' },
    plan: PLANS.fb,
    sessions: FB_SESSIONS,
    weightStart: 78.5,
    weightEnd: 78,
  },
];

/** Local yyyy-mm-dd key (matches the API's ownerId_date unique on FoodLog). */
function dateKey(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86_400_000);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}

function atEvening(daysAgo: number): Date {
  const d = new Date(Date.now() - daysAgo * 86_400_000);
  d.setHours(18, 15, 0, 0);
  return d;
}

async function loadCatalog() {
  const exercises = await prisma.exercise.findMany({ where: { ownerId: null } });
  const foods = await prisma.food.findMany({ where: { ownerId: null } });
  if (exercises.length === 0 || foods.length === 0) {
    throw new Error(
      'Global catalog is empty. Run `pnpm db:seed` first to seed exercises and foods.',
    );
  }
  const exerciseByName = new Map(exercises.map((e) => [e.name, e.id]));
  const foodByName = new Map(foods.map((f) => [f.name, f.id]));
  return { exerciseByName, foodByName };
}

type Catalog = Awaited<ReturnType<typeof loadCatalog>>;

function resolveExercise(catalog: Catalog, name: string): string {
  const id = catalog.exerciseByName.get(name);
  if (!id) throw new Error(`Unknown exercise "${name}" — is the catalog seeded?`);
  return id;
}

function resolveFood(catalog: Catalog, name: string): string {
  const id = catalog.foodByName.get(name);
  if (!id) throw new Error(`Unknown food "${name}" — is the food catalog seeded?`);
  return id;
}

async function seedPersona(persona: Persona, catalog: Catalog) {
  const existing = await prisma.user.findUnique({ where: { email: persona.email } });
  if (existing) {
    console.log(`↩️  ${persona.email} already present — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const target = calcMacroTarget(persona.profile);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: persona.email, passwordHash, displayName: persona.displayName },
    });

    // Body profile + computed macro targets (same formula as the API).
    await tx.bodyProfile.create({ data: { ownerId: user.id, ...persona.profile } });
    await tx.macroTarget.create({ data: { ownerId: user.id, ...target } });

    // Plan (with nested days + exercises).
    const plan = await tx.workoutPlan.create({
      data: {
        ownerId: user.id,
        name: persona.plan.name,
        description: persona.plan.description,
        goal: persona.plan.goal,
        daysPerWeek: persona.plan.daysPerWeek,
        days: {
          create: persona.plan.days.map((day, di) => ({
            name: day.name,
            order: di,
            exercises: {
              create: day.exercises.map((ex, ei) => ({
                exerciseId: resolveExercise(catalog, ex.exercise),
                order: ei,
                targetSets: ex.targetSets,
                targetReps: ex.targetReps,
                targetRpe: ex.targetRpe,
                restSeconds: ex.restSeconds,
              })),
            },
          })),
        },
      },
      include: { days: true },
    });
    const dayIdByName = new Map(plan.days.map((d) => [d.name, d.id]));

    // Sessions (completed, with nested exercises → sets).
    for (const session of persona.sessions) {
      const startedAt = atEvening(session.daysAgo);
      const finishedAt = new Date(startedAt.getTime() + session.durationMin * 60_000);
      await tx.workoutSession.create({
        data: {
          ownerId: user.id,
          name: session.name,
          planId: session.planKey ? plan.id : null,
          planDayId: session.planDayName ? (dayIdByName.get(session.planDayName) ?? null) : null,
          startedAt,
          finishedAt,
          exercises: {
            create: session.exercises.map((ex, ei) => ({
              exerciseId: resolveExercise(catalog, ex.exercise),
              order: ei,
              sets: {
                create: ex.weights.map((weight, si) => ({
                  setNumber: si + 1,
                  weight,
                  reps: ex.reps[si] ?? ex.reps[ex.reps.length - 1],
                  rpe: ex.rpe ?? null,
                  isWarmup: false,
                  completed: true,
                })),
              },
            })),
          },
        },
      });
    }

    // Food logs across meals for the last couple of days.
    for (const day of FOOD_DAYS) {
      await tx.foodLog.create({
        data: {
          ownerId: user.id,
          date: dateKey(day.daysAgo),
          entries: {
            create: day.entries.map((entry) => ({
              foodId: resolveFood(catalog, entry.food),
              servings: entry.servings,
              meal: entry.meal,
            })),
          },
        },
      });
    }

    // Bodyweight history (~10 points, oldest first).
    const weights = weightTrend(persona.weightStart, persona.weightEnd);
    await tx.bodyMetricLog.createMany({
      data: weights.map((weightKg, i) => {
        const loggedAt = new Date(Date.now() - (weights.length - 1 - i) * 3.5 * 86_400_000);
        loggedAt.setHours(7, 30, 0, 0);
        return { ownerId: user.id, weightKg, loggedAt };
      }),
    });

    console.log(
      `✅ ${persona.email} — profile, ${persona.plan.days.length}-day plan, ` +
        `${persona.sessions.length} sessions, ${FOOD_DAYS.length} food days, ${weights.length} weigh-ins.`,
    );
  });
}

async function main() {
  console.log('🌱 Seeding demo users...');
  const catalog = await loadCatalog();
  for (const persona of PERSONAS) {
    await seedPersona(persona, catalog);
  }
  console.log(`\n🎉 Demo users ready. Log in with any of:`);
  for (const p of PERSONAS) console.log(`   ${p.email} / ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Demo seed failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
