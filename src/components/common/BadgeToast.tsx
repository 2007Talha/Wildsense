import { useEffect } from 'react';
import { useAppStore } from '../../store/app-store';
import { X } from 'lucide-react';

export function BadgeToast() {
  const { newBadge, clearNewBadge } = useAppStore();

  useEffect(() => {
    if (newBadge) {
      const timer = setTimeout(clearNewBadge, 5000);
      return () => clearTimeout(timer);
    }
  }, [newBadge, clearNewBadge]);

  if (!newBadge) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] animate-celebrate">
      <div className="bg-warm-white rounded-2xl shadow-elevated border border-sage/20 p-4 pr-10 max-w-xs">
        <button onClick={clearNewBadge} className="absolute top-3 right-3 text-muted hover:text-deep-green">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{newBadge.icon}</span>
          <div>
            <p className="text-xs text-terracotta font-semibold uppercase tracking-wider">Badge Earned!</p>
            <p className="font-display text-base font-semibold text-deep-green">{newBadge.name}</p>
            <p className="text-xs text-muted mt-0.5">{newBadge.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
