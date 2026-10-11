import { z } from 'zod';

export const MissionTaskSchema = z.object({
  id: z.string(),
  description: z.string().min(5).max(300),
  completed: z.boolean().default(false),
  order: z.number().int().min(0),
});

export const MissionSchema = z.object({
  id: z.string(),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  category: z.enum(['birds', 'plants', 'insects', 'forests', 'mindfulness', 'general']),
  duration: z.number().int().min(5).max(120),
  difficulty: z.enum(['beginner', 'intermediate', 'adventurous']),
  environment: z.enum(['garden', 'park', 'forest', 'neighborhood', 'any']),
  mood: z.enum(['curious', 'calm', 'energetic', 'mindful']).optional(),
  equipment: z.array(z.string()).default([]),
  tasks: z.array(MissionTaskSchema).min(3).max(7),
  observationTips: z.array(z.string().min(5)).min(1).max(5),
  natureFacts: z.array(z.string().min(10)).min(1).max(5),
  reflectionQuestion: z.string().min(10).max(300),
  safetyReminder: z.string().max(300).optional(),
  source: z.enum(['ai', 'curated']),
  aiEngine: z.string().optional(),
  generationLatencyMs: z.number().optional(),
  createdAt: z.coerce.date(),
});

export function validateMission(data: unknown) {
  return MissionSchema.safeParse(data);
}

import type { Mission, MissionCategory, MissionDifficulty, MissionEnvironment, MissionMood } from '../types/mission';

export function sanitizeMissionFromAI(raw: Record<string, unknown>, engine: string, latencyMs: number): Mission {
  const id = crypto.randomUUID();
  const now = new Date();

  const validCategories: MissionCategory[] = ['birds', 'plants', 'insects', 'forests', 'mindfulness', 'general'];
  const validDifficulties = ['beginner', 'intermediate', 'adventurous'] as const;
  const validEnvironments: MissionEnvironment[] = ['garden', 'park', 'forest', 'neighborhood', 'any'];

  const category = validCategories.includes(raw.category as MissionCategory) ? (raw.category as MissionCategory) : 'general';
  const difficulty = validDifficulties.includes(raw.difficulty as any) ? (raw.difficulty as typeof validDifficulties[number]) : 'beginner';
  const environment = validEnvironments.includes(raw.environment as MissionEnvironment) ? (raw.environment as MissionEnvironment) : 'any';

  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks.map((t: unknown, i: number) => ({
        id: `${id}-task-${i}`,
        description: typeof t === 'string' ? t : (t as Record<string, unknown>)?.description as string || `Task ${i + 1}`,
        completed: false,
        order: i,
      }))
    : [
        { id: `${id}-task-0`, description: 'Step outside and take three deep breaths to acclimate.', completed: false, order: 0 },
        { id: `${id}-task-1`, description: 'Walk slowly and identify natural features around you.', completed: false, order: 1 },
        { id: `${id}-task-2`, description: 'Choose one detail to inspect closely for two minutes.', completed: false, order: 2 },
      ];

  const toStringArray = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.filter((v): v is string => typeof v === 'string');
    return [];
  };

  return {
    id,
    title: typeof raw.title === 'string' && raw.title.trim().length > 0 ? raw.title.slice(0, 100) : 'Nature Discovery Expedition',
    description: typeof raw.description === 'string' && raw.description.trim().length > 0 ? raw.description.slice(0, 500) : 'Explore the natural textures, sounds, and life around you.',
    category,
    duration: typeof raw.duration === 'number' ? Math.min(Math.max(raw.duration, 5), 120) : 15,
    difficulty,
    environment,
    mood: raw.mood as MissionMood | undefined,
    equipment: toStringArray(raw.equipment),
    tasks: tasks.length >= 3 ? tasks : [
      ...tasks,
      { id: `${id}-task-fallback`, description: 'Observe and note down one intriguing element in your journal.', completed: false, order: tasks.length },
    ],
    observationTips: toStringArray(raw.observationTips).length > 0 ? toStringArray(raw.observationTips) : ['Take your time and listen closely to ambient sounds.'],
    natureFacts: toStringArray(raw.natureFacts).length > 0 ? toStringArray(raw.natureFacts) : ['Even a few square feet of soil or grass can host hundreds of microscopic species.'],
    reflectionQuestion: typeof raw.reflectionQuestion === 'string' ? raw.reflectionQuestion : 'What detail did you notice that you normally overlook?',
    safetyReminder: typeof raw.safetyReminder === 'string' ? raw.safetyReminder : undefined,
    source: 'ai',
    aiEngine: engine,
    generationLatencyMs: latencyMs,
    createdAt: now,
  };
}
