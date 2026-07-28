import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient, type Equipment, type MuscleGroup } from '@prisma/client';
import { FOOD_CATALOG, TEMPLATE_PLANS } from './fixtures.js';

const prisma = new PrismaClient();

/**
 * A real (idempotent) dev account so the app's dev auto-login
 * (EXPO_PUBLIC_DEV_LOGIN=1) can obtain genuine tokens against the API.
 * Local development only — do not seed in production.
 */
const DEV_USER = {
  email: 'dev@gymcrush.app',
  password: 'devpassword123',
  displayName: 'Alex',
};

async function seedDevUser() {
  const existing = await prisma.user.findUnique({ where: { email: DEV_USER.email } });
  if (existing) {
    console.log(`✅ Dev user already present: ${DEV_USER.email}`);
    return;
  }
  const passwordHash = await bcrypt.hash(DEV_USER.password, 12);
  await prisma.user.create({
    data: { email: DEV_USER.email, passwordHash, displayName: DEV_USER.displayName },
  });
  console.log(`✅ Dev user created: ${DEV_USER.email} / ${DEV_USER.password}`);
}

/** A compact starter catalog of common exercises (ownerId null => global). */
const EXERCISES: Array<{ name: string; muscleGroup: MuscleGroup; equipment: Equipment }> = [
  { name: 'Barbell Back Squat', muscleGroup: 'quads', equipment: 'barbell' },
  { name: 'Barbell Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
  { name: 'Conventional Deadlift', muscleGroup: 'hamstrings', equipment: 'barbell' },
  { name: 'Overhead Press', muscleGroup: 'shoulders', equipment: 'barbell' },
  { name: 'Barbell Row', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'Pull-Up', muscleGroup: 'back', equipment: 'bodyweight' },
  { name: 'Lat Pulldown', muscleGroup: 'back', equipment: 'cable' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'chest', equipment: 'dumbbell' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Lateral Raise', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Romanian Deadlift', muscleGroup: 'hamstrings', equipment: 'barbell' },
  { name: 'Leg Press', muscleGroup: 'quads', equipment: 'machine' },
  { name: 'Leg Curl', muscleGroup: 'hamstrings', equipment: 'machine' },
  { name: 'Leg Extension', muscleGroup: 'quads', equipment: 'machine' },
  { name: 'Hip Thrust', muscleGroup: 'glutes', equipment: 'barbell' },
  { name: 'Standing Calf Raise', muscleGroup: 'calves', equipment: 'machine' },
  { name: 'Barbell Curl', muscleGroup: 'biceps', equipment: 'barbell' },
  { name: 'Dumbbell Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { name: 'Triceps Pushdown', muscleGroup: 'triceps', equipment: 'cable' },
  { name: 'Skull Crusher', muscleGroup: 'triceps', equipment: 'barbell' },
  { name: 'Cable Fly', muscleGroup: 'chest', equipment: 'cable' },
  { name: 'Face Pull', muscleGroup: 'shoulders', equipment: 'cable' },
  { name: 'Plank', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Hanging Leg Raise', muscleGroup: 'core', equipment: 'bodyweight' },

  // Chest
  { name: 'Push-Up', muscleGroup: 'chest', equipment: 'bodyweight' },
  { name: 'Incline Barbell Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
  { name: 'Decline Barbell Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
  { name: 'Flat Dumbbell Press', muscleGroup: 'chest', equipment: 'dumbbell' },
  { name: 'Dumbbell Fly', muscleGroup: 'chest', equipment: 'dumbbell' },
  { name: 'Chest Dip', muscleGroup: 'chest', equipment: 'bodyweight' },
  { name: 'Machine Chest Press', muscleGroup: 'chest', equipment: 'machine' },
  { name: 'Pec Deck', muscleGroup: 'chest', equipment: 'machine' },

  // Back
  { name: 'Chin-Up', muscleGroup: 'back', equipment: 'bodyweight' },
  { name: 'Seated Cable Row', muscleGroup: 'back', equipment: 'cable' },
  { name: 'Single-Arm Dumbbell Row', muscleGroup: 'back', equipment: 'dumbbell' },
  { name: 'T-Bar Row', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'Pendlay Row', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'Straight-Arm Pulldown', muscleGroup: 'back', equipment: 'cable' },
  { name: 'Chest-Supported Row', muscleGroup: 'back', equipment: 'machine' },
  { name: 'Inverted Row', muscleGroup: 'back', equipment: 'bodyweight' },
  { name: 'Back Extension', muscleGroup: 'back', equipment: 'bodyweight' },

  // Shoulders
  { name: 'Arnold Press', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Seated Dumbbell Press', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Cable Lateral Raise', muscleGroup: 'shoulders', equipment: 'cable' },
  { name: 'Rear Delt Fly', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Upright Row', muscleGroup: 'shoulders', equipment: 'barbell' },
  { name: 'Barbell Shrug', muscleGroup: 'shoulders', equipment: 'barbell' },

  // Arms
  { name: 'Hammer Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { name: 'Preacher Curl', muscleGroup: 'biceps', equipment: 'barbell' },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { name: 'Cable Curl', muscleGroup: 'biceps', equipment: 'cable' },
  { name: 'Concentration Curl', muscleGroup: 'biceps', equipment: 'dumbbell' },
  { name: 'Close-Grip Bench Press', muscleGroup: 'triceps', equipment: 'barbell' },
  { name: 'Overhead Triceps Extension', muscleGroup: 'triceps', equipment: 'dumbbell' },
  { name: 'Triceps Dip', muscleGroup: 'triceps', equipment: 'bodyweight' },
  { name: 'Triceps Kickback', muscleGroup: 'triceps', equipment: 'dumbbell' },
  { name: 'Rope Overhead Extension', muscleGroup: 'triceps', equipment: 'cable' },

  // Forearms
  { name: 'Barbell Wrist Curl', muscleGroup: 'forearms', equipment: 'barbell' },
  { name: 'Reverse Curl', muscleGroup: 'forearms', equipment: 'dumbbell' },
  { name: "Farmer's Carry", muscleGroup: 'forearms', equipment: 'dumbbell' },
  { name: 'Dead Hang', muscleGroup: 'forearms', equipment: 'bodyweight' },

  // Quads / legs
  { name: 'Front Squat', muscleGroup: 'quads', equipment: 'barbell' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'quads', equipment: 'dumbbell' },
  { name: 'Walking Lunge', muscleGroup: 'quads', equipment: 'dumbbell' },
  { name: 'Hack Squat', muscleGroup: 'quads', equipment: 'machine' },
  { name: 'Goblet Squat', muscleGroup: 'quads', equipment: 'kettlebell' },
  { name: 'Bodyweight Squat', muscleGroup: 'quads', equipment: 'bodyweight' },
  { name: 'Step-Up', muscleGroup: 'quads', equipment: 'dumbbell' },

  // Hamstrings / glutes
  { name: 'Seated Leg Curl', muscleGroup: 'hamstrings', equipment: 'machine' },
  { name: 'Nordic Curl', muscleGroup: 'hamstrings', equipment: 'bodyweight' },
  { name: 'Good Morning', muscleGroup: 'hamstrings', equipment: 'barbell' },
  { name: 'Sumo Deadlift', muscleGroup: 'hamstrings', equipment: 'barbell' },
  { name: 'Glute Bridge', muscleGroup: 'glutes', equipment: 'bodyweight' },
  { name: 'Cable Kickback', muscleGroup: 'glutes', equipment: 'cable' },
  { name: 'Bulgarian Hip Thrust', muscleGroup: 'glutes', equipment: 'dumbbell' },

  // Calves
  { name: 'Seated Calf Raise', muscleGroup: 'calves', equipment: 'machine' },
  { name: 'Leg Press Calf Raise', muscleGroup: 'calves', equipment: 'machine' },
  { name: 'Dumbbell Calf Raise', muscleGroup: 'calves', equipment: 'dumbbell' },

  // Core
  { name: 'Cable Crunch', muscleGroup: 'core', equipment: 'cable' },
  { name: 'Russian Twist', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Ab Wheel Rollout', muscleGroup: 'core', equipment: 'other' },
  { name: 'Side Plank', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Bicycle Crunch', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Mountain Climber', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Dead Bug', muscleGroup: 'core', equipment: 'bodyweight' },

  // Full body / conditioning
  { name: 'Kettlebell Swing', muscleGroup: 'full_body', equipment: 'kettlebell' },
  { name: 'Burpee', muscleGroup: 'full_body', equipment: 'bodyweight' },
  { name: 'Clean and Press', muscleGroup: 'full_body', equipment: 'barbell' },
  { name: 'Thruster', muscleGroup: 'full_body', equipment: 'dumbbell' },
  { name: 'Turkish Get-Up', muscleGroup: 'full_body', equipment: 'kettlebell' },
  { name: 'Sled Push', muscleGroup: 'full_body', equipment: 'other' },
  { name: 'Battle Ropes', muscleGroup: 'full_body', equipment: 'other' },
  { name: 'Jump Rope', muscleGroup: 'full_body', equipment: 'other' },
  { name: 'Kettlebell Row', muscleGroup: 'back', equipment: 'kettlebell' },
  { name: 'Kettlebell Front Squat', muscleGroup: 'quads', equipment: 'kettlebell' },

  // Bands / home-gym friendly
  { name: 'Band Pull-Apart', muscleGroup: 'shoulders', equipment: 'band' },
  { name: 'Band Row', muscleGroup: 'back', equipment: 'band' },
  { name: 'Band Lateral Walk', muscleGroup: 'glutes', equipment: 'band' },
  { name: 'Band-Assisted Pull-Up', muscleGroup: 'back', equipment: 'band' },
  { name: 'Band Chest Press', muscleGroup: 'chest', equipment: 'band' },
  { name: 'Band Bicep Curl', muscleGroup: 'biceps', equipment: 'band' },
  { name: 'Band Overhead Press', muscleGroup: 'shoulders', equipment: 'band' },
  { name: 'TRX Row', muscleGroup: 'back', equipment: 'other' },
];

/** Global food catalog (ownerId null), idempotent by name. */
async function seedFoodCatalog() {
  for (const food of FOOD_CATALOG) {
    const existing = await prisma.food.findFirst({ where: { name: food.name, ownerId: null } });
    if (!existing) {
      await prisma.food.create({ data: { ...food, ownerId: null } });
    }
  }
  const count = await prisma.food.count({ where: { ownerId: null } });
  console.log(`✅ Food catalog ready: ${count} global foods.`);
}

/**
 * Owns the curated template plans. `WorkoutPlan.ownerId` is required, so
 * templates need a real user row to hang off. This account never logs in —
 * its password is random and thrown away.
 */
const SYSTEM_USER_EMAIL = 'system@gymcrush.app';

async function seedSystemUser() {
  const existing = await prisma.user.findUnique({ where: { email: SYSTEM_USER_EMAIL } });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
  return prisma.user.create({
    data: { email: SYSTEM_USER_EMAIL, passwordHash, displayName: 'GymCrush' },
  });
}

/** Curated templates (isTemplate: true), idempotent by name + system owner. */
async function seedTemplatePlans() {
  const system = await seedSystemUser();

  const exercises = await prisma.exercise.findMany({ where: { ownerId: null } });
  const exerciseIdByName = new Map(exercises.map((e) => [e.name, e.id]));
  const resolve = (name: string) => {
    const id = exerciseIdByName.get(name);
    if (!id) throw new Error(`Unknown exercise "${name}" in a template fixture.`);
    return id;
  };

  for (const template of TEMPLATE_PLANS) {
    const existing = await prisma.workoutPlan.findFirst({
      where: { name: template.name, ownerId: system.id },
    });
    if (existing) continue;

    await prisma.workoutPlan.create({
      data: {
        ownerId: system.id,
        name: template.name,
        description: template.description,
        goal: template.goal,
        daysPerWeek: template.daysPerWeek,
        isTemplate: true,
        days: {
          create: template.days.map((day, di) => ({
            name: day.name,
            order: di,
            exercises: {
              create: day.exercises.map((ex, ei) => ({
                exerciseId: resolve(ex.exercise),
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
    });
  }

  const count = await prisma.workoutPlan.count({ where: { isTemplate: true } });
  console.log(`✅ Templates ready: ${count} curated plans.`);
}

async function main() {
  console.log('🌱 Seeding exercise catalog...');
  for (const ex of EXERCISES) {
    // Idempotent-ish: skip if a global exercise with this name already exists.
    const existing = await prisma.exercise.findFirst({
      where: { name: ex.name, ownerId: null },
    });
    if (!existing) {
      await prisma.exercise.create({ data: { ...ex, ownerId: null } });
    }
  }
  const count = await prisma.exercise.count({ where: { ownerId: null } });
  console.log(`✅ Catalog ready: ${count} global exercises.`);

  await seedFoodCatalog();
  await seedTemplatePlans();
  await seedDevUser();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
