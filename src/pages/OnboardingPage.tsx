import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Leaf, Check } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import type { UserPreferences } from '../types';

const STEPS = ['activities', 'time', 'difficulty', 'interests', 'region'] as const;

const ACTIVITIES = [
  { id: 'walking', label: 'Walking & Hiking', emoji: '🥾' },
  { id: 'birdwatching', label: 'Bird Watching', emoji: '🐦' },
  { id: 'gardening', label: 'Gardening', emoji: '🌱' },
  { id: 'photography', label: 'Nature Photography', emoji: '📷' },
  { id: 'meditation', label: 'Outdoor Meditation', emoji: '🧘' },
  { id: 'camping', label: 'Camping', emoji: '⛺' },
];

const INTERESTS = [
  { id: 'birds', label: 'Birds', emoji: '🐦' },
  { id: 'plants', label: 'Plants', emoji: '🌿' },
  { id: 'insects', label: 'Insects', emoji: '🦋' },
  { id: 'forests', label: 'Forests', emoji: '🌲' },
  { id: 'gardening', label: 'Gardening', emoji: '🌻' },
  { id: 'mindfulness', label: 'Mindfulness', emoji: '☀️' },
];

const TIME_OPTIONS = [
  { value: 5, label: '5 min', desc: 'Quick break' },
  { value: 15, label: '15 min', desc: 'Short walk' },
  { value: 30, label: '30 min', desc: 'Exploration' },
  { value: 60, label: '60 min', desc: 'Full adventure' },
] as const;

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', desc: 'Simple, close to home', emoji: '🌱' },
  { value: 'intermediate', label: 'Intermediate', desc: 'More detailed observations', emoji: '🌿' },
  { value: 'adventurous', label: 'Adventurous', desc: 'Deep exploration', emoji: '🌳' },
] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const setPreferences = useAppStore((s) => s.setPreferences);
  const [step, setStep] = useState(0);

  const [activities, setActivities] = useState<string[]>([]);
  const [time, setTime] = useState<5 | 15 | 30 | 60>(15);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'adventurous'>('beginner');
  const [interests, setInterests] = useState<string[]>([]);
  const [region, setRegion] = useState('');

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const handleComplete = async () => {
    const prefs: UserPreferences = {
      completedOnboarding: true,
      favoriteActivities: activities,
      availableTime: time,
      difficulty,
      interests,
      region,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await setPreferences(prefs);
    navigate('/explore');
  };

  const handleSkip = async () => {
    const prefs: UserPreferences = {
      completedOnboarding: true,
      favoriteActivities: [],
      availableTime: 15,
      difficulty: 'beginner',
      interests: ['birds', 'plants'],
      region: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await setPreferences(prefs);
    navigate('/explore');
  };

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-forest flex items-center justify-center">
            <Leaf className="w-4 h-4 text-cream" />
          </div>
          <span className="font-display text-lg font-semibold text-deep-green">WildSense</span>
        </div>
        <button onClick={handleSkip} className="text-sm text-muted hover:text-deep-green font-medium">
          Skip
        </button>
      </header>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-4">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? 'w-8 bg-terracotta' : i < step ? 'w-4 bg-forest' : 'w-4 bg-sage/30'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full">
        <div className="flex-1 page-enter" key={step}>
          {currentStep === 'activities' && (
            <div>
              <h2 className="font-display text-3xl font-bold text-deep-green mb-2">What do you enjoy?</h2>
              <p className="text-muted mb-6">Select your favorite outdoor activities</p>
              <div className="grid grid-cols-2 gap-3">
                {ACTIVITIES.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setActivities(toggle(activities, a.id))}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                      activities.includes(a.id)
                        ? 'border-terracotta bg-terracotta/5 shadow-soft'
                        : 'border-sage/20 bg-warm-white hover:border-sage/40'
                    }`}
                  >
                    <span className="text-2xl">{a.emoji}</span>
                    <span className="text-sm font-medium text-deep-green">{a.label}</span>
                    {activities.includes(a.id) && <Check className="w-4 h-4 text-terracotta ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'time' && (
            <div>
              <h2 className="font-display text-3xl font-bold text-deep-green mb-2">How much time?</h2>
              <p className="text-muted mb-6">Choose your typical adventure length</p>
              <div className="space-y-3">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTime(t.value)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-200 ${
                      time === t.value
                        ? 'border-terracotta bg-terracotta/5 shadow-soft'
                        : 'border-sage/20 bg-warm-white hover:border-sage/40'
                    }`}
                  >
                    <div className="text-left">
                      <span className="text-lg font-semibold text-deep-green">{t.label}</span>
                      <span className="text-sm text-muted ml-2">{t.desc}</span>
                    </div>
                    {time === t.value && <Check className="w-5 h-5 text-terracotta" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'difficulty' && (
            <div>
              <h2 className="font-display text-3xl font-bold text-deep-green mb-2">Your comfort level?</h2>
              <p className="text-muted mb-6">We'll tailor missions to match your experience</p>
              <div className="space-y-3">
                {DIFFICULTY_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                      difficulty === d.value
                        ? 'border-terracotta bg-terracotta/5 shadow-soft'
                        : 'border-sage/20 bg-warm-white hover:border-sage/40'
                    }`}
                  >
                    <span className="text-3xl">{d.emoji}</span>
                    <div>
                      <span className="text-lg font-semibold text-deep-green">{d.label}</span>
                      <p className="text-sm text-muted">{d.desc}</p>
                    </div>
                    {difficulty === d.value && <Check className="w-5 h-5 text-terracotta ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'interests' && (
            <div>
              <h2 className="font-display text-3xl font-bold text-deep-green mb-2">What excites you?</h2>
              <p className="text-muted mb-6">Select topics you'd like to explore</p>
              <div className="grid grid-cols-2 gap-3">
                {INTERESTS.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => setInterests(toggle(interests, i.id))}
                    className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 ${
                      interests.includes(i.id)
                        ? 'border-terracotta bg-terracotta/5 shadow-soft'
                        : 'border-sage/20 bg-warm-white hover:border-sage/40'
                    }`}
                  >
                    <span className="text-3xl">{i.emoji}</span>
                    <span className="text-sm font-medium text-deep-green">{i.label}</span>
                    {interests.includes(i.id) && <Check className="w-4 h-4 text-terracotta" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'region' && (
            <div>
              <h2 className="font-display text-3xl font-bold text-deep-green mb-2">Where are you?</h2>
              <p className="text-muted mb-6">Optional — helps personalize nature information</p>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g., Northeast USA, Northern Europe, Southeast Asia..."
                className="w-full px-5 py-4 rounded-2xl border-2 border-sage/20 bg-warm-white text-deep-green placeholder:text-sage focus:border-terracotta focus:outline-none transition-colors text-base"
              />
              <p className="text-xs text-muted mt-3 leading-relaxed">
                This is stored locally on your device and never shared. You can change it later in Settings.
              </p>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between py-6">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
              step === 0 ? 'invisible' : 'text-muted hover:text-deep-green hover:bg-cream-dark'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-forest text-warm-white font-semibold hover:bg-forest-light active:scale-[0.97] transition-all shadow-soft"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-terracotta text-warm-white font-semibold hover:bg-terracotta-dark active:scale-[0.97] transition-all shadow-lg"
            >
              Start Exploring
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
