/**
 * Shared seed fixtures for the main catalog seed and the demo-user seed.
 * Exercises are referenced by NAME (resolved to catalog ids at seed time), so
 * these stay decoupled from generated cuids.
 */

/* ------------------------- Global food catalog --------------------------- */

export interface FoodSeed {
  name: string;
  servingLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const FOOD_CATALOG: FoodSeed[] = [
  { name: 'Chicken Breast', servingLabel: '100g', calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
  { name: 'White Rice (cooked)', servingLabel: '100g', calories: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 },
  { name: 'Whole Egg', servingLabel: '1 large', calories: 72, proteinG: 6.3, carbsG: 0.4, fatG: 4.8 },
  { name: 'Rolled Oats (dry)', servingLabel: '50g', calories: 190, proteinG: 6.5, carbsG: 33, fatG: 3.4 },
  { name: 'Whey Protein', servingLabel: '1 scoop (30g)', calories: 120, proteinG: 24, carbsG: 3, fatG: 1.5 },
  { name: 'Banana', servingLabel: '1 medium', calories: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4 },
  { name: 'Salmon Fillet', servingLabel: '100g', calories: 208, proteinG: 20, carbsG: 0, fatG: 13 },
  { name: 'Broccoli', servingLabel: '100g', calories: 34, proteinG: 2.8, carbsG: 7, fatG: 0.4 },
  { name: 'Greek Yogurt (0%)', servingLabel: '170g', calories: 100, proteinG: 17, carbsG: 6, fatG: 0.7 },
  { name: 'Almonds', servingLabel: '28g', calories: 164, proteinG: 6, carbsG: 6, fatG: 14 },
  { name: 'Pasta (cooked)', servingLabel: '100g', calories: 158, proteinG: 5.8, carbsG: 31, fatG: 0.9 },
  { name: 'Lean Ground Beef (95/5)', servingLabel: '100g', calories: 171, proteinG: 26, carbsG: 0, fatG: 6.5 },
  { name: 'Sweet Potato', servingLabel: '150g', calories: 129, proteinG: 2.4, carbsG: 30, fatG: 0.2 },
  { name: 'Avocado', servingLabel: '1/2 fruit', calories: 120, proteinG: 1.5, carbsG: 6, fatG: 11 },
  { name: 'Peanut Butter', servingLabel: '2 tbsp (32g)', calories: 190, proteinG: 8, carbsG: 7, fatG: 16 },
  { name: 'Milk (2%)', servingLabel: '250ml', calories: 122, proteinG: 8.1, carbsG: 11.7, fatG: 4.8 },
  { name: 'Whole Wheat Bread', servingLabel: '1 slice', calories: 81, proteinG: 4, carbsG: 13.8, fatG: 1.1 },
  { name: 'Canned Tuna (in water)', servingLabel: '1 can (120g)', calories: 132, proteinG: 29, carbsG: 0, fatG: 1 },
  { name: 'Apple', servingLabel: '1 medium', calories: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3 },
  { name: 'Olive Oil', servingLabel: '1 tbsp', calories: 119, proteinG: 0, carbsG: 0, fatG: 13.5 },

  /* --- Indian staples: dals & legumes --- */
  { name: 'Toor Dal (cooked)', servingLabel: '1 cup (200g)', calories: 180, proteinG: 12, carbsG: 28, fatG: 3 },
  { name: 'Moong Dal (cooked)', servingLabel: '1 cup (200g)', calories: 150, proteinG: 10, carbsG: 25, fatG: 1.5 },
  { name: 'Dal Makhani', servingLabel: '1 cup (200g)', calories: 320, proteinG: 11, carbsG: 30, fatG: 17 },
  { name: 'Rajma (kidney bean curry)', servingLabel: '1 cup (200g)', calories: 220, proteinG: 10, carbsG: 35, fatG: 5 },
  { name: 'Chana Masala', servingLabel: '1 cup (200g)', calories: 270, proteinG: 12, carbsG: 40, fatG: 7 },
  { name: 'Sambar', servingLabel: '1 cup (200g)', calories: 140, proteinG: 7, carbsG: 20, fatG: 4 },
  { name: 'Rasam', servingLabel: '1 cup (200g)', calories: 65, proteinG: 3, carbsG: 9, fatG: 2 },
  { name: 'Roasted Chana', servingLabel: '30g', calories: 120, proteinG: 6, carbsG: 18, fatG: 2 },

  /* --- Indian staples: breads --- */
  { name: 'Roti / Chapati', servingLabel: '1 medium (40g)', calories: 85, proteinG: 3, carbsG: 18, fatG: 0.5 },
  { name: 'Paratha (plain)', servingLabel: '1 medium (60g)', calories: 180, proteinG: 4, carbsG: 25, fatG: 7 },
  { name: 'Aloo Paratha', servingLabel: '1 medium (100g)', calories: 260, proteinG: 6, carbsG: 36, fatG: 10 },
  { name: 'Naan', servingLabel: '1 piece (90g)', calories: 260, proteinG: 8, carbsG: 45, fatG: 5 },
  { name: 'Puri', servingLabel: '1 piece (25g)', calories: 100, proteinG: 2, carbsG: 12, fatG: 5 },

  /* --- Indian staples: rice dishes --- */
  { name: 'Steamed Rice (cooked)', servingLabel: '1 cup (150g)', calories: 200, proteinG: 4, carbsG: 44, fatG: 0.5 },
  { name: 'Jeera Rice', servingLabel: '1 cup (150g)', calories: 220, proteinG: 4, carbsG: 42, fatG: 5 },
  { name: 'Vegetable Biryani', servingLabel: '1 cup (200g)', calories: 280, proteinG: 6, carbsG: 45, fatG: 9 },
  { name: 'Vegetable Pulao', servingLabel: '1 cup (200g)', calories: 250, proteinG: 5, carbsG: 42, fatG: 7 },
  { name: 'Curd Rice', servingLabel: '1 cup (200g)', calories: 210, proteinG: 7, carbsG: 35, fatG: 5 },

  /* --- Indian staples: sabzis --- */
  { name: 'Aloo Gobi', servingLabel: '1 cup (150g)', calories: 150, proteinG: 3, carbsG: 20, fatG: 7 },
  { name: 'Bhindi Masala', servingLabel: '1 cup (150g)', calories: 130, proteinG: 3, carbsG: 12, fatG: 8 },
  { name: 'Palak (spinach sabzi)', servingLabel: '1 cup (150g)', calories: 120, proteinG: 5, carbsG: 10, fatG: 7 },
  { name: 'Baingan Bharta', servingLabel: '1 cup (150g)', calories: 140, proteinG: 3, carbsG: 14, fatG: 8 },
  { name: 'Mixed Vegetable Sabzi', servingLabel: '1 cup (150g)', calories: 125, proteinG: 4, carbsG: 15, fatG: 6 },

  /* --- Indian staples: paneer, egg & meat --- */
  { name: 'Paneer (raw)', servingLabel: '100g', calories: 265, proteinG: 18, carbsG: 6, fatG: 20 },
  { name: 'Paneer Tikka', servingLabel: '100g', calories: 270, proteinG: 18, carbsG: 7, fatG: 19 },
  { name: 'Palak Paneer', servingLabel: '1 cup (200g)', calories: 280, proteinG: 14, carbsG: 12, fatG: 20 },
  { name: 'Paneer Butter Masala', servingLabel: '1 cup (200g)', calories: 350, proteinG: 14, carbsG: 14, fatG: 27 },
  { name: 'Chicken Curry (home-style)', servingLabel: '1 cup (200g)', calories: 280, proteinG: 22, carbsG: 8, fatG: 18 },
  { name: 'Butter Chicken', servingLabel: '1 cup (200g)', calories: 380, proteinG: 24, carbsG: 12, fatG: 27 },
  { name: 'Tandoori Chicken', servingLabel: '2 pieces (150g)', calories: 240, proteinG: 30, carbsG: 4, fatG: 11 },
  { name: 'Egg Curry', servingLabel: '1 cup with 2 eggs (200g)', calories: 260, proteinG: 15, carbsG: 10, fatG: 18 },

  /* --- Indian staples: breakfast & snacks --- */
  { name: 'Idli', servingLabel: '2 pieces (80g)', calories: 120, proteinG: 4, carbsG: 24, fatG: 0.5 },
  { name: 'Masala Dosa', servingLabel: '1 piece (150g)', calories: 250, proteinG: 6, carbsG: 38, fatG: 8 },
  { name: 'Poha', servingLabel: '1 cup (150g)', calories: 180, proteinG: 4, carbsG: 30, fatG: 6 },
  { name: 'Upma', servingLabel: '1 cup (150g)', calories: 200, proteinG: 5, carbsG: 30, fatG: 7 },
  { name: 'Dhokla', servingLabel: '2 pieces (60g)', calories: 120, proteinG: 4, carbsG: 20, fatG: 3 },
  { name: 'Samosa', servingLabel: '1 piece (60g)', calories: 260, proteinG: 4, carbsG: 24, fatG: 17 },

  /* --- Indian staples: accompaniments --- */
  { name: 'Curd / Dahi (plain)', servingLabel: '1 cup (200g)', calories: 120, proteinG: 8, carbsG: 10, fatG: 5 },
  { name: 'Cucumber Raita', servingLabel: '1/2 cup (100g)', calories: 50, proteinG: 3, carbsG: 5, fatG: 2 },
  { name: 'Mint Chutney', servingLabel: '2 tbsp (30g)', calories: 15, proteinG: 0.5, carbsG: 3, fatG: 0.2 },
  { name: 'Papad (roasted)', servingLabel: '1 piece (10g)', calories: 35, proteinG: 2, carbsG: 6, fatG: 0.3 },
  { name: 'Ghee', servingLabel: '1 tsp (5g)', calories: 45, proteinG: 0, carbsG: 0, fatG: 5 },
];

/* --------------------------- Plan fixtures ------------------------------- */

export interface PlanExerciseSeed {
  /** Exercise name — resolved to a catalog id at seed time. */
  exercise: string;
  targetSets: number;
  targetReps: string;
  targetRpe: number | null;
  restSeconds: number | null;
}

export interface PlanDaySeed {
  name: string;
  exercises: PlanExerciseSeed[];
}

export interface PlanSeed {
  key: string; // stable handle used to link sessions to a plan/day
  name: string;
  description: string;
  goal: 'strength' | 'hypertrophy' | 'fat_loss' | 'general_fitness' | 'endurance';
  daysPerWeek: number;
  days: PlanDaySeed[];
}

const PPL: PlanSeed = {
  key: 'ppl',
  name: 'Push Pull Legs',
  description: 'Classic 6-day PPL split focused on hypertrophy with progressive overload.',
  goal: 'hypertrophy',
  daysPerWeek: 6,
  days: [
    {
      name: 'Push A',
      exercises: [
        { exercise: 'Barbell Bench Press', targetSets: 4, targetReps: '6-8', targetRpe: 8, restSeconds: 180 },
        { exercise: 'Overhead Press', targetSets: 3, targetReps: '8-10', targetRpe: 8, restSeconds: 150 },
        { exercise: 'Incline Dumbbell Press', targetSets: 3, targetReps: '10-12', targetRpe: 9, restSeconds: 120 },
        { exercise: 'Lateral Raise', targetSets: 4, targetReps: '12-15', targetRpe: 9, restSeconds: 90 },
        { exercise: 'Triceps Pushdown', targetSets: 3, targetReps: '10-12', targetRpe: 9, restSeconds: 90 },
      ],
    },
    {
      name: 'Pull A',
      exercises: [
        { exercise: 'Conventional Deadlift', targetSets: 3, targetReps: '5', targetRpe: 8, restSeconds: 240 },
        { exercise: 'Pull-Up', targetSets: 4, targetReps: '6-10', targetRpe: 9, restSeconds: 150 },
        { exercise: 'Barbell Row', targetSets: 3, targetReps: '8-10', targetRpe: 8, restSeconds: 150 },
        { exercise: 'Face Pull', targetSets: 3, targetReps: '15-20', targetRpe: 9, restSeconds: 60 },
        { exercise: 'Barbell Curl', targetSets: 3, targetReps: '10-12', targetRpe: 9, restSeconds: 90 },
      ],
    },
    {
      name: 'Legs A',
      exercises: [
        { exercise: 'Barbell Back Squat', targetSets: 4, targetReps: '6-8', targetRpe: 8, restSeconds: 210 },
        { exercise: 'Romanian Deadlift', targetSets: 3, targetReps: '8-10', targetRpe: 8, restSeconds: 180 },
        { exercise: 'Leg Press', targetSets: 3, targetReps: '10-12', targetRpe: 9, restSeconds: 150 },
        { exercise: 'Leg Curl', targetSets: 3, targetReps: '10-12', targetRpe: 9, restSeconds: 90 },
        { exercise: 'Standing Calf Raise', targetSets: 4, targetReps: '12-15', targetRpe: 9, restSeconds: 75 },
      ],
    },
  ],
};

const UPPER_LOWER: PlanSeed = {
  key: 'ul',
  name: 'Upper / Lower',
  description: '4-day strength-biased upper/lower split. Big lifts first, accessories after.',
  goal: 'strength',
  daysPerWeek: 4,
  days: [
    {
      name: 'Upper A',
      exercises: [
        { exercise: 'Barbell Bench Press', targetSets: 5, targetReps: '5', targetRpe: 8, restSeconds: 240 },
        { exercise: 'Barbell Row', targetSets: 4, targetReps: '6-8', targetRpe: 8, restSeconds: 180 },
        { exercise: 'Overhead Press', targetSets: 3, targetReps: '8-10', targetRpe: 8, restSeconds: 150 },
        { exercise: 'Lat Pulldown', targetSets: 3, targetReps: '10-12', targetRpe: 9, restSeconds: 120 },
      ],
    },
    {
      name: 'Lower A',
      exercises: [
        { exercise: 'Barbell Back Squat', targetSets: 5, targetReps: '5', targetRpe: 8, restSeconds: 240 },
        { exercise: 'Romanian Deadlift', targetSets: 3, targetReps: '8', targetRpe: 8, restSeconds: 180 },
        { exercise: 'Leg Extension', targetSets: 3, targetReps: '12-15', targetRpe: 9, restSeconds: 90 },
        { exercise: 'Hanging Leg Raise', targetSets: 3, targetReps: '10-15', targetRpe: 9, restSeconds: 60 },
      ],
    },
  ],
};

const FULL_BODY: PlanSeed = {
  key: 'fb',
  name: 'Full Body 3x',
  description: 'Efficient 3-day full-body plan for busy weeks. Compound-first.',
  goal: 'general_fitness',
  daysPerWeek: 3,
  days: [
    {
      name: 'Day A',
      exercises: [
        { exercise: 'Barbell Back Squat', targetSets: 3, targetReps: '8', targetRpe: 8, restSeconds: 180 },
        { exercise: 'Barbell Bench Press', targetSets: 3, targetReps: '8', targetRpe: 8, restSeconds: 180 },
        { exercise: 'Barbell Row', targetSets: 3, targetReps: '10', targetRpe: 8, restSeconds: 150 },
        { exercise: 'Plank', targetSets: 3, targetReps: '45s', targetRpe: null, restSeconds: 60 },
      ],
    },
    {
      name: 'Day B',
      exercises: [
        { exercise: 'Conventional Deadlift', targetSets: 3, targetReps: '5', targetRpe: 8, restSeconds: 240 },
        { exercise: 'Overhead Press', targetSets: 3, targetReps: '8-10', targetRpe: 8, restSeconds: 150 },
        { exercise: 'Lat Pulldown', targetSets: 3, targetReps: '10-12', targetRpe: 9, restSeconds: 120 },
        { exercise: 'Hip Thrust', targetSets: 3, targetReps: '10-12', targetRpe: 8, restSeconds: 120 },
      ],
    },
  ],
};

export const PLANS: Record<string, PlanSeed> = { ppl: PPL, ul: UPPER_LOWER, fb: FULL_BODY };

/* -------------------------- Template plans ------------------------------- */

const BEGINNER_FULL_BODY: PlanSeed = {
  key: 'beginner-fb',
  name: 'Full-Body Beginner',
  description: 'Your first 3 months in the gym. Compound lifts, moderate reps, lots of practice.',
  goal: 'general_fitness',
  daysPerWeek: 3,
  days: [
    {
      name: 'Day A',
      exercises: [
        { exercise: 'Bodyweight Squat', targetSets: 3, targetReps: '12-15', targetRpe: 6, restSeconds: 90 },
        { exercise: 'Push-Up', targetSets: 3, targetReps: '8-12', targetRpe: 7, restSeconds: 90 },
        { exercise: 'Lat Pulldown', targetSets: 3, targetReps: '10-12', targetRpe: 7, restSeconds: 90 },
        { exercise: 'Plank', targetSets: 3, targetReps: '30s', targetRpe: null, restSeconds: 60 },
      ],
    },
    {
      name: 'Day B',
      exercises: [
        { exercise: 'Goblet Squat', targetSets: 3, targetReps: '10-12', targetRpe: 7, restSeconds: 90 },
        { exercise: 'Dumbbell Shoulder Press', targetSets: 3, targetReps: '10-12', targetRpe: 7, restSeconds: 90 },
        { exercise: 'Seated Cable Row', targetSets: 3, targetReps: '10-12', targetRpe: 7, restSeconds: 90 },
        { exercise: 'Glute Bridge', targetSets: 3, targetReps: '12-15', targetRpe: 7, restSeconds: 60 },
      ],
    },
    {
      name: 'Day C',
      exercises: [
        { exercise: 'Leg Press', targetSets: 3, targetReps: '12-15', targetRpe: 7, restSeconds: 90 },
        { exercise: 'Flat Dumbbell Press', targetSets: 3, targetReps: '10-12', targetRpe: 7, restSeconds: 90 },
        { exercise: 'Inverted Row', targetSets: 3, targetReps: '8-12', targetRpe: 7, restSeconds: 90 },
        { exercise: 'Dead Bug', targetSets: 3, targetReps: '10-12', targetRpe: null, restSeconds: 60 },
      ],
    },
  ],
};

const BRO_SPLIT: PlanSeed = {
  key: 'bro',
  name: 'Bro Split',
  description: 'One muscle group per day, 5 days a week. High volume, maximum pump.',
  goal: 'hypertrophy',
  daysPerWeek: 5,
  days: [
    {
      name: 'Chest',
      exercises: [
        { exercise: 'Barbell Bench Press', targetSets: 4, targetReps: '8-10', targetRpe: 8, restSeconds: 150 },
        { exercise: 'Incline Dumbbell Press', targetSets: 4, targetReps: '10-12', targetRpe: 8, restSeconds: 120 },
        { exercise: 'Cable Fly', targetSets: 3, targetReps: '12-15', targetRpe: 9, restSeconds: 90 },
        { exercise: 'Chest Dip', targetSets: 3, targetReps: '8-12', targetRpe: 9, restSeconds: 90 },
      ],
    },
    {
      name: 'Back',
      exercises: [
        { exercise: 'Pull-Up', targetSets: 4, targetReps: '6-10', targetRpe: 8, restSeconds: 150 },
        { exercise: 'Barbell Row', targetSets: 4, targetReps: '8-10', targetRpe: 8, restSeconds: 150 },
        { exercise: 'Seated Cable Row', targetSets: 3, targetReps: '10-12', targetRpe: 9, restSeconds: 90 },
        { exercise: 'Straight-Arm Pulldown', targetSets: 3, targetReps: '12-15', targetRpe: 9, restSeconds: 75 },
      ],
    },
    {
      name: 'Shoulders',
      exercises: [
        { exercise: 'Overhead Press', targetSets: 4, targetReps: '8-10', targetRpe: 8, restSeconds: 150 },
        { exercise: 'Lateral Raise', targetSets: 4, targetReps: '12-15', targetRpe: 9, restSeconds: 75 },
        { exercise: 'Rear Delt Fly', targetSets: 3, targetReps: '15-20', targetRpe: 9, restSeconds: 60 },
        { exercise: 'Barbell Shrug', targetSets: 3, targetReps: '10-12', targetRpe: 8, restSeconds: 90 },
      ],
    },
    {
      name: 'Legs',
      exercises: [
        { exercise: 'Barbell Back Squat', targetSets: 4, targetReps: '8-10', targetRpe: 8, restSeconds: 180 },
        { exercise: 'Romanian Deadlift', targetSets: 3, targetReps: '10-12', targetRpe: 8, restSeconds: 150 },
        { exercise: 'Leg Extension', targetSets: 3, targetReps: '12-15', targetRpe: 9, restSeconds: 90 },
        { exercise: 'Seated Leg Curl', targetSets: 3, targetReps: '12-15', targetRpe: 9, restSeconds: 90 },
        { exercise: 'Standing Calf Raise', targetSets: 4, targetReps: '12-15', targetRpe: 9, restSeconds: 60 },
      ],
    },
    {
      name: 'Arms',
      exercises: [
        { exercise: 'Barbell Curl', targetSets: 4, targetReps: '10-12', targetRpe: 9, restSeconds: 90 },
        { exercise: 'Close-Grip Bench Press', targetSets: 4, targetReps: '8-10', targetRpe: 8, restSeconds: 120 },
        { exercise: 'Hammer Curl', targetSets: 3, targetReps: '12-15', targetRpe: 9, restSeconds: 75 },
        { exercise: 'Rope Overhead Extension', targetSets: 3, targetReps: '12-15', targetRpe: 9, restSeconds: 75 },
      ],
    },
  ],
};

const POWERLIFTING: PlanSeed = {
  key: 'pl',
  name: 'Powerlifting Focus',
  description: 'Squat, bench, deadlift. Heavy low-rep work with long rest and accessory support.',
  goal: 'strength',
  daysPerWeek: 4,
  days: [
    {
      name: 'Squat Day',
      exercises: [
        { exercise: 'Barbell Back Squat', targetSets: 5, targetReps: '3-5', targetRpe: 8, restSeconds: 300 },
        { exercise: 'Front Squat', targetSets: 3, targetReps: '5-6', targetRpe: 7, restSeconds: 240 },
        { exercise: 'Leg Press', targetSets: 3, targetReps: '8-10', targetRpe: 8, restSeconds: 180 },
        { exercise: 'Hanging Leg Raise', targetSets: 3, targetReps: '10-15', targetRpe: 8, restSeconds: 90 },
      ],
    },
    {
      name: 'Bench Day',
      exercises: [
        { exercise: 'Barbell Bench Press', targetSets: 5, targetReps: '3-5', targetRpe: 8, restSeconds: 300 },
        { exercise: 'Close-Grip Bench Press', targetSets: 3, targetReps: '6-8', targetRpe: 8, restSeconds: 210 },
        { exercise: 'Barbell Row', targetSets: 4, targetReps: '6-8', targetRpe: 8, restSeconds: 180 },
        { exercise: 'Triceps Pushdown', targetSets: 3, targetReps: '10-12', targetRpe: 9, restSeconds: 90 },
      ],
    },
    {
      name: 'Deadlift Day',
      exercises: [
        { exercise: 'Conventional Deadlift', targetSets: 4, targetReps: '3-5', targetRpe: 8, restSeconds: 300 },
        { exercise: 'Good Morning', targetSets: 3, targetReps: '8-10', targetRpe: 7, restSeconds: 210 },
        { exercise: 'Chest-Supported Row', targetSets: 3, targetReps: '8-10', targetRpe: 8, restSeconds: 150 },
        { exercise: 'Back Extension', targetSets: 3, targetReps: '12-15', targetRpe: 8, restSeconds: 90 },
      ],
    },
    {
      name: 'Overhead Day',
      exercises: [
        { exercise: 'Overhead Press', targetSets: 5, targetReps: '3-5', targetRpe: 8, restSeconds: 240 },
        { exercise: 'Incline Barbell Bench Press', targetSets: 3, targetReps: '6-8', targetRpe: 8, restSeconds: 210 },
        { exercise: 'Pull-Up', targetSets: 4, targetReps: '6-10', targetRpe: 8, restSeconds: 150 },
        { exercise: 'Face Pull', targetSets: 3, targetReps: '15-20', targetRpe: 9, restSeconds: 60 },
      ],
    },
  ],
};

const HOME_BODYWEIGHT: PlanSeed = {
  key: 'home',
  name: 'Home / Bodyweight',
  description: 'No gym needed. Bodyweight and resistance bands only — train anywhere.',
  goal: 'general_fitness',
  daysPerWeek: 4,
  days: [
    {
      name: 'Push',
      exercises: [
        { exercise: 'Push-Up', targetSets: 4, targetReps: '10-20', targetRpe: 8, restSeconds: 90 },
        { exercise: 'Band Overhead Press', targetSets: 3, targetReps: '12-15', targetRpe: 8, restSeconds: 75 },
        { exercise: 'Band Chest Press', targetSets: 3, targetReps: '12-15', targetRpe: 8, restSeconds: 75 },
        { exercise: 'Triceps Dip', targetSets: 3, targetReps: '8-15', targetRpe: 9, restSeconds: 75 },
      ],
    },
    {
      name: 'Pull',
      exercises: [
        { exercise: 'Band-Assisted Pull-Up', targetSets: 4, targetReps: '6-10', targetRpe: 8, restSeconds: 120 },
        { exercise: 'Band Row', targetSets: 4, targetReps: '12-15', targetRpe: 8, restSeconds: 75 },
        { exercise: 'Band Pull-Apart', targetSets: 3, targetReps: '15-20', targetRpe: 8, restSeconds: 60 },
        { exercise: 'Band Bicep Curl', targetSets: 3, targetReps: '12-15', targetRpe: 9, restSeconds: 60 },
      ],
    },
    {
      name: 'Legs',
      exercises: [
        { exercise: 'Bodyweight Squat', targetSets: 4, targetReps: '15-25', targetRpe: 8, restSeconds: 90 },
        { exercise: 'Walking Lunge', targetSets: 3, targetReps: '12-16', targetRpe: 8, restSeconds: 90 },
        { exercise: 'Glute Bridge', targetSets: 3, targetReps: '15-20', targetRpe: 8, restSeconds: 60 },
        { exercise: 'Band Lateral Walk', targetSets: 3, targetReps: '15-20', targetRpe: 8, restSeconds: 60 },
      ],
    },
    {
      name: 'Core & Conditioning',
      exercises: [
        { exercise: 'Burpee', targetSets: 4, targetReps: '10-15', targetRpe: 8, restSeconds: 90 },
        { exercise: 'Mountain Climber', targetSets: 3, targetReps: '30s', targetRpe: 8, restSeconds: 60 },
        { exercise: 'Plank', targetSets: 3, targetReps: '45s', targetRpe: null, restSeconds: 60 },
        { exercise: 'Bicycle Crunch', targetSets: 3, targetReps: '15-20', targetRpe: 8, restSeconds: 60 },
      ],
    },
  ],
};

/**
 * Curated plans seeded as global templates (owned by the system user).
 * Every exercise name here must exist in the global catalog — the seed resolves
 * names to ids and throws on a miss.
 */
export const TEMPLATE_PLANS: PlanSeed[] = [
  PPL,
  UPPER_LOWER,
  FULL_BODY,
  BEGINNER_FULL_BODY,
  BRO_SPLIT,
  POWERLIFTING,
  HOME_BODYWEIGHT,
];

/* -------------------------- Session fixtures ----------------------------- */

export interface SessionExerciseSeed {
  exercise: string;
  weights: number[];
  reps: number[];
  rpe?: number;
}

export interface SessionSeed {
  name: string;
  /** Which plan/day this session followed (by day name), or null for freestyle. */
  planKey: string | null;
  planDayName: string | null;
  daysAgo: number;
  durationMin: number;
  exercises: SessionExerciseSeed[];
}

/** ~8 progressive PPL sessions over the last 3 weeks (used by the hypertrophy persona). */
export const PPL_SESSIONS: SessionSeed[] = [
  {
    name: 'Push A', planKey: 'ppl', planDayName: 'Push A', daysAgo: 21, durationMin: 62,
    exercises: [
      { exercise: 'Barbell Bench Press', weights: [80, 80, 80, 77.5], reps: [8, 8, 7, 8], rpe: 8 },
      { exercise: 'Overhead Press', weights: [47.5, 47.5, 47.5], reps: [10, 9, 8], rpe: 8 },
      { exercise: 'Lateral Raise', weights: [10, 10, 10, 10], reps: [15, 15, 14, 12], rpe: 9 },
      { exercise: 'Triceps Pushdown', weights: [30, 30, 30], reps: [12, 12, 10], rpe: 9 },
    ],
  },
  {
    name: 'Pull A', planKey: 'ppl', planDayName: 'Pull A', daysAgo: 19, durationMin: 58,
    exercises: [
      { exercise: 'Conventional Deadlift', weights: [140, 125, 125], reps: [5, 5, 5], rpe: 8 },
      { exercise: 'Pull-Up', weights: [0, 0, 0, 0], reps: [10, 9, 8, 7], rpe: 9 },
      { exercise: 'Barbell Row', weights: [70, 70, 70], reps: [10, 9, 8], rpe: 8 },
      { exercise: 'Barbell Curl', weights: [30, 30, 30], reps: [12, 11, 10], rpe: 9 },
    ],
  },
  {
    name: 'Legs A', planKey: 'ppl', planDayName: 'Legs A', daysAgo: 17, durationMin: 68,
    exercises: [
      { exercise: 'Barbell Back Squat', weights: [110, 110, 110, 105], reps: [8, 8, 7, 8], rpe: 8 },
      { exercise: 'Romanian Deadlift', weights: [90, 90, 90], reps: [10, 9, 9], rpe: 8 },
      { exercise: 'Leg Press', weights: [180, 180, 180], reps: [12, 11, 10], rpe: 9 },
      { exercise: 'Standing Calf Raise', weights: [60, 60, 60, 60], reps: [15, 14, 13, 12], rpe: 9 },
    ],
  },
  {
    name: 'Push A', planKey: 'ppl', planDayName: 'Push A', daysAgo: 14, durationMin: 65,
    exercises: [
      { exercise: 'Barbell Bench Press', weights: [82.5, 82.5, 82.5, 80], reps: [8, 7, 7, 8], rpe: 8 },
      { exercise: 'Overhead Press', weights: [50, 50, 47.5], reps: [9, 8, 9], rpe: 8 },
      { exercise: 'Incline Dumbbell Press', weights: [28, 28, 28], reps: [12, 11, 10], rpe: 9 },
      { exercise: 'Lateral Raise', weights: [10, 10, 10, 10], reps: [15, 15, 15, 13], rpe: 9 },
    ],
  },
  {
    name: 'Pull A', planKey: 'ppl', planDayName: 'Pull A', daysAgo: 12, durationMin: 60,
    exercises: [
      { exercise: 'Conventional Deadlift', weights: [145, 130, 130], reps: [5, 5, 5], rpe: 8 },
      { exercise: 'Pull-Up', weights: [0, 0, 0, 0], reps: [10, 10, 9, 8], rpe: 9 },
      { exercise: 'Barbell Row', weights: [72.5, 72.5, 72.5], reps: [10, 9, 9], rpe: 8 },
      { exercise: 'Face Pull', weights: [25, 25, 25], reps: [18, 17, 15], rpe: 9 },
    ],
  },
  {
    name: 'Legs A', planKey: 'ppl', planDayName: 'Legs A', daysAgo: 10, durationMin: 70,
    exercises: [
      { exercise: 'Barbell Back Squat', weights: [112.5, 112.5, 112.5, 107.5], reps: [8, 8, 8, 8], rpe: 8 },
      { exercise: 'Romanian Deadlift', weights: [92.5, 92.5, 92.5], reps: [10, 10, 9], rpe: 8 },
      { exercise: 'Leg Curl', weights: [45, 45, 45], reps: [12, 11, 10], rpe: 9 },
      { exercise: 'Standing Calf Raise', weights: [62.5, 62.5, 62.5, 62.5], reps: [15, 14, 13, 12], rpe: 9 },
    ],
  },
  {
    name: 'Push A', planKey: 'ppl', planDayName: 'Push A', daysAgo: 7, durationMin: 63,
    exercises: [
      { exercise: 'Barbell Bench Press', weights: [85, 85, 85, 82.5], reps: [7, 7, 6, 8], rpe: 8 },
      { exercise: 'Overhead Press', weights: [50, 50, 50], reps: [10, 9, 8], rpe: 8 },
      { exercise: 'Incline Dumbbell Press', weights: [30, 30, 30], reps: [11, 10, 10], rpe: 9 },
      { exercise: 'Triceps Pushdown', weights: [32.5, 32.5, 32.5], reps: [12, 11, 10], rpe: 9 },
    ],
  },
  {
    name: 'Freestyle Upper', planKey: null, planDayName: null, daysAgo: 3, durationMin: 48,
    exercises: [
      { exercise: 'Barbell Bench Press', weights: [87.5, 87.5, 85], reps: [6, 5, 6], rpe: 9 },
      { exercise: 'Pull-Up', weights: [5, 5, 5], reps: [8, 7, 6], rpe: 9 },
      { exercise: 'Dumbbell Shoulder Press', weights: [24, 24, 24], reps: [10, 9, 8], rpe: 8 },
      { exercise: 'Dumbbell Curl', weights: [14, 14, 14], reps: [12, 11, 10], rpe: 9 },
    ],
  },
];

/** ~6 upper/lower sessions (strength-biased) for the fat-loss persona. */
export const UL_SESSIONS: SessionSeed[] = [
  {
    name: 'Upper A', planKey: 'ul', planDayName: 'Upper A', daysAgo: 18, durationMin: 55,
    exercises: [
      { exercise: 'Barbell Bench Press', weights: [90, 90, 90, 90, 87.5], reps: [5, 5, 5, 5, 5], rpe: 8 },
      { exercise: 'Barbell Row', weights: [75, 75, 75, 75], reps: [8, 8, 7, 7], rpe: 8 },
      { exercise: 'Overhead Press', weights: [52.5, 52.5, 52.5], reps: [9, 8, 8], rpe: 8 },
      { exercise: 'Lat Pulldown', weights: [65, 65, 65], reps: [12, 11, 10], rpe: 9 },
    ],
  },
  {
    name: 'Lower A', planKey: 'ul', planDayName: 'Lower A', daysAgo: 16, durationMin: 58,
    exercises: [
      { exercise: 'Barbell Back Squat', weights: [120, 120, 120, 120, 115], reps: [5, 5, 5, 5, 5], rpe: 8 },
      { exercise: 'Romanian Deadlift', weights: [100, 100, 100], reps: [8, 8, 8], rpe: 8 },
      { exercise: 'Leg Extension', weights: [50, 50, 50], reps: [15, 13, 12], rpe: 9 },
    ],
  },
  {
    name: 'Upper A', planKey: 'ul', planDayName: 'Upper A', daysAgo: 11, durationMin: 56,
    exercises: [
      { exercise: 'Barbell Bench Press', weights: [92.5, 92.5, 92.5, 92.5, 90], reps: [5, 5, 5, 5, 5], rpe: 8 },
      { exercise: 'Barbell Row', weights: [77.5, 77.5, 77.5, 77.5], reps: [8, 8, 8, 7], rpe: 8 },
      { exercise: 'Overhead Press', weights: [55, 55, 52.5], reps: [8, 8, 9], rpe: 9 },
      { exercise: 'Lat Pulldown', weights: [67.5, 67.5, 67.5], reps: [12, 11, 11], rpe: 9 },
    ],
  },
  {
    name: 'Lower A', planKey: 'ul', planDayName: 'Lower A', daysAgo: 9, durationMin: 60,
    exercises: [
      { exercise: 'Barbell Back Squat', weights: [122.5, 122.5, 122.5, 122.5, 117.5], reps: [5, 5, 5, 5, 5], rpe: 8 },
      { exercise: 'Romanian Deadlift', weights: [102.5, 102.5, 102.5], reps: [8, 8, 7], rpe: 8 },
      { exercise: 'Leg Extension', weights: [52.5, 52.5, 52.5], reps: [15, 14, 12], rpe: 9 },
    ],
  },
  {
    name: 'Upper A', planKey: 'ul', planDayName: 'Upper A', daysAgo: 4, durationMin: 54,
    exercises: [
      { exercise: 'Barbell Bench Press', weights: [95, 95, 95, 92.5, 92.5], reps: [5, 5, 4, 5, 5], rpe: 9 },
      { exercise: 'Barbell Row', weights: [80, 80, 80, 77.5], reps: [8, 7, 7, 8], rpe: 8 },
      { exercise: 'Overhead Press', weights: [55, 55, 55], reps: [8, 8, 7], rpe: 9 },
    ],
  },
  {
    name: 'Lower A', planKey: 'ul', planDayName: 'Lower A', daysAgo: 2, durationMin: 57,
    exercises: [
      { exercise: 'Barbell Back Squat', weights: [125, 125, 125, 125, 120], reps: [5, 5, 5, 4, 5], rpe: 9 },
      { exercise: 'Romanian Deadlift', weights: [105, 105, 105], reps: [8, 8, 8], rpe: 8 },
      { exercise: 'Leg Extension', weights: [55, 55, 55], reps: [14, 13, 12], rpe: 9 },
    ],
  },
];

/** ~5 full-body sessions for the strength/general persona. */
export const FB_SESSIONS: SessionSeed[] = [
  {
    name: 'Day A', planKey: 'fb', planDayName: 'Day A', daysAgo: 15, durationMin: 50,
    exercises: [
      { exercise: 'Barbell Back Squat', weights: [90, 90, 90], reps: [8, 8, 8], rpe: 8 },
      { exercise: 'Barbell Bench Press', weights: [70, 70, 70], reps: [8, 8, 7], rpe: 8 },
      { exercise: 'Barbell Row', weights: [60, 60, 60], reps: [10, 10, 9], rpe: 8 },
    ],
  },
  {
    name: 'Day B', planKey: 'fb', planDayName: 'Day B', daysAgo: 13, durationMin: 52,
    exercises: [
      { exercise: 'Conventional Deadlift', weights: [120, 120, 120], reps: [5, 5, 5], rpe: 8 },
      { exercise: 'Overhead Press', weights: [45, 45, 45], reps: [10, 9, 8], rpe: 8 },
      { exercise: 'Lat Pulldown', weights: [60, 60, 60], reps: [12, 11, 10], rpe: 9 },
    ],
  },
  {
    name: 'Day A', planKey: 'fb', planDayName: 'Day A', daysAgo: 8, durationMin: 51,
    exercises: [
      { exercise: 'Barbell Back Squat', weights: [92.5, 92.5, 92.5], reps: [8, 8, 8], rpe: 8 },
      { exercise: 'Barbell Bench Press', weights: [72.5, 72.5, 72.5], reps: [8, 8, 8], rpe: 8 },
      { exercise: 'Barbell Row', weights: [62.5, 62.5, 62.5], reps: [10, 10, 10], rpe: 8 },
    ],
  },
  {
    name: 'Day B', planKey: 'fb', planDayName: 'Day B', daysAgo: 6, durationMin: 53,
    exercises: [
      { exercise: 'Conventional Deadlift', weights: [125, 125, 125], reps: [5, 5, 5], rpe: 8 },
      { exercise: 'Overhead Press', weights: [47.5, 47.5, 47.5], reps: [10, 9, 9], rpe: 8 },
      { exercise: 'Hip Thrust', weights: [100, 100, 100], reps: [12, 11, 10], rpe: 8 },
    ],
  },
  {
    name: 'Day A', planKey: 'fb', planDayName: 'Day A', daysAgo: 1, durationMin: 49,
    exercises: [
      { exercise: 'Barbell Back Squat', weights: [95, 95, 95], reps: [8, 8, 7], rpe: 9 },
      { exercise: 'Barbell Bench Press', weights: [75, 75, 75], reps: [8, 7, 7], rpe: 9 },
      { exercise: 'Barbell Row', weights: [65, 65, 65], reps: [10, 9, 9], rpe: 8 },
    ],
  },
];

/* -------------------------- Food-log fixtures ---------------------------- */

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface FoodEntrySeed {
  food: string; // food name — resolved to a catalog id
  servings: number;
  meal: Meal;
}

/** A day of eating (keyed by daysAgo). */
export interface FoodDaySeed {
  daysAgo: number;
  entries: FoodEntrySeed[];
}

export const FOOD_DAYS: FoodDaySeed[] = [
  {
    daysAgo: 0,
    entries: [
      { food: 'Rolled Oats (dry)', servings: 1, meal: 'breakfast' },
      { food: 'Whey Protein', servings: 1, meal: 'breakfast' },
      { food: 'Banana', servings: 1, meal: 'breakfast' },
      { food: 'Chicken Breast', servings: 1.5, meal: 'lunch' },
      { food: 'White Rice (cooked)', servings: 2, meal: 'lunch' },
      { food: 'Broccoli', servings: 1, meal: 'lunch' },
      { food: 'Greek Yogurt (0%)', servings: 1, meal: 'snacks' },
    ],
  },
  {
    daysAgo: 1,
    entries: [
      { food: 'Whole Egg', servings: 3, meal: 'breakfast' },
      { food: 'Whole Wheat Bread', servings: 2, meal: 'breakfast' },
      { food: 'Salmon Fillet', servings: 1.5, meal: 'dinner' },
      { food: 'Sweet Potato', servings: 1, meal: 'dinner' },
      { food: 'Almonds', servings: 1, meal: 'snacks' },
      { food: 'Apple', servings: 1, meal: 'snacks' },
    ],
  },
];

/* ---------------------------- Weight history ----------------------------- */

/** ~10 weight points trending from `start` toward `end` over ~5 weeks. */
export function weightTrend(start: number, end: number, points = 10): number[] {
  const step = (end - start) / (points - 1);
  return Array.from({ length: points }, (_, i) => Math.round((start + step * i) * 10) / 10);
}

