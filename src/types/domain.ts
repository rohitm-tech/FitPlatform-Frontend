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
