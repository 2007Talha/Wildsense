import { useNavigate } from 'react-router-dom';
import { Compass, Bird, Flower2, Bug, TreePine, Sun, Clock, Target, BookOpen, Flame, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { AIStatusBadge } from '../components/common/AIStatusBadge';

const CATEGORIES = [
  { id: 'birds', label: 'Birds', emoji: '🐦', icon: Bird, color: 'bg-sky/10 text-sky border-sky/20' },
  { id: 'plants', label: 'Plants', emoji: '🌿', icon: Flower2, color: 'bg-moss/10 text-moss border-moss/20' },
  { id: 'insects', label: 'Insects', emoji: '🦋', icon: Bug, color: 'bg-sunset/10 text-sunset border-sunset/20' },
  { id: 'forests', label: 'Forests', emoji: '🌲', icon: TreePine, color: 'bg-forest/10 text-forest border-forest/20' },
  { id: 'mindfulness', label: 'Mindfulness', emoji: '☀️', icon: Sun, color: 'bg-terracotta/10 text-terracotta border-terracotta/20' },
];

export function ExploreDashboard() {
  const navigate = useNavigate();
  const { preferences, completedMissions, journalEntries, getStats } = useAppStore();
  const stats = getStats();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const recentMissions = completedMissions.slice(0, 3);
  const recentJournal = journalEntries.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section className="animate-slide-up">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-deep-green">{greeting()} 🌿</h1>
            <p className="text-muted mt-1">Ready to explore the world outside?</p>
          </div>
          <div className="hidden md:block">
            <AIStatusBadge />
          </div>
        </div>
      </section>

      {/* Start Adventure CTA */}
      <section className="animate-stagger-1">
        <button
          onClick={() => navigate('/create')}
          className="w-full group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#183D32] to-[#102B24] p-6 md:p-8 text-left shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold !text-[#F7F5EC] mb-2 drop-shadow-sm">
                Start an Adventure
              </h2>
              <p className="text-[#C8D5C2] text-sm md:text-base max-w-md font-medium">
                Get a personalized outdoor mission crafted by AI — explore nature right from where you are.
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#C87956] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform text-white shrink-0">
              <Compass className="w-7 h-7" />
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
        </button>
      </section>

      {/* Stats row */}
      <section className="animate-stagger-2 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Clock, label: 'Minutes Outside', value: `${stats.totalOutdoorMinutes}m`, color: 'text-[#183D32]' },
          { icon: Target, label: 'Adventures', value: stats.adventuresCompleted, color: 'text-[#C87956]' },
          { icon: BookOpen, label: 'Discoveries', value: stats.totalObservations, color: 'text-[#4A6741]' },
          { icon: Flame, label: 'Day Streak', value: `${stats.currentStreak}d`, color: 'text-[#D4956B]' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4.5 border border-[#A8BDA0]/30 shadow-xs hover:shadow-sm transition-all">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="font-serif text-2xl font-bold text-[#102B24]">{stat.value}</p>
            <p className="text-xs text-[#5C4A3A] mt-0.5 font-medium">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="animate-stagger-3">
        <h2 className="font-serif text-xl font-bold text-[#102B24] mb-3">Explore by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/create?category=${cat.id}`)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-[#A8BDA0]/30 bg-white hover:border-[#183D32] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
              <span className="text-xs font-semibold text-[#102B24]">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      {(recentMissions.length > 0 || recentJournal.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6 animate-stagger-4">
          {/* Recent Missions */}
          {recentMissions.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-xl font-bold text-[#102B24]">Recent Adventures</h2>
                <button onClick={() => navigate('/progress')} className="text-xs text-[#C87956] font-semibold flex items-center gap-1 hover:underline">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
                {recentMissions.map((m) => (
                  <div key={m.id} className="bg-white rounded-xl p-4 border border-[#A8BDA0]/30 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-[#102B24] text-sm">{m.mission.title}</p>
                        <p className="text-xs text-[#5C4A3A] mt-0.5">
                          {m.durationMinutes} min · {m.tasksCompleted}/{m.totalTasks} tasks ·{' '}
                          {m.mission.source === 'ai' ? '🧠 AI' : '📋 Curated'}
                        </p>
                      </div>
                      <span className="text-xs text-[#4A6741] bg-[#A8BDA0]/20 px-2 py-0.5 rounded-full font-medium">
                        {new Date(m.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Journal */}
          {recentJournal.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-xl font-bold text-[#102B24]">Recent Discoveries</h2>
                <button onClick={() => navigate('/journal')} className="text-xs text-[#C87956] font-semibold flex items-center gap-1 hover:underline">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
                {recentJournal.map((j) => (
                  <div key={j.id} className="bg-white rounded-xl p-4 border border-[#A8BDA0]/30 shadow-xs">
                    <p className="font-semibold text-[#102B24] text-sm">{j.name}</p>
                    <p className="text-xs text-[#5C4A3A] mt-0.5">
                      {j.category} · {new Date(j.dateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                    {j.notes && <p className="text-xs text-[#5C4A3A] mt-1 line-clamp-2">{j.notes}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Styled Empty State Card */}
      {completedMissions.length === 0 && (
        <section className="bg-white rounded-3xl border border-[#A8BDA0]/30 p-8 text-center shadow-xs animate-stagger-4 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#A8BDA0]/20 text-2xl flex items-center justify-center mx-auto text-[#183D32]">
            🌱
          </div>
          <h3 className="font-serif text-xl font-bold text-[#102B24]">
            Your First Expedition Awaits
          </h3>
          <p className="text-xs text-[#5C4A3A] max-w-md mx-auto leading-relaxed">
            Step outside for even 5 minutes. Select any category above or tap <strong>Start an Adventure</strong> to craft your first sensory nature walk.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/create')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#183D32] text-white hover:bg-[#102B24] active:scale-95 transition-all shadow-md"
            >
              <Compass className="w-3.5 h-3.5" />
              Begin Your First Stroll
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
