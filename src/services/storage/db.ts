import Dexie, { type Table } from 'dexie';
import type { UserPreferences, CompletedMission, JournalEntry } from '../../types';

export class WildSenseDB extends Dexie {
  preferences!: Table<UserPreferences, number>;
  completedMissions!: Table<CompletedMission, string>;
  journalEntries!: Table<JournalEntry, string>;

  constructor() {
    super('wildsense-db');
    this.version(1).stores({
      preferences: '++id',
      completedMissions: 'id, missionId, completedAt',
      journalEntries: 'id, category, dateTime, name',
    });
  }
}

export const db = new WildSenseDB();
