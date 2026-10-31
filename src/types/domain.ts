export type Role = 'athlete' | 'coach' | 'gym_owner' | 'admin';

export interface UserProfile {
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  goal?: 'muscle_gain' | 'fat_loss' | 'strength' | 'general_fitness' | 'race';
  trainingDaysPerWeek?: number;
  equipmentAccess?: string[];
  injuries?: string;
  bodyModelPreference?: 'male' | 'female';
  shareDetailedLogs?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  roles: Role[];
  gymId?: string | null;
  profile: UserProfile;
  onboardingCompleted: boolean;
  createdAt: string;
}

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

export interface Muscle {
  _id: string;
  key: string;
  displayName: string;
  group: MuscleGroup;
  description: string;
  meshNames: string[];
}

export interface MuscleRef {
  _id: string;
  key: string;
  displayName: string;
  group: MuscleGroup;
}

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseType = 'strength' | 'cardio' | 'mobility';

export interface Exercise {
  _id: string;
  name: string;
  slug: string;
  primaryMuscles: MuscleRef[];
  secondaryMuscles: MuscleRef[];
  equipment: string[];
  difficulty: ExerciseDifficulty;
  instructions: string[];
  videoUrl: string | null;
  type: ExerciseType;
}

export interface ExerciseSummary {
  _id: string;
  name: string;
  slug: string;
  difficulty: ExerciseDifficulty;
  equipment: string[];
  type: ExerciseType;
}

export interface ExerciseRef {
  _id: string;
  name: string;
  slug: string;
}

export type WorkoutStatus = 'planned' | 'completed' | 'skipped';

export interface WorkoutItem {
  exerciseId: ExerciseRef | string;
  sets: number;
  reps: number;
  targetWeightKg: number | null;
  restSec: number;
  notes: string;
}

export interface Workout {
  _id: string;
  athleteId: string;
  assignedBy: string;
  date: string;
  title: string;
  items: WorkoutItem[];
  status: WorkoutStatus;
}

export interface SetLog {
  reps: number;
  weightKg: number;
}

export interface WorkoutLogItem {
  exerciseId: ExerciseRef | string;
  sets: SetLog[];
}

export interface WorkoutLog {
  _id: string;
  athleteId: string;
  workoutId: string | null;
  date: string;
  items: WorkoutLogItem[];
  durationMin: number;
  perceivedEffort: number | null;
  painFlag: boolean;
  notes: string;
  source: 'app' | 'kiosk';
}

export interface NeglectedMuscleGroup {
  group: MuscleGroup;
  daysSinceTrained: number | null;
}

export interface PersonalBest {
  exercise: { name: string; slug: string };
  weightKg: number;
  date: string;
}

export interface Attendance {
  sessionsPerWeek: number;
  longestStreak: number;
  totalSessions: number;
}

export interface AthleteInsights {
  volume7d: Record<string, number>;
  volume14d: Record<string, number>;
  neglectedMuscleGroups: NeglectedMuscleGroup[];
  volumeTrend: Record<string, number>[];
  personalBests: PersonalBest[];
  attendance: Attendance;
}

export interface AthleteHomeData {
  todaysWorkout: Workout | null;
  currentStreak: number;
  daysSinceLastWorkout: number | null;
}

export interface CoachAthleteSummary {
  athlete: { _id: string; name: string; email: string; profile: UserProfile };
  lastWorkoutDate: string | null;
  sessionsThisWeek: number;
  skippedCount: number;
  hasPainFlag: boolean;
  neglectedMuscleGroups: NeglectedMuscleGroup[];
  coachAthleteId: string;
  linkStatus: string;
}

export interface InvitedAthlete {
  _id: string;
  athleteId: { _id: string; name: string; email: string } | null;
  status: string;
}

export interface WorkoutTemplateItem {
  exerciseId: ExerciseRef | string;
  sets: number;
  reps: number;
  targetWeightKg: number | null;
  restSec: number;
  notes: string;
}

export interface WorkoutTemplate {
  _id: string;
  coachId: string;
  title: string;
  items: WorkoutTemplateItem[];
  createdAt: string;
}

export interface Comment {
  _id: string;
  workoutId: string | null;
  workoutLogId: string | null;
  authorId: { _id: string; name: string; roles: Role[] };
  text: string;
  createdAt: string;
}
