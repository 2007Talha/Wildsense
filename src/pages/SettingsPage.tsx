import { useState, useEffect } from 'react';
import { 
  Settings, Cpu, HardDrive, RefreshCw, Check, AlertCircle, 
  Trash2, Download, Smartphone, QrCode, Sparkles, Key, 
  Compass, Printer, Shield, Leaf, ExternalLink, WifiOff, Laptop 
} from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { aiRouter } from '../services/ai/ai-router';
import { db } from '../services/storage/db';
import { PhoneSyncModal } from '../components/common/PhoneSyncModal';

export function SettingsPage() {
  const { preferences, setPreferences, aiStatus, setAIStatus } = useAppStore();

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState('/ollama');
  const [ollamaModel, setOllamaModel] = useState('gemma2:2b');
  const [testingOllama, setTestingOllama] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Gemini API Key for mobile/cloud support
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiSaved, setGeminiSaved] = useState(false);

  // User preference local edits
  const [availableTime, setAvailableTime] = useState<number>(preferences?.availableTime || 15);
  const [difficulty, setDifficulty] = useState<string>(preferences?.difficulty || 'beginner');
  const [region, setRegion] = useState<string>(preferences?.region || 'Temperate Woodland');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (preferences) {
      setAvailableTime(preferences.availableTime);
      setDifficulty(preferences.difficulty);
      setRegion(preferences.region);
    }
    const savedGemini = localStorage.getItem('wildsense_gemini_key') || '';
    setGeminiKey(savedGemini);
  }, [preferences]);

  const handleTestOllama = async () => {
    setTestingOllama(true);
    setTestResult(null);

    try {
      const res = await fetch(`${ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) {
        throw new Error(`Status ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const models = data?.models?.map((m: { name: string }) => m.name) || [];

      setTestResult({
        success: true,
        message: `Connected! Found ${models.length} models: ${models.slice(0, 3).join(', ')}${models.length > 3 ? '...' : ''}`,
      });

      await aiRouter.recheckProviders();
      setAIStatus(aiRouter.status);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Could not reach Ollama at ${ollamaUrl}. If you are on your laptop, ensure 'ollama serve' is running. When walking outdoors, WildSense seamlessly uses the Curated Offline Library or Gemini!`,
      });
    } finally {
      setTestingOllama(false);
    }
  };

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('wildsense_gemini_key', geminiKey.trim());
    setGeminiSaved(true);
    setTimeout(() => setGeminiSaved(false), 2500);

    await aiRouter.recheckProviders();
    setAIStatus(aiRouter.status);
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences) return;

    await setPreferences({
      ...preferences,
      availableTime: availableTime as any,
      difficulty: difficulty as any,
      region,
      updatedAt: new Date(),
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportAllData = async () => {
    const prefs = await db.preferences.toArray();
    const missions = await db.completedMissions.toArray();
    const journal = await db.journalEntries.toArray();

    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      preferences: prefs,
      completedMissions: missions,
      journalEntries: journal,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `wildsense-field-journal-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleClearAllData = async () => {
    if (confirm('Are you sure you want to reset all local data? This will clear all completed missions and journal entries.')) {
      await db.completedMissions.clear();
      await db.journalEntries.clear();
      await db.preferences.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="border-b border-[#A8BDA0]/30 pb-5">
        <div className="flex items-center gap-2 text-[#4A6741] text-xs font-semibold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          Hardware & Field Configuration
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#102B24]">
          Settings & Outdoor Workflows
        </h1>
        <p className="text-[#5C4A3A] text-sm mt-1">
          Designed for real walks: how to leave your computer behind, configure local/cloud AI, and manage offline data.
        </p>
      </div>

      {/* CORE WORKFLOW EXPLANATION: Laptop vs Phone */}
      <div className="bg-gradient-to-br from-[#183D32] to-[#102B24] rounded-3xl p-6 md:p-8 text-[#F7F5EC] shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#A8BDA0]/25 !text-[#A8BDA0] border border-[#A8BDA0]/30 mb-2">
                <Laptop className="w-3.5 h-3.5" />
                The Real Walk Protocol
              </span>
              <h2 className="text-2xl font-serif font-bold !text-white drop-shadow-sm">
                How to Explore Without Carrying a Laptop
              </h2>
            </div>

            <button
              onClick={() => setShowPhoneModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#C87956] !text-white hover:bg-[#A5603F] active:scale-95 transition-all shadow-md shrink-0"
            >
              <QrCode className="w-4 h-4" />
              Scan QR for Phone
            </button>
          </div>

          <p className="text-sm !text-[#F7F5EC] leading-relaxed max-w-2xl font-normal">
            You never need to carry a laptop into the outdoors. WildSense is built specifically to support three screen-friendly workflows:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Mode 1: Phone PWA */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4.5 border border-white/20 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#4A6741] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base !text-white">
                1. Phone PWA (100% Offline)
              </h3>
              <p className="text-xs !text-[#F7F5EC] leading-relaxed opacity-90">
                Open WildSense on your phone browser. Tap <strong className="!text-white font-semibold">Add to Home Screen</strong>. All 50+ curated missions and plant/bird identification work completely offline in airplane mode.
              </p>
            </div>

            {/* Mode 2: Pocket Field Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4.5 border border-white/20 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#C87956] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base !text-white">
                2. Pocket Field Slip
              </h3>
              <p className="text-xs !text-[#F7F5EC] leading-relaxed opacity-90">
                Plan your adventure on your laptop before stepping out. Write down or print the 3 simple sensory checkpoints. Leave <strong className="!text-white font-semibold">all screens at home</strong> and reconnect when you return.
              </p>
            </div>

            {/* Mode 3: Cloud or Home LAN */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4.5 border border-white/20 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#7BA7BC] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base !text-white">
                3. On-The-Trail AI
              </h3>
              <p className="text-xs !text-[#F7F5EC] leading-relaxed opacity-90">
                Add a free Google Gemini key below, or connect your phone to your home Ollama IP. You can generate fresh tailored AI missions right on the trail with zero PC required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI ENGINE CONFIGURATION */}
      <div className="bg-white rounded-3xl border border-[#A8BDA0]/30 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#A8BDA0]/20 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Cpu className="w-5 h-5 text-[#183D32]" />
              <h2 className="text-xl font-serif font-bold text-[#102B24]">
                AI Provider Cascade
              </h2>
            </div>
            <p className="text-xs text-[#5C4A3A]">
              Active provider: <span className="font-semibold text-[#183D32]">{aiStatus.provider}</span> ({aiStatus.available ? 'Ready' : 'Fallback active'})
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              aiStatus.available && aiStatus.provider !== 'Curated Fallback'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-stone-100 text-stone-800 border-stone-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${aiStatus.available && aiStatus.provider !== 'Curated Fallback' ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
            {aiStatus.provider}
          </span>
        </div>

        {/* Gemini API Key (Mobile & Cloud AI) */}
        <div className="bg-[#F7F5EC]/60 rounded-2xl p-5 border border-[#A8BDA0]/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C87956]" />
              <h3 className="text-sm font-serif font-bold text-[#102B24]">
                Google Gemini API (Ideal for Mobile Walking)
              </h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium">
              Free Tier Available
            </span>
          </div>

          <p className="text-xs text-[#5C4A3A]">
            Use a free Gemini API key to generate new outdoor missions directly on your phone while out on walks without needing your home PC or Ollama running.
          </p>

          <form onSubmit={handleSaveGeminiKey} className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Paste AI Studio API key (AIzaSy...)"
              className="flex-1 px-3.5 py-2 rounded-xl border border-[#A8BDA0]/40 text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#183D32]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#183D32] text-white hover:bg-[#102B24] transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              {geminiSaved ? 'Saved!' : 'Save Key'}
            </button>
          </form>
          <div className="text-[11px] text-[#6B756C]">
            Keys are stored solely in your device's local browser memory. Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-[#183D32] underline font-semibold">aistudio.google.com</a>.
          </div>
        </div>

        {/* Ollama Configuration (Local PC) */}
        <div className="bg-[#F7F5EC]/60 rounded-2xl p-5 border border-[#A8BDA0]/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-[#183D32]" />
              <h3 className="text-sm font-serif font-bold text-[#102B24]">
                Ollama Local Server (On Your Computer)
              </h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 font-medium">
              100% On-Device
            </span>
          </div>

          <p className="text-xs text-[#5C4A3A]">
            Runs locally on your PC via <code>ollama serve</code>. Useful when preparing missions at home or streaming to your phone across local Wi-Fi.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#183D32] mb-1">
                Endpoint URL
              </label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="/ollama or http://localhost:11434"
                className="w-full px-3 py-2 rounded-xl border border-[#A8BDA0]/40 text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#183D32]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#183D32] mb-1">
                Model Name
              </label>
              <input
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                placeholder="gemma2:2b, llama3.2"
                className="w-full px-3 py-2 rounded-xl border border-[#A8BDA0]/40 text-xs bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#183D32]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestOllama}
              disabled={testingOllama}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#183D32] text-white hover:bg-[#102B24] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingOllama ? 'animate-spin' : ''}`} />
              Test Ollama Connection
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* USER PREFERENCES */}
      <div className="bg-white rounded-3xl border border-[#A8BDA0]/30 p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-serif font-bold text-[#102B24]">
          Default Exploration Preferences
        </h2>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#183D32] mb-1">
                Outdoor Time Budget
              </label>
              <select
                value={availableTime}
                onChange={(e) => setAvailableTime(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#A8BDA0]/40 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#183D32]"
              >
                <option value={5}>5 minutes (Quick sensory break)</option>
                <option value={15}>15 minutes (Local neighborhood stroll)</option>
                <option value={30}>30 minutes (Deep nature walk)</option>
                <option value={60}>60 minutes (True trail expedition)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183D32] mb-1">
                Experience Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#A8BDA0]/40 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#183D32]"
              >
                <option value="beginner">Beginner (Gentle, mindful)</option>
                <option value="intermediate">Intermediate (Active tracking)</option>
                <option value="adventurous">Adventurous (Deep immersion)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183D32] mb-1">
                Home Biome / Region
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Temperate forest, Coastal, City park"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#A8BDA0]/40 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#183D32]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#183D32] text-white hover:bg-[#102B24] transition-all shadow-sm"
            >
              Save Preferences
            </button>
            {saveSuccess && (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Preferences updated!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* DATA & ARCHIVE */}
      <div className="bg-white rounded-3xl border border-[#A8BDA0]/30 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <HardDrive className="w-5 h-5 text-[#183D32]" />
          <h2 className="text-xl font-serif font-bold text-[#102B24]">
            Data Privacy & Local IndexedDB
          </h2>
        </div>
        <p className="text-xs text-[#5C4A3A]">
          All completed expeditions, journal entries, and photos stay entirely inside your device's IndexedDB database.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportAllData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-[#183D32] border border-[#A8BDA0]/50 hover:bg-[#F7F5EC] transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#4A6741]" />
            Download Complete Field Archive (JSON)
          </button>

          <button
            onClick={handleClearAllData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-red-700 border border-red-200 hover:bg-red-50 transition-all shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            Delete All Local Data
          </button>
        </div>
      </div>

      {/* Phone Sync Modal */}
      <PhoneSyncModal isOpen={showPhoneModal} onClose={() => setShowPhoneModal(false)} />
    </div>
  );
}
