export type {
  UserPreferences,
  Mission,
  MissionTask,
  CompletedMission,
  MissionGenerationParams,
  MissionCategory,
  MissionDifficulty,
  MissionEnvironment,
  MissionMood,
} from './mission';
export type { JournalEntry, JournalCategory, JournalFilter } from './journal';
export type { IdentificationResult, VisionServiceStatus } from './identification';
export type { Badge, BadgeCategory, BadgeRequirement, UserStats } from './badges';

export interface AIServiceStatus {
  provider: 'ollama' | 'chrome-ai' | 'fallback' | 'initializing' | string;
  available: boolean;
  loading: boolean;
  modelName: string;
  isLocal: boolean;
  error?: string;
}

export interface NaturalistResponse {
  answer: string;
  suggestedName?: string;
  category?: 'bird' | 'plant' | 'insect' | 'fungus' | 'mammal' | 'landscape' | 'other';
  confidenceText?: string;
  confidence?: number | null;
  characteristics: string[];
  natureFacts?: string[];
  ecologicalContext: string;
  safetyCaution?: string;
  suggestedFollowUp?: string;
  source: 'gemini' | 'ollama' | 'offline-guide' | string;
  notFound?: boolean;
  error?: string;
  apiNotice?: string;
}


