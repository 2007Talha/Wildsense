import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowRight, TreePine, Bird, Bug, Sun, Compass } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Hero */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-sage/20 animate-float"><TreePine className="w-20 h-20" /></div>
          <div className="absolute top-40 right-8 text-sage/15 animate-float" style={{ animationDelay: '1s' }}><Bird className="w-16 h-16" /></div>
          <div className="absolute bottom-32 left-16 text-sage/15 animate-float" style={{ animationDelay: '2s' }}><Bug className="w-12 h-12" /></div>
          <div className="absolute bottom-20 right-20 text-sage/20 animate-float" style={{ animationDelay: '0.5s' }}><Sun className="w-14 h-14" /></div>
        </div>

        <div className="relative z-10 text-center max-w-lg mx-auto">
          {/* Logo */}
          <div className="animate-slide-up mb-8">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-forest flex items-center justify-center shadow-elevated mb-6">
              <Leaf className="w-10 h-10 text-cream" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-deep-green mb-3">
              WildSense
            </h1>
            <p className="text-lg text-forest font-medium">AI Nature Companion</p>
          </div>

          {/* Tagline */}
          <div className="animate-stagger-2 mb-12">
            <p className="font-display text-2xl md:text-3xl text-bark leading-snug text-balance">
              Less screen time.<br />
              <span className="text-terracotta">More world discovered.</span>
            </p>
            <p className="text-muted mt-4 max-w-md mx-auto leading-relaxed">
              AI-powered outdoor missions that help you disconnect from screens and reconnect with nature. 
              Discover birds, plants, insects, and the wonders hidden in your surroundings.
            </p>
          </div>

          {/* CTAs */}
          <div className="animate-stagger-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/onboarding')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-terracotta text-warm-white font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-terracotta-dark active:scale-[0.97] transition-all duration-200"
            >
              <Compass className="w-5 h-5" />
              Start Your Adventure
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-forest/20 text-forest font-semibold hover:bg-forest/5 active:scale-[0.97] transition-all duration-200"
            >
              Skip to Explore
            </button>
          </div>
        </div>

        {/* Features preview */}
        <div className="relative z-10 mt-16 w-full max-w-2xl mx-auto animate-stagger-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: '🐦', label: 'Bird Watching' },
              { icon: '🌿', label: 'Plant Discovery' },
              { icon: '🦋', label: 'Insect Safari' },
              { icon: '🧘', label: 'Mindfulness' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-warm-white/80 border border-sage/15 shadow-soft"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-medium text-muted">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted">
        <p>Open-source · Privacy-first · Offline-ready</p>
        <p className="mt-1">Powered by local AI — your data stays on your device</p>
      </footer>
    </div>
  );
}
