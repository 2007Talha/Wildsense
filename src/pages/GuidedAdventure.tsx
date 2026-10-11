import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Pause, Play, Plus, ArrowLeft, Moon, Lightbulb, Shield, X, Printer, Leaf, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import type { CompletedMission } from '../types';
import { PocketSlipModal } from '../components/common/PocketSlipModal';
import { aiRouter } from '../services/ai/ai-router';

export function GuidedAdventure() {
  const navigate = useNavigate();
  const { activeMission, setActiveMission, completeMission, adventureStartTime, setScreenRestActive, screenRestActive } = useAppStore();
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [tasks, setTasks] = useState(activeMission?.tasks.map((t) => ({ ...t })) || []);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionAnswer, setReflectionAnswer] = useState('');
  const [showFinish, setShowFinish] = useState(false);
  const [discoveries, setDiscoveries] = useState<string[]>([]);
  const [newDiscovery, setNewDiscovery] = useState('');
  const [showDiscoveryInput, setShowDiscoveryInput] = useState(false);
  const [showPocketSlip, setShowPocketSlip] = useState(false);
  const [isAskingAiDiscovery, setIsAskingAiDiscovery] = useState(false);

  // Timer
  useEffect(() => {
    if (paused || screenRestActive || !activeMission) return;
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [paused, screenRestActive, activeMission]);

  const toggleTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
  }, []);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const addDiscovery = () => {
    if (newDiscovery.trim()) {
      setDiscoveries([...discoveries, newDiscovery.trim()]);
      setNewDiscovery('');
      setShowDiscoveryInput(false);
    }
  };

  const askAiAboutDiscovery = async () => {
    if (!newDiscovery.trim()) return;
    setIsAskingAiDiscovery(true);
    try {
      const resp = await aiRouter.askNaturalist(newDiscovery.trim());
      const item = `${resp.suggestedName || newDiscovery.trim()} — ${resp.answer.slice(0, 100)}...`;
      setDiscoveries([...discoveries, item]);
      setNewDiscovery('');
      setShowDiscoveryInput(false);
    } catch (err) {
      console.error('Ask AI failed:', err);
      addDiscovery();
    } finally {
      setIsAskingAiDiscovery(false);
    }
  };

  const handleFinish = async () => {
    if (!activeMission || !adventureStartTime) return;

    const now = new Date();
    const durationMinutes = Math.max(1, Math.round(elapsed / 60));

    const completed: CompletedMission = {
      id: crypto.randomUUID(),
      missionId: activeMission.id,
      mission: activeMission,
      startedAt: adventureStartTime,
      completedAt: now,
      durationMinutes,
      userConfirmedDuration: false,
      tasksCompleted: completedCount,
      totalTasks: tasks.length,
      reflectionAnswer: reflectionAnswer || undefined,
      discoveries,
      screenRestUsed: screenRestActive || false,
    };

    await completeMission(completed);
    navigate('/explore');
  };

  const handleExit = () => {
    setActiveMission(null);
    navigate('/explore');
  };

  if (!activeMission) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">No active mission</p>
          <button onClick={() => navigate('/create')} className="px-6 py-3 bg-terracotta text-warm-white rounded-xl font-semibold">
            Create an Adventure
          </button>
        </div>
      </div>
    );
  }

  // Screen rest mode
  if (screenRestActive) {
    return (
      <div className="min-h-screen bg-deep-green flex flex-col items-center justify-center px-6 text-center">
        <div className="animate-float mb-8">
          <Moon className="w-16 h-16 text-sage" />
        </div>
        <h2 className="font-display text-3xl font-bold text-cream mb-4">Your adventure is happening outside</h2>
        <p className="text-sage text-lg max-w-sm mb-8">Lock your phone and come back when you're done exploring.</p>
        <p className="text-sage/60 text-sm mb-2">Time elapsed: {formatTime(elapsed)}</p>
        <button
          onClick={() => setScreenRestActive(false)}
          className="mt-4 px-8 py-4 rounded-2xl border-2 border-sage/30 text-sage font-semibold hover:bg-sage/10 transition-all"
        >
          I'm back!
        </button>
      </div>
    );
  }

  // Finish confirmation
  if (showFinish) {
    return (
      <div className="min-h-screen bg-cream px-4 py-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full animate-scale-in">
          <div className="bg-warm-white rounded-3xl p-6 shadow-elevated border border-sage/10">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">🎉</span>
              <h2 className="font-display text-2xl font-bold text-deep-green">Adventure Complete!</h2>
              <p className="text-muted text-sm mt-1">Great work exploring the outdoors</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Duration</span>
                <span className="font-semibold text-deep-green">{Math.round(elapsed / 60)} minutes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Tasks completed</span>
                <span className="font-semibold text-deep-green">{completedCount}/{tasks.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Discoveries</span>
                <span className="font-semibold text-deep-green">{discoveries.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Mission type</span>
                <span className="font-semibold text-deep-green">{activeMission.source === 'ai' ? '🧠 AI Generated' : '📋 Curated'}</span>
              </div>
            </div>

            {/* Reflection */}
            {activeMission.reflectionQuestion && (
              <div className="mb-6">
                <p className="text-sm font-medium text-deep-green mb-2">💭 {activeMission.reflectionQuestion}</p>
                <textarea
                  value={reflectionAnswer}
                  onChange={(e) => setReflectionAnswer(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full px-4 py-3 rounded-xl border border-sage/20 bg-cream text-sm text-deep-green placeholder:text-sage resize-none focus:border-terracotta focus:outline-none"
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowFinish(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-sage/20 text-muted font-medium hover:bg-cream-dark transition-all"
              >
                Continue
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 px-4 py-3 rounded-xl bg-terracotta text-warm-white font-semibold hover:bg-terracotta-dark transition-all shadow-soft"
              >
                Save & Finish
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EC] flex flex-col items-center">
      {/* Centered responsive container */}
      <div className="w-full max-w-xl flex flex-col flex-1 shadow-xs bg-[#FDFCF8] border-x border-[#A8BDA0]/20 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#FDFCF8]/95 backdrop-blur-lg border-b border-[#A8BDA0]/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={handleExit} className="p-2 text-[#6B756C] hover:text-[#102B24] rounded-xl hover:bg-[#F7F5EC] transition-colors" title="Back to Explore">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-[11px] font-semibold text-[#4A6741] uppercase tracking-wider">
                {activeMission.source === 'ai' ? '🧠 AI Generated Mission' : '📋 Curated Field Mission'}
              </p>
              <p className="font-mono text-xl font-bold text-[#102B24]">{formatTime(elapsed)}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowPocketSlip(true)}
                className="p-2 text-[#183D32] hover:bg-[#F7F5EC] rounded-xl transition-colors"
                title="Print Pocket Field Card"
              >
                <Printer className="w-5 h-5 text-[#4A6741]" />
              </button>
              <button
                onClick={() => setPaused(!paused)}
                className="p-2 text-[#6B756C] hover:text-[#102B24] rounded-xl hover:bg-[#F7F5EC] transition-colors"
                title={paused ? "Resume Timer" : "Pause Timer"}
              >
                {paused ? <Play className="w-5 h-5 text-[#C87956]" /> : <Pause className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2.5 h-2 bg-[#A8BDA0]/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#4A6741] to-[#183D32] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        {/* Mission Title */}
        <div className="px-5 py-4 border-b border-[#A8BDA0]/20 bg-[#F7F5EC]/40">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#C87956] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {activeMission.duration} Minutes • {activeMission.environment}
            </span>
            <button
              onClick={() => setShowPocketSlip(true)}
              className="text-[11px] font-semibold text-[#183D32] hover:underline flex items-center gap-1"
            >
              <Printer className="w-3 h-3" /> Pocket Slip
            </button>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#102B24] leading-snug">{activeMission.title}</h1>
          <p className="text-xs text-[#5C4A3A] mt-1 leading-relaxed">{activeMission.description}</p>
        </div>

      {/* Tasks */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {tasks.map((task, i) => (
          <button
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-300 ${
              task.completed
                ? 'border-moss/30 bg-moss/5'
                : 'border-sage/15 bg-warm-white shadow-soft'
            }`}
          >
            <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              task.completed ? 'bg-moss border-moss text-warm-white' : 'border-sage/30'
            }`}>
              {task.completed && <Check className="w-3.5 h-3.5" />}
            </div>
            <div>
              <span className="text-xs text-muted font-medium mb-1 block">Task {i + 1}</span>
              <p className={`text-base leading-relaxed ${task.completed ? 'text-muted line-through' : 'text-deep-green font-medium'}`}>
                {task.description}
              </p>
            </div>
          </button>
        ))}

        {/* Tips */}
        {activeMission.observationTips.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-sky/5 border border-sky/15">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-sky" />
              <span className="text-xs font-semibold text-sky uppercase tracking-wider">Observation Tips</span>
            </div>
            <ul className="space-y-1">
              {activeMission.observationTips.map((tip, i) => (
                <li key={i} className="text-sm text-muted leading-relaxed">• {tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Safety */}
        {activeMission.safetyReminder && (
          <div className="p-4 rounded-2xl bg-sunset/5 border border-sunset/15">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-sunset" />
              <span className="text-xs font-semibold text-sunset uppercase tracking-wider">Safety</span>
            </div>
            <p className="text-sm text-muted">{activeMission.safetyReminder}</p>
          </div>
        )}

        {/* Discovery input */}
        {showDiscoveryInput ? (
          <div className="p-4 rounded-2xl bg-warm-white border border-sage/15 shadow-soft">
            <label className="text-sm font-semibold text-deep-green block mb-2">Record a Discovery</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDiscovery}
                onChange={(e) => setNewDiscovery(e.target.value)}
                placeholder="What did you find?"
                className="flex-1 px-4 py-2.5 rounded-xl border border-sage/20 bg-cream text-sm text-deep-green placeholder:text-sage focus:border-terracotta focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && addDiscovery()}
                autoFocus
              />
              <button
                type="button"
                onClick={askAiAboutDiscovery}
                disabled={isAskingAiDiscovery}
                className="px-3 py-2 rounded-xl bg-[#183D32] text-white text-xs font-semibold hover:bg-[#102B24] transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
                title="Ask Naturalist AI what this might be"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4956B]" />
                {isAskingAiDiscovery ? 'Asking...' : 'Ask AI'}
              </button>
              <button
                type="button"
                onClick={addDiscovery}
                className="px-3 py-2 rounded-xl bg-white border border-[#A8BDA0]/50 text-[#183D32] text-xs font-semibold hover:bg-[#F7F5EC] transition-colors shrink-0"
              >
                Add
              </button>
              <button onClick={() => setShowDiscoveryInput(false)} className="p-2 text-[#6B756C] hover:text-[#102B24]">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}

        {/* Discoveries list */}
        {discoveries.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Your Discoveries</span>
            {discoveries.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-deep-green py-1">
                <span className="text-terracotta">✦</span>
                {d}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="sticky bottom-0 bg-warm-white/95 backdrop-blur-lg border-t border-sage/20 px-4 py-3 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setShowDiscoveryInput(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-sage/20 text-sm font-medium text-deep-green hover:bg-cream-dark transition-all"
          >
            <Plus className="w-4 h-4" />
            Record Discovery
          </button>
          <button
            onClick={() => setScreenRestActive(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-sage/20 text-sm font-medium text-deep-green hover:bg-cream-dark transition-all"
          >
            <Moon className="w-4 h-4" />
            Screen Rest
          </button>
        </div>
        <button
          onClick={() => setShowFinish(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#C87956] text-white font-semibold text-base shadow-lg hover:bg-[#A5603F] active:scale-[0.97] transition-all"
        >
          <Check className="w-5 h-5" />
          Finish Adventure
        </button>
      </div>
    </div>

      {/* Pocket Field Slip Modal */}
      <PocketSlipModal
        mission={activeMission}
        isOpen={showPocketSlip}
        onClose={() => setShowPocketSlip(false)}
      />
    </div>
  );
}
