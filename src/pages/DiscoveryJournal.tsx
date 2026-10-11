import { useState, useId } from 'react';
import { 
  BookOpen, Plus, Search, Filter, Trash2, Edit2, Calendar, MapPin, 
  Tag, Download, Sparkles, X, Check, Image as ImageIcon 
} from 'lucide-react';
import { useAppStore } from '../store/app-store';
import type { JournalEntry, JournalCategory } from '../types';

const CATEGORIES: { id: JournalCategory; label: string; icon: string; color: string }[] = [
  { id: 'plant', label: 'Plants & Trees', icon: '🌿', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'bird', label: 'Birds', icon: '🐦', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  { id: 'insect', label: 'Insects & Bugs', icon: '🐛', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'fungus', label: 'Fungi & Lichen', icon: '🍄', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'mammal', label: 'Mammals & Tracks', icon: '🐾', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'landscape', label: 'Landscape & Sky', icon: '🌄', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'other', label: 'Other Wonders', icon: '✨', color: 'bg-stone-100 text-stone-800 border-stone-300' },
];

export function DiscoveryJournal() {
  const { journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useAppStore();
  const searchInputId = useId();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<JournalCategory>('plant');
  const [formNotes, setFormNotes] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');

  const filteredEntries = journalEntries.filter((entry) => {
    const matchesSearch = 
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.locationName && entry.locationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openNewModal = () => {
    setEditingEntry(null);
    setFormName('');
    setFormCategory('plant');
    setFormNotes('');
    setFormLocation('');
    setFormTags('');
    setFormPhotoUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormName(entry.name);
    setFormCategory(entry.category);
    setFormNotes(entry.notes);
    setFormLocation(entry.locationName || '');
    setFormTags(entry.tags ? entry.tags.join(', ') : '');
    setFormPhotoUrl(entry.photoUrl || '');
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormPhotoUrl(url);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingEntry) {
      await updateJournalEntry({
        ...editingEntry,
        name: formName.trim(),
        category: formCategory,
        notes: formNotes.trim(),
        locationName: formLocation.trim() || undefined,
        tags: tagsArray,
        photoUrl: formPhotoUrl || undefined,
        updatedAt: new Date(),
      });
    } else {
      const newEntry: JournalEntry = {
        id: crypto.randomUUID(),
        name: formName.trim(),
        category: formCategory,
        notes: formNotes.trim(),
        dateTime: new Date(),
        locationName: formLocation.trim() || undefined,
        tags: tagsArray,
        photoUrl: formPhotoUrl || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await addJournalEntry(newEntry);
    }

    setIsModalOpen(false);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(journalEntries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `wildsense-journal-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#A8BDA0]/30 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[#4A6741] text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            Field Observations & Discoveries
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#102B24]">
            Nature Journal
          </h1>
          <p className="text-[#5C4A3A] text-sm mt-1">
            Every plant, bird, insect, or sound you record deepens your connection to the Earth.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {journalEntries.length > 0 && (
            <button
              onClick={handleExportJSON}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white text-[#183D32] border border-[#A8BDA0]/40 hover:bg-[#F7F5EC] transition-colors shadow-sm"
              title="Export Field Journal"
            >
              <Download className="w-3.5 h-3.5 text-[#4A6741]" />
              Export
            </button>
          )}

          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#183D32] text-[#F7F5EC] hover:bg-[#102B24] active:scale-95 transition-all shadow-md shadow-[#183D32]/20"
          >
            <Plus className="w-4 h-4" />
            Record Observation
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <label htmlFor={searchInputId} className="sr-only">Search notes, species, tags</label>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B756C]" />
          <input
            id={searchInputId}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, species, tags, locations..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-[#A8BDA0]/40 text-sm text-[#102B24] placeholder-[#6B756C]/60 focus:outline-none focus:ring-2 focus:ring-[#183D32] focus:border-transparent transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B756C] hover:text-[#102B24]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#183D32] text-white shadow-sm'
                : 'bg-white text-[#5C4A3A] border border-[#A8BDA0]/30 hover:bg-[#F7F5EC]'
            }`}
          >
            All ({journalEntries.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = journalEntries.filter((e) => e.category === cat.id).length;
            if (count === 0 && selectedCategory !== cat.id) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#183D32] text-white shadow-sm'
                    : 'bg-white text-[#5C4A3A] border border-[#A8BDA0]/30 hover:bg-[#F7F5EC]'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Entries List or Empty State */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#A8BDA0]/30 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#A8BDA0]/20 text-[#183D32] flex items-center justify-center mx-auto mb-4 text-2xl">
            🌿
          </div>
          <h3 className="text-xl font-serif font-semibold text-[#102B24] mb-2">
            {journalEntries.length === 0 ? 'Your Nature Journal is Quiet' : 'No matching discoveries found'}
          </h3>
          <p className="text-sm text-[#5C4A3A] max-w-md mx-auto mb-6">
            {journalEntries.length === 0
              ? 'When you spot an unusual leaf, hear an evening bird, or discover curious moss, record it here to build your personal nature chronicle.'
              : 'Try clearing your search query or choosing another category filter.'}
          </p>
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#183D32] text-[#F7F5EC] hover:bg-[#102B24] transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Record Your First Observation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => {
            const catInfo = CATEGORIES.find((c) => c.id === entry.category) || CATEGORIES[0];
            const dateStr = new Date(entry.dateTime).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const timeStr = new Date(entry.dateTime).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-[#A8BDA0]/30 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                {/* Photo Preview if available */}
                {entry.photoUrl ? (
                  <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                    <img
                      src={entry.photoUrl}
                      alt={entry.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md bg-white/90 ${catInfo.color}`}>
                        <span>{catInfo.icon}</span>
                        <span>{catInfo.label}</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 pb-0 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${catInfo.color}`}>
                      <span>{catInfo.icon}</span>
                      <span>{catInfo.label}</span>
                    </span>
                    <span className="text-[11px] text-[#6B756C] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col">
                  {entry.photoUrl && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-[#6B756C] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {dateStr} at {timeStr}
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-serif font-bold text-[#102B24] mb-2 leading-snug">
                    {entry.name}
                  </h3>

                  <p className="text-sm text-[#5C4A3A] line-clamp-3 mb-4 flex-1">
                    {entry.notes || 'No extra notes recorded.'}
                  </p>

                  {/* Location & Tags */}
                  <div className="space-y-2 mb-4">
                    {entry.locationName && (
                      <div className="flex items-center gap-1.5 text-xs text-[#6B756C]">
                        <MapPin className="w-3.5 h-3.5 text-[#4A6741]" />
                        <span className="truncate">{entry.locationName}</span>
                      </div>
                    )}

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] bg-[#F7F5EC] text-[#5C4A3A] border border-[#A8BDA0]/30"
                          >
                            <Tag className="w-2.5 h-2.5 opacity-60" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#A8BDA0]/20 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(entry)}
                      className="p-1.5 rounded-lg text-[#6B756C] hover:text-[#183D32] hover:bg-[#F7F5EC] transition-colors"
                      title="Edit Entry"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete observation "${entry.name}"?`)) {
                          deleteJournalEntry(entry.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-[#6B756C] hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Observation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#A8BDA0]/40 max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#A8BDA0]/20 mb-5">
              <h2 className="text-xl font-serif font-bold text-[#102B24]">
                {editingEntry ? 'Edit Observation' : 'New Nature Observation'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B756C] hover:text-[#102B24] hover:bg-[#F7F5EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Species / Name */}
              <div>
                <label className="block text-xs font-semibold text-[#183D32] mb-1">
                  Observation Title or Species Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Red-tailed Hawk, Silver Birch bark, Curious Beetle"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#A8BDA0]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#183D32]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-[#183D32] mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as JournalCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#A8BDA0]/40 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#183D32]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo Input */}
              <div>
                <label className="block text-xs font-semibold text-[#183D32] mb-1">
                  Field Photo (optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer border-2 border-dashed border-[#A8BDA0]/50 hover:border-[#183D32] rounded-xl p-3 text-center transition-colors bg-[#F7F5EC]/50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#183D32]">
                      <ImageIcon className="w-4 h-4 text-[#4A6741]" />
                      <span>{formPhotoUrl ? 'Change Photo' : 'Upload Nature Photo'}</span>
                    </div>
                  </label>
                  {formPhotoUrl && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#A8BDA0]/50 shrink-0">
                      <img src={formPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormPhotoUrl('')}
                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#183D32] mb-1">
                  Field Notes & Sensations
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Where did you see it? How did it sound, smell, or feel? What behavior did it exhibit?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#A8BDA0]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#183D32]"
                />
              </div>

              {/* Location & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#183D32] mb-1">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Oak Ridge Trail, Backyard garden"
                    className="w-full px-3 py-2 rounded-xl border border-[#A8BDA0]/40 text-xs focus:outline-none focus:ring-2 focus:ring-[#183D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#183D32] mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="e.g. spring, canopy, sound, moss"
                    className="w-full px-3 py-2 rounded-xl border border-[#A8BDA0]/40 text-xs focus:outline-none focus:ring-2 focus:ring-[#183D32]"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[#A8BDA0]/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#5C4A3A] hover:bg-[#F7F5EC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#183D32] text-[#F7F5EC] hover:bg-[#102B24] transition-all shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {editingEntry ? 'Save Changes' : 'Record Discovery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
