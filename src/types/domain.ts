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
