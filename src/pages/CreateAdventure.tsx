import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { aiRouter } from '../services/ai/ai-router';
import type { MissionCategory, MissionEnvironment, MissionMood, MissionGenerationParams } from '../types';

const CATEGORIES: { id: MissionCategory; label: string; emoji: string }[] = [
  { id: 'birds', label: 'Birds', emoji: '🐦' },
  { id: 'plants', label: 'Plants', emoji: '🌿' },
  { id: 'insects', label: 'Insects', emoji: '🦋' },
  { id: 'forests', label: 'Forests', emoji: '🌲' },
  { id: 'mindfulness', label: 'Mindfulness', emoji: '☀️' },
  { id: 'general', label: 'Surprise Me', emoji: '🎲' },
];

const ENVIRONMENTS: { id: MissionEnvironment; label: string; emoji: string }[] = [
  { id: 'garden', label: 'Garden', emoji: '🏡' },
  { id: 'park', label: 'Park', emoji: '🏞️' },
  { id: 'forest', label: 'Forest', emoji: '🌳' },
  { id: 'neighborhood', label: 'Neighborhood', emoji: '🏘️' },
  { id: 'any', label: 'Anywhere', emoji: '🌍' },
];

const MOODS: { id: MissionMood; label: string; emoji: string }[] = [
  { id: 'curious', label: 'Curious', emoji: '🔍' },
  { id: 'calm', label: 'Calm', emoji: '🍃' },
  { id: 'energetic', label: 'Energetic', emoji: '⚡' },
  { id: 'mindful', label: 'Mindful', emoji: '🧘' },
];

const DURATIONS = [5, 15, 30, 60] as const;

export function CreateAdventure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setActiveMission, setAdventureActive, preferences, aiStatus } = useAppStore();

  const [category, setCategory] = useState<MissionCategory>((searchParams.get('category') as MissionCategory) || 'general');
  const [duration, setDuration] = useState(preferences?.availableTime || 15);
  const [difficulty, setDifficulty] = useState(preferences?.difficulty || 'beginner');
  const [environment, setEnvironment] = useState<MissionEnvironment>('any');
  const [mood, setMood] = useState<MissionMood | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: MissionGenerationParams = {
        category,
        duration,
        difficulty,
        environment,
        mood,
        interests: preferences?.interests,
      };

      const mission = await aiRouter.generateMission(params);
      setActiveMission(mission);
      setAdventureActive(true);
      navigate('/adventure');
    } catch (err) {
      console.error('Mission generation failed:', err);
      setError('Failed to generate mission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold text-deep-green">Create Your Adventure</h1>
        <p className="text-muted mt-1">Choose your settings and we'll craft a perfect outdoor mission</p>
      </div>

      {/* Category */}
      <section className="animate-stagger-1">
        <label className="text-sm font-semibold text-deep-green mb-2 block">Category</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                category === c.id
                  ? 'border-terracotta bg-terracotta/5 shadow-soft'
                  : 'border-sage/15 bg-warm-white hover:border-sage/30'
              }`}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-xs font-medium text-deep-green">{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Duration */}
      <section className="animate-stagger-2">
        <label className="text-sm font-semibold text-deep-green mb-2 block">Duration</label>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                duration === d
                  ? 'border-terracotta bg-terracotta/5 shadow-soft'
                  : 'border-sage/15 bg-warm-white hover:border-sage/30'
              }`}
            >
              <span className="text-lg font-semibold text-deep-green">{d}</span>
              <span className="text-xs text-muted block">min</span>
            </button>
          ))}
        </div>
      </section>

      {/* Difficulty */}
      <section className="animate-stagger-2">
        <label className="text-sm font-semibold text-deep-green mb-2 block">Difficulty</label>
        <div className="grid grid-cols-3 gap-2">
          {(['beginner', 'intermediate', 'adventurous'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`p-3 rounded-xl border-2 text-center capitalize transition-all duration-200 ${
                difficulty === d
                  ? 'border-terracotta bg-terracotta/5 shadow-soft'
                  : 'border-sage/15 bg-warm-white hover:border-sage/30'
              }`}
            >
              <span className="text-sm font-medium text-deep-green">{d}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Environment */}
      <section className="animate-stagger-3">
        <label className="text-sm font-semibold text-deep-green mb-2 block">Environment</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {ENVIRONMENTS.map((e) => (
            <button
              key={e.id}
              onClick={() => setEnvironment(e.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                environment === e.id
                  ? 'border-terracotta bg-terracotta/5 shadow-soft'
                  : 'border-sage/15 bg-warm-white hover:border-sage/30'
              }`}
            >
              <span className="text-xl">{e.emoji}</span>
              <span className="text-xs font-medium text-deep-green">{e.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Mood */}
      <section className="animate-stagger-3">
        <label className="text-sm font-semibold text-deep-green mb-2 block">Mood <span className="text-muted font-normal">(optional)</span></label>
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(mood === m.id ? undefined : m.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                mood === m.id
                  ? 'border-terracotta bg-terracotta/5 shadow-soft'
                  : 'border-sage/15 bg-warm-white hover:border-sage/30'
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="text-xs font-medium text-deep-green">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Generate Button */}
      <section className="animate-stagger-4 pt-2">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-terracotta text-warm-white font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-terracotta-dark active:scale-[0.97] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {aiStatus.provider.includes('Curated') ? 'Selecting mission...' : 'AI is crafting your mission...'}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Mission
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
        <p className="text-center text-xs text-muted mt-3">
          {aiStatus.provider.includes('Ollama')
            ? '🧠 Powered by local AI (Gemma via Ollama)'
            : aiStatus.provider.includes('Curated')
            ? '📋 Using curated mission library (AI unavailable)'
            : `Using ${aiStatus.provider}`}
        </p>
      </section>
    </div>
  );
}
