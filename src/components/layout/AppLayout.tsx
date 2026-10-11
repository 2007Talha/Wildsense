import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Compass, BookOpen, Camera, Trophy, Settings, Leaf, Plus, Smartphone, QrCode } from 'lucide-react';
import { useAppStore } from '../../store/app-store';
import { AIStatusBadge } from '../common/AIStatusBadge';
import { PhoneSyncModal } from '../common/PhoneSyncModal';

const NAV_ITEMS = [
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/create', icon: Plus, label: 'Adventure', accent: true },
  { to: '/identify', icon: Camera, label: 'Identify' },
  { to: '/progress', icon: Trophy, label: 'Progress' },
];

export function AppLayout() {
  const isOnline = useAppStore((s) => s.isOnline);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F5EC] flex flex-col font-sans">
      {/* Top bar - Desktop */}
      <header className="hidden md:flex items-center justify-between px-6 lg:px-10 py-3.5 bg-[#FDFCF8]/95 backdrop-blur-md border-b border-[#A8BDA0]/30 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-8">
          <NavLink to="/explore" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#183D32] flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
              <Leaf className="w-5 h-5 text-[#F7F5EC]" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-[#102B24] block leading-none">
                WildSense
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#4A6741]">
                Touch Grass Companion
              </span>
            </div>
          </NavLink>

          <nav className="flex items-center gap-1.5 bg-[#F7F5EC]/80 p-1 rounded-2xl border border-[#A8BDA0]/30">
            {NAV_ITEMS.map(({ to, icon: Icon, label, accent }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? accent
                        ? 'bg-[#C87956] text-white shadow-sm'
                        : 'bg-[#183D32] text-white shadow-sm'
                      : 'text-[#5C4A3A] hover:text-[#102B24] hover:bg-white/80'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Phone Sync CTA */}
          <button
            onClick={() => setShowPhoneModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#183D32] bg-white border border-[#A8BDA0]/40 hover:bg-[#F7F5EC] hover:border-[#183D32] transition-all shadow-xs"
            title="How to take this on your walk with your phone"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#4A6741]" />
            <span>Open on Phone</span>
          </button>

          <AIStatusBadge />

          {!isOnline && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-medium">
              Offline
            </span>
          )}

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `p-2 rounded-xl transition-all border ${
                isActive
                  ? 'bg-[#183D32] text-white border-transparent'
                  : 'text-[#6B756C] bg-white border-[#A8BDA0]/30 hover:text-[#102B24] hover:border-[#A8BDA0]'
              }`
            }
            title="Settings & Local AI"
          >
            <Settings className="w-4 h-4" />
          </NavLink>
        </div>
      </header>

      {/* Top bar - Mobile */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#FDFCF8]/95 backdrop-blur-md border-b border-[#A8BDA0]/30 sticky top-0 z-40">
        <NavLink to="/explore" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#183D32] flex items-center justify-center shadow-xs">
            <Leaf className="w-4 h-4 text-[#F7F5EC]" />
          </div>
          <span className="font-serif text-lg font-bold text-[#102B24]">WildSense</span>
        </NavLink>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPhoneModal(true)}
            className="p-1.5 rounded-lg text-[#183D32] bg-white border border-[#A8BDA0]/30"
            title="QR Code & Sync"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <AIStatusBadge compact />

          {!isOnline && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium border border-amber-300">
              Offline
            </span>
          )}

          <NavLink to="/settings" className="p-1.5 text-[#6B756C] hover:text-[#102B24]">
            <Settings className="w-4 h-4" />
          </NavLink>
        </div>
      </header>

      {/* Centered Constrained Main Content */}
      <main className="flex-1 pb-24 md:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="page-enter">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FDFCF8]/95 backdrop-blur-lg border-t border-[#A8BDA0]/30 px-3 pb-[env(safe-area-inset-bottom)] shadow-lg">
        <div className="flex items-center justify-around py-1.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label, accent }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all duration-200 ${
                  accent
                    ? isActive
                      ? 'text-white'
                      : 'text-[#C87956]'
                    : isActive
                    ? 'text-[#183D32]'
                    : 'text-[#6B756C]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1.5 rounded-xl transition-all ${
                      accent
                        ? isActive
                          ? 'bg-[#C87956] text-white shadow-sm scale-105'
                          : 'bg-[#C87956]/15 text-[#C87956]'
                        : isActive
                        ? 'bg-[#183D32]/10 text-[#183D32]'
                        : ''
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Phone Sync Modal */}
      <PhoneSyncModal isOpen={showPhoneModal} onClose={() => setShowPhoneModal(false)} />
    </div>
  );
}
