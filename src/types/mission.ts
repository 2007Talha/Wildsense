export interface UserPreferences {
  id?: number;
  completedOnboarding: boolean;
  favoriteActivities: string[];
  availableTime: 5 | 15 | 30 | 60;
  difficulty: 'beginner' | 'intermediate' | 'adventurous';
  interests: string[];
  region: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MissionTask {
  id: string;
  description: string;
  completed: boolean;
  order: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'adventurous';
  environment: MissionEnvironment;
  mood?: MissionMood;
  equipment: string[];
  tasks: MissionTask[];
  observationTips: string[];
  natureFacts: string[];
  reflectionQuestion: string;
  safetyReminder?: string;
  source: 'ai' | 'curated';
  aiEngine?: string;
  generationLatencyMs?: number;
  createdAt: Date;
}

export interface CompletedMission {
  id: string;
  missionId: string;
  mission: Mission;
  startedAt: Date;
  completedAt: Date;
  durationMinutes: number;
  userConfirmedDuration: boolean;
  tasksCompleted: number;
  totalTasks: number;
  reflectionAnswer?: string;
  discoveries: string[];
  screenRestUsed: boolean;
}

export type MissionDifficulty = 'beginner' | 'intermediate' | 'adventurous';
export type MissionCategory = 'birds' | 'plants' | 'insects' | 'forests' | 'mindfulness' | 'general';
export type MissionEnvironment = 'garden' | 'park' | 'forest' | 'neighborhood' | 'any';
export type MissionMood = 'curious' | 'calm' | 'energetic' | 'mindful';

export interface MissionGenerationParams {
  category: MissionCategory;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'adventurous';
  environment: MissionEnvironment;
  mood?: MissionMood;
  interests?: string[];
}
