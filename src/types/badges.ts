export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  requirement: BadgeRequirement;
  earnedAt?: Date;
}

export type BadgeCategory = 'milestone' | 'category' | 'streak' | 'special';

export interface BadgeRequirement {
  type: 'missions_completed' | 'category_missions' | 'observations' | 'streak_days' | 'outdoor_minutes' | 'screen_rest' | 'categories_explored';
  count: number;
  category?: string;
}

export interface UserStats {
  totalOutdoorMinutes: number;
  adventuresCompleted: number;
  totalObservations: number;
  categoriesExplored: string[];
  currentStreak: number;
  longestStreak: number;
  weeklyMinutes: number[];
  lastActiveDate?: Date;
  screenRestSessions: number;
}
