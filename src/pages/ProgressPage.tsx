import { useState } from 'react';
import { 
  Trophy, Flame, Clock, Award, Compass, Eye, Moon, 
  CheckCircle2, Lock, Sparkles, Calendar, ChevronRight 
} from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { BADGE_DEFINITIONS } from '../data/badges';
import type { BadgeCategory } from '../types';

const CATEGORY_TABS: { id: BadgeCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Badges' },
  { id: 'milestone', label: 'Milestones' },
  { id: 'category', label: 'Flora & Fauna' },
  { id: 'streak', label: 'Consistency' },
  { id: 'special', label: 'Field Craft' },
];

export function ProgressPage() {
  const { getStats, earnedBadges, completedMissions } = useAppStore();
  const [activeTab, setActiveTab] = useState<BadgeCategory | 'all'>('all');

  const stats = getStats();
  const earnedIds = new Set(earnedBadges.map((b) => b.id));

  const filteredBadges = BADGE_DEFINITIONS.filter((badge) => {
    if (activeTab === 'all') return true;
    return badge.category === activeTab;
  });

  const earnedCount = BADGE_DEFINITIONS.filter((b) => earnedIds.has(b.id)).length;
  const progressPercent = Math.round((earnedCount / BADGE_DEFINITIONS.length) * 100);

  // Day names for weekly chart
  const dayLabels = ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'];
  const maxMins = Math.max(...stats.weeklyMinutes, 30);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-[#A8BDA0]/30 pb-5">
        <div className="flex items-center gap-2 text-[#4A6741] text-xs font-semibold uppercase tracking-wider mb-1">
          <Trophy className="w-4 h-4" />
          Field Achievements & Outdoor Journal
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#102B24]">
          Exploration Progress
        </h1>
        <p className="text-[#5C4A3A] text-sm mt-1">
          Tracking time spent immersed in the open air, away from glowing screens.
        </p>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outdoor Time */}
        <div className="bg-white rounded-2xl border border-[#A8BDA0]/30 p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#4A6741] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outdoor Immersion</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#102B24]">
            {stats.totalOutdoorMinutes} <span className="text-sm font-sans font-normal text-[#5C4A3A]">mins</span>
          </div>
          <p className="text-[11px] text-[#6B756C] mt-1">
            Honest time spent beyond the screen
          </p>
        </div>

        {/* Current Streak */}
        <div className="bg-white rounded-2xl border border-[#A8BDA0]/30 p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#C87956] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Streak</span>
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#102B24]">
            {stats.currentStreak} <span className="text-sm font-sans font-normal text-[#5C4A3A]">days</span>
          </div>
          <p className="text-[11px] text-[#6B756C] mt-1">
            Consecutive daily outdoor discoveries
          </p>
        </div>

        {/* Completed Adventures */}
        <div className="bg-white rounded-2xl border border-[#A8BDA0]/30 p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#183D32] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Missions Completed</span>
            <Compass className="w-4 h-4" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#102B24]">
            {stats.adventuresCompleted}
          </div>
          <p className="text-[11px] text-[#6B756C] mt-1">
            Across {stats.categoriesExplored.length} distinct ecosystems
          </p>
        </div>

        {/* Total Observations */}
        <div className="bg-white rounded-2xl border border-[#A8BDA0]/30 p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#7BA7BC] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Field Discoveries</span>
            <Eye className="w-4 h-4" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#102B24]">
            {stats.totalObservations}
          </div>
          <p className="text-[11px] text-[#6B756C] mt-1">
            Documented species and nature logs
          </p>
        </div>
      </div>

      {/* Weekly Outdoor Activity Chart */}
      <div className="bg-white rounded-2xl border border-[#A8BDA0]/30 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-serif font-bold text-[#102B24]">
              7-Day Outdoor Immersion
            </h3>
            <p className="text-xs text-[#5C4A3A]">
              Daily minutes disconnected from digital notifications
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F7F5EC] text-[#183D32] border border-[#A8BDA0]/40 flex items-center gap-1.5">
            <Moon className="w-3 h-3 text-[#4A6741]" />
            {stats.screenRestSessions} Screen-Rest Sessions
          </span>
        </div>

        {/* CSS Bar Chart */}
        <div className="pt-4 pb-2 relative">
          {stats.totalOutdoorMinutes === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px] z-10 rounded-xl p-4 text-center pointer-events-none">
              <span className="text-2xl mb-1">🌿</span>
              <p className="text-xs font-semibold text-[#183D32]">No Immersion Logged This Week</p>
              <p className="text-[11px] text-[#5C4A3A] mt-0.5 max-w-xs">
                Complete a 5–15 minute walk in Adventure mode to illuminate your daily chart.
              </p>
            </div>
          )}

          <div className="h-40 flex items-end justify-between gap-2 sm:gap-6 border-b border-[#A8BDA0]/30 px-2 pb-2">
            {stats.weeklyMinutes.map((mins, idx) => {
              const heightPercent = Math.max(Math.round((mins / maxMins) * 100), mins > 0 ? 12 : 6);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[11px] font-sans font-semibold text-[#183D32] opacity-0 group-hover:opacity-100 transition-opacity">
                    {mins}m
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[48px] rounded-t-lg transition-all duration-500 ${
                      mins > 0
                        ? 'bg-[#183D32] group-hover:bg-[#4A6741]'
                        : 'bg-[#F7F5EC] border border-dashed border-[#A8BDA0]/40'
                    }`}
                  />
                  <span className="text-[10px] text-[#6B756C] font-medium truncate max-w-full">
                    {dayLabels[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-serif font-bold text-[#102B24] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D4956B]" />
              Field Badges & Commendations
            </h3>
            <p className="text-xs text-[#5C4A3A]">
              {earnedCount} of {BADGE_DEFINITIONS.length} unlocked ({progressPercent}%)
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#183D32] text-white shadow-sm'
                    : 'bg-white text-[#5C4A3A] border border-[#A8BDA0]/30 hover:bg-[#F7F5EC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overall Badge Progress Bar */}
        <div className="w-full bg-[#F7F5EC] rounded-full h-2.5 overflow-hidden border border-[#A8BDA0]/30">
          <div
            className="bg-gradient-to-r from-[#4A6741] to-[#183D32] h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => {
            const isEarned = earnedIds.has(badge.id);
            const earnedInfo = earnedBadges.find((b) => b.id === badge.id);

            return (
              <div
                key={badge.id}
                className={`rounded-2xl border p-4.5 transition-all flex items-start gap-4 ${
                  isEarned
                    ? 'bg-white border-[#A8BDA0]/60 shadow-sm hover:shadow-md'
                    : 'bg-[#F7F5EC]/60 border-[#A8BDA0]/20 opacity-75'
                }`}
              >
                <div
                  className={`w-13 h-13 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${
                    isEarned
                      ? 'bg-amber-50 border border-amber-200 shadow-amber-100/50'
                      : 'bg-stone-200/60 grayscale text-stone-400'
                  }`}
                >
                  {badge.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-serif font-bold text-[#102B24] truncate">
                      {badge.name}
                    </h4>
                    {isEarned ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[#6B756C]/60 shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-[#5C4A3A] leading-snug line-clamp-2">
                    {badge.description}
                  </p>

                  <div className="mt-2 text-[10px] text-[#6B756C]">
                    {isEarned && earnedInfo?.earnedAt ? (
                      <span className="text-emerald-700 font-medium">
                        Awarded on {new Date(earnedInfo.earnedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span>Requirement: {badge.requirement.count} {badge.requirement.type.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Expeditions Log */}
      {completedMissions.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#A8BDA0]/30 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-serif font-bold text-[#102B24] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#4A6741]" />
            Completed Expedition Log
          </h3>

          <div className="divide-y divide-[#A8BDA0]/20">
            {completedMissions.slice(0, 5).map((comp) => (
              <div key={comp.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#102B24] truncate">
                    {comp.mission.title}
                  </div>
                  <div className="text-xs text-[#6B756C] flex items-center gap-2 mt-0.5">
                    <span>{new Date(comp.completedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{comp.durationMinutes} minutes</span>
                    <span>•</span>
                    <span>{comp.tasksCompleted}/{comp.totalTasks} tasks</span>
                    {comp.screenRestUsed && (
                      <>
                        <span>•</span>
                        <span className="text-[#4A6741] font-medium">Screen-Rest used</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F7F5EC] text-[#183D32] border border-[#A8BDA0]/30 shrink-0 capitalize">
                  {comp.mission.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
