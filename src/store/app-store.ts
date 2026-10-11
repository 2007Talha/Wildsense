import { create } from 'zustand';
import type { Mission, CompletedMission, JournalEntry, UserPreferences } from '../types';
import type { AIServiceStatus } from '../services/ai/ai-service';
import { db } from '../services/storage/db';
import { BADGE_DEFINITIONS, evaluateBadge } from '../data/badges';
import type { Badge } from '../types/badges';

interface AppState {
  // Preferences
  preferences: UserPreferences | null;
  setPreferences: (prefs: UserPreferences) => Promise<void>;
  loadPreferences: () => Promise<void>;

  // Missions
  activeMission: Mission | null;
  setActiveMission: (mission: Mission | null) => void;
  completedMissions: CompletedMission[];
  completeMission: (completed: CompletedMission) => Promise<void>;
  loadCompletedMissions: () => Promise<void>;

  // Journal
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: JournalEntry) => Promise<void>;
  updateJournalEntry: (entry: JournalEntry) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  loadJournalEntries: () => Promise<void>;

  // AI Status
  aiStatus: AIServiceStatus;
  setAIStatus: (status: AIServiceStatus) => void;

  // Online/offline
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  // Adventure mode
  adventureActive: boolean;
  adventureStartTime: Date | null;
  screenRestActive: boolean;
  setAdventureActive: (active: boolean) => void;
  setScreenRestActive: (active: boolean) => void;

  // Badges
  earnedBadges: Badge[];
  newBadge: Badge | null;
  checkBadges: () => void;
  clearNewBadge: () => void;

  // Stats
  getStats: () => {
    totalOutdoorMinutes: number;
    adventuresCompleted: number;
    totalObservations: number;
    categoriesExplored: string[];
    currentStreak: number;
    weeklyMinutes: number[];
    screenRestSessions: number;
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  // Preferences
  preferences: null,
  setPreferences: async (prefs) => {
    const existing = get().preferences;
    if (existing?.id) {
      await db.preferences.update(existing.id, { ...prefs, updatedAt: new Date() });
    } else {
      await db.preferences.add({ ...prefs, createdAt: new Date(), updatedAt: new Date() });
    }
    set({ preferences: prefs });
  },
  loadPreferences: async () => {
    const all = await db.preferences.toArray();
    if (all.length > 0) set({ preferences: all[0] });
  },

  // Missions
  activeMission: null,
  setActiveMission: (mission) => set({ activeMission: mission, adventureStartTime: mission ? new Date() : null }),
  completedMissions: [],
  completeMission: async (completed) => {
    await db.completedMissions.put(completed);
    set((s) => ({
      completedMissions: [...s.completedMissions, completed],
      activeMission: null,
      adventureActive: false,
      adventureStartTime: null,
      screenRestActive: false,
    }));
    get().checkBadges();
  },
  loadCompletedMissions: async () => {
    const missions = await db.completedMissions.orderBy('completedAt').reverse().toArray();
    set({ completedMissions: missions });
  },

  // Journal
  journalEntries: [],
  addJournalEntry: async (entry) => {
    await db.journalEntries.put(entry);
    set((s) => ({ journalEntries: [entry, ...s.journalEntries] }));
    get().checkBadges();
  },
  updateJournalEntry: async (entry) => {
    await db.journalEntries.put({ ...entry, updatedAt: new Date() });
    set((s) => ({
      journalEntries: s.journalEntries.map((e) => (e.id === entry.id ? { ...entry, updatedAt: new Date() } : e)),
    }));
  },
  deleteJournalEntry: async (id) => {
    await db.journalEntries.delete(id);
    set((s) => ({
      journalEntries: s.journalEntries.filter((e) => e.id !== id),
    }));
  },
  loadJournalEntries: async () => {
    const entries = await db.journalEntries.orderBy('dateTime').reverse().toArray();
    set({ journalEntries: entries });
  },

  // AI Status
  aiStatus: { provider: 'initializing', available: false, loading: true, modelName: '', isLocal: true },
  setAIStatus: (status) => set({ aiStatus: status }),

  // Online/offline
  isOnline: navigator.onLine,
  setIsOnline: (online) => set({ isOnline: online }),

  // Adventure mode
  adventureActive: false,
  adventureStartTime: null,
  screenRestActive: false,
  setAdventureActive: (active) => set({ adventureActive: active, adventureStartTime: active ? new Date() : null }),
  setScreenRestActive: (active) => set({ screenRestActive: active }),

  // Badges
  earnedBadges: [],
  newBadge: null,
  checkBadges: () => {
    const state = get();
    const stats = state.getStats();
    const categoryMissions: Record<string, number> = {};
    const categoryObservations: Record<string, number> = {};

    state.completedMissions.forEach((m) => {
      const cat = m.mission.category;
      categoryMissions[cat] = (categoryMissions[cat] || 0) + 1;
    });
    state.journalEntries.forEach((e) => {
      categoryObservations[e.category] = (categoryObservations[e.category] || 0) + 1;
    });

    const evalStats = {
      missionsCompleted: stats.adventuresCompleted,
      categoryMissions,
      observations: stats.totalObservations,
      categoryObservations,
      streakDays: stats.currentStreak,
      outdoorMinutes: stats.totalOutdoorMinutes,
      screenRestSessions: stats.screenRestSessions,
      categoriesExplored: stats.categoriesExplored.length,
    };

    const currentEarned = state.earnedBadges.map((b) => b.id);
    const newlyEarned: Badge[] = [];

    BADGE_DEFINITIONS.forEach((def) => {
      if (!currentEarned.includes(def.id) && evaluateBadge(def, evalStats)) {
        newlyEarned.push({ ...def, earnedAt: new Date() });
      }
    });

    if (newlyEarned.length > 0) {
      set({
        earnedBadges: [...state.earnedBadges, ...newlyEarned],
        newBadge: newlyEarned[0],
      });
    }
  },
  clearNewBadge: () => set({ newBadge: null }),

  // Stats
  getStats: () => {
    const state = get();
    const completed = state.completedMissions;
    const journal = state.journalEntries;

    const totalOutdoorMinutes = completed.reduce((sum, m) => sum + m.durationMinutes, 0);
    const categoriesSet = new Set(completed.map((m) => m.mission.category));
    const screenRestSessions = completed.filter((m) => m.screenRestUsed).length;

    // Calculate streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeDays = new Set(
      completed.map((m) => {
        const d = new Date(m.completedAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    let currentStreak = 0;
    const checkDate = new Date(today);
    while (activeDays.has(checkDate.getTime())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Weekly minutes (last 7 days)
    const weeklyMinutes: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const dayStr = day.toDateString();
      const mins = completed
        .filter((m) => new Date(m.completedAt).toDateString() === dayStr)
        .reduce((sum, m) => sum + m.durationMinutes, 0);
      weeklyMinutes.push(mins);
    }

    return {
      totalOutdoorMinutes,
      adventuresCompleted: completed.length,
      totalObservations: journal.length,
      categoriesExplored: Array.from(categoriesSet),
      currentStreak,
      weeklyMinutes,
      screenRestSessions,
    };
  },
}));
