import type { Badge, BadgeRequirement } from '../types/badges';

export const BADGE_DEFINITIONS: Omit<Badge, 'earnedAt'>[] = [
  {
    id: 'first-footsteps',
    name: 'First Footsteps',
    description: 'Complete your very first outdoor mission',
    icon: '👣',
    category: 'milestone',
    requirement: { type: 'missions_completed', count: 1 },
  },
  {
    id: 'trail-walker',
    name: 'Trail Walker',
    description: 'Complete 5 outdoor missions',
    icon: '🥾',
    category: 'milestone',
    requirement: { type: 'missions_completed', count: 5 },
  },
  {
    id: 'nature-veteran',
    name: 'Nature Veteran',
    description: 'Complete 15 outdoor missions',
    icon: '🏕️',
    category: 'milestone',
    requirement: { type: 'missions_completed', count: 15 },
  },
  {
    id: 'bird-detective',
    name: 'Bird Detective',
    description: 'Complete 3 bird-themed missions',
    icon: '🐦',
    category: 'category',
    requirement: { type: 'category_missions', count: 3, category: 'birds' },
  },
  {
    id: 'curious-botanist',
    name: 'Curious Botanist',
    description: 'Record 5 plant observations in your journal',
    icon: '🌿',
    category: 'category',
    requirement: { type: 'observations', count: 5, category: 'plant' },
  },
  {
    id: 'bug-hunter',
    name: 'Bug Hunter',
    description: 'Complete 3 insect-themed missions',
    icon: '🐛',
    category: 'category',
    requirement: { type: 'category_missions', count: 3, category: 'insects' },
  },
  {
    id: 'forest-guardian',
    name: 'Forest Guardian',
    description: 'Complete 3 forest-themed missions',
    icon: '🌲',
    category: 'category',
    requirement: { type: 'category_missions', count: 3, category: 'forests' },
  },
  {
    id: 'mindful-explorer',
    name: 'Mindful Explorer',
    description: 'Complete 3 mindfulness missions',
    icon: '🧘',
    category: 'category',
    requirement: { type: 'category_missions', count: 3, category: 'mindfulness' },
  },
  {
    id: 'keen-observer',
    name: 'Keen Observer',
    description: 'Record 10 observations in your journal',
    icon: '🔍',
    category: 'milestone',
    requirement: { type: 'observations', count: 10 },
  },
  {
    id: 'nature-regular',
    name: 'Nature Regular',
    description: 'Explore on 5 separate days',
    icon: '📅',
    category: 'streak',
    requirement: { type: 'streak_days', count: 5 },
  },
  {
    id: 'screen-free-explorer',
    name: 'Screen-Free Explorer',
    description: 'Use screen-rest mode during a mission',
    icon: '📵',
    category: 'special',
    requirement: { type: 'screen_rest', count: 1 },
  },
  {
    id: 'hour-outdoors',
    name: 'Golden Hour',
    description: 'Spend 60 cumulative minutes outdoors',
    icon: '⏱️',
    category: 'milestone',
    requirement: { type: 'outdoor_minutes', count: 60 },
  },
  {
    id: 'nature-marathon',
    name: 'Nature Marathon',
    description: 'Spend 300 cumulative minutes outdoors',
    icon: '🏅',
    category: 'milestone',
    requirement: { type: 'outdoor_minutes', count: 300 },
  },
  {
    id: 'renaissance-naturalist',
    name: 'Renaissance Naturalist',
    description: 'Explore 4 different categories',
    icon: '🎨',
    category: 'special',
    requirement: { type: 'categories_explored', count: 4 },
  },
];

export function evaluateBadge(
  badge: Omit<Badge, 'earnedAt'>,
  stats: {
    missionsCompleted: number;
    categoryMissions: Record<string, number>;
    observations: number;
    categoryObservations: Record<string, number>;
    streakDays: number;
    outdoorMinutes: number;
    screenRestSessions: number;
    categoriesExplored: number;
  }
): boolean {
  const req: BadgeRequirement = badge.requirement;
  switch (req.type) {
    case 'missions_completed':
      return stats.missionsCompleted >= req.count;
    case 'category_missions':
      return (stats.categoryMissions[req.category || ''] || 0) >= req.count;
    case 'observations':
      if (req.category) {
        return (stats.categoryObservations[req.category] || 0) >= req.count;
      }
      return stats.observations >= req.count;
    case 'streak_days':
      return stats.streakDays >= req.count;
    case 'outdoor_minutes':
      return stats.outdoorMinutes >= req.count;
    case 'screen_rest':
      return stats.screenRestSessions >= req.count;
    case 'categories_explored':
      return stats.categoriesExplored >= req.count;
    default:
      return false;
  }
}
