import { PrismaClient, type Equipment, type MuscleGroup } from '@prisma/client';

const prisma = new PrismaClient();

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
];

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
