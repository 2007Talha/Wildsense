export interface JournalEntry {
  id: string;
  name: string;
  category: JournalCategory;
  notes: string;
  dateTime: Date;
  photoUrl?: string;
  photoBlob?: Blob;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  missionId?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type JournalCategory = 'bird' | 'plant' | 'insect' | 'fungus' | 'mammal' | 'reptile' | 'landscape' | 'weather' | 'other';

export interface JournalFilter {
  category?: JournalCategory;
  searchQuery?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
