import { useState, useRef } from 'react';
import { 
  Camera, Upload, Sparkles, AlertTriangle, ShieldCheck, Check, 
  BookOpen, Info, RefreshCw, ChevronRight, Eye, MessageSquareText, 
  HelpCircle, Send, Leaf, Heart, ArrowRight, CornerDownRight,
  SearchX, AlertCircle
} from 'lucide-react';
import { visionService } from '../services/vision/vision-service';
import { aiRouter } from '../services/ai/ai-router';
import { useAppStore } from '../store/app-store';
import type { IdentificationResult, NaturalistResponse } from '../types';

// Curated sample specimens for instant testing without camera
const SAMPLE_SPECIMENS = [
  {
    name: 'Red Oak Leaf',
    category: 'plant',
    icon: '🍂',
    sampleQuery: 'oak',
    previewUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    description: 'Found on shaded trail floor with sharp pointed lobes.',
  },
  {
    name: 'American Robin',
    category: 'bird',
    icon: '🐦',
    sampleQuery: 'robin',
    previewUrl: 'https://images.unsplash.com/photo-1544943910-4c1dc44a0b38?auto=format&fit=crop&w=400&q=80',
    description: 'Rust-breasted songbird foraging on garden lawn.',
  },
  {
    name: 'Western Honeybee',
    category: 'insect',
    icon: '🐝',
    sampleQuery: 'bee',
    previewUrl: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=400&q=80',
    description: 'Pollinating wild clover blossoms.',
  },
  {
    name: 'Forest Fern',
    category: 'plant',
    icon: '🌿',
    sampleQuery: 'fern',
    previewUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=400&q=80',
    description: 'Deep green fronds unrolling near a creek bank.',
  },
];

const NATURALIST_SUGGESTIONS = [
  "I found a bright blue feather with black bars on a trail",
  "Cluster of yellow shelf mushrooms growing on a rotting tree",
  "A fuzzy black caterpillar with a rust-orange band around its middle",
  "A wild plant with three shiny leaves and small white berries",
  "Fresh tracks in creek mud with five toes and tiny claw marks",
  "A small bird hopping backwards down a tree trunk head-first",
];

export function IdentificationLab() {
  const { addJournalEntry } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const askPhotoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'ask' | 'photo' | 'manual'>('ask');

  // Photo mode state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const [addedToJournal, setAddedToJournal] = useState(false);

  // Manual observation mode state
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState('plant');
  const [manualNotes, setManualNotes] = useState('');
  const [manualFeature, setManualFeature] = useState('');

  // Ask Naturalist AI state
  const [askQuery, setAskQuery] = useState('');
  const [askPhotoUrl, setAskPhotoUrl] = useState<string | null>(null);
  const [askPhotoBase64, setAskPhotoBase64] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [naturalistAnswer, setNaturalistAnswer] = useState<NaturalistResponse | null>(null);
  const [askSavedToJournal, setAskSavedToJournal] = useState(false);

  // Handlers for Photo Mode
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageFile(file);
      setImageUrl(url);
      setAddedToJournal(false);
      await runIdentification(file, url);
    }
  };

  const handleSelectSample = async (sample: typeof SAMPLE_SPECIMENS[0]) => {
    const fakeBlob = new Blob(['sample-nature-specimen'], { type: 'image/jpeg' });
    const fakeFile = new File([fakeBlob], `${sample.sampleQuery}.jpg`, { type: 'image/jpeg' });
    setImageFile(fakeFile);
    setImageUrl(sample.previewUrl);
    setAddedToJournal(false);
    await runIdentification(fakeFile, sample.previewUrl);
  };

  const runIdentification = async (file: File, url: string) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      await new Promise((r) => setTimeout(r, 600));
      const idResult = await visionService.identifyFromImage(file, url);
      setResult(idResult);
    } catch (err) {
      console.error('Identification failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const characteristics = manualFeature.split(',').map((c) => c.trim()).filter(Boolean);
    const manualResult = visionService.createManualIdentification({
      name: manualName.trim(),
      category: manualCategory,
      characteristics,
      notes: manualNotes.trim(),
    });

    setResult(manualResult);
    setImageUrl(null);
    setAddedToJournal(false);
  };

  // Handlers for Ask Naturalist Mode
  const handleAskPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAskPhotoUrl(url);

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAskPhotoBase64(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAskNaturalist = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = (customQuery || askQuery).trim();
    if (!queryToUse) return;

    setIsAsking(true);
    setNaturalistAnswer(null);
    setAskSavedToJournal(false);

    try {
      const resp = await aiRouter.askNaturalist(queryToUse, askPhotoBase64 || undefined);
      setNaturalistAnswer(resp);
    } catch (err) {
      console.error('Ask Naturalist failed:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const handleSaveAskToJournal = async () => {
    if (!naturalistAnswer) return;

    await addJournalEntry({
      id: crypto.randomUUID(),
      name: naturalistAnswer.suggestedName || askQuery.slice(0, 50),
      category: (naturalistAnswer.category as any) || 'other',
      notes: `${naturalistAnswer.answer}\n\nTraits: ${naturalistAnswer.characteristics.join(', ')}\n\nEcology: ${naturalistAnswer.ecologicalContext}`,
      dateTime: new Date(),
      photoUrl: askPhotoUrl || undefined,
      tags: ['ask-ai', naturalistAnswer.source],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    setAskSavedToJournal(true);
  };

  const handleSaveResultToJournal = async () => {
    if (!result) return;

    await addJournalEntry({
      id: crypto.randomUUID(),
      name: result.predictedLabel,
      category: (result.category as any) || 'plant',
      notes: `${result.characteristics.join('. ')}\n\nFacts: ${result.natureFacts.join(' ')}`,
      dateTime: new Date(),
      photoUrl: result.imageUrl,
      tags: ['identification-lab', result.source === 'model' ? 'ai-assisted' : 'manual'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    setAddedToJournal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-[#A8BDA0]/30 pb-5">
        <div className="flex items-center gap-2 text-[#4A6741] text-xs font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          Field Botany, Wildlife & Naturalist Companion
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#102B24]">
          Nature Identification & Discovery Lab
        </h1>
        <p className="text-[#5C4A3A] text-sm mt-1">
          Found something new or curious outdoors? Ask the AI field naturalist, test camera specimens, or examine botanical traits.
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold block mb-0.5">Field Safety Protocol</strong>
          All identification insights are educational suggestions. Never ingest, harvest, or handle wild mushrooms, plants, or unfamiliar fauna based on AI recommendations.
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-[#A8BDA0]/30 gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('ask')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ask'
              ? 'border-[#183D32] text-[#183D32] bg-[#FDFCF8] rounded-t-xl'
              : 'border-transparent text-[#6B756C] hover:text-[#102B24]'
          }`}
        >
          <MessageSquareText className="w-4 h-4 text-[#C87956]" />
          <span>Ask Naturalist AI ("Found Something New?")</span>
        </button>

        <button
          onClick={() => setActiveTab('photo')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'photo'
              ? 'border-[#183D32] text-[#183D32] bg-[#FDFCF8] rounded-t-xl'
              : 'border-transparent text-[#6B756C] hover:text-[#102B24]'
          }`}
        >
          <Camera className="w-4 h-4 text-[#4A6741]" />
          <span>Photo Classification</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'manual'
              ? 'border-[#183D32] text-[#183D32] bg-[#FDFCF8] rounded-t-xl'
              : 'border-transparent text-[#6B756C] hover:text-[#102B24]'
          }`}
        >
          <Eye className="w-4 h-4 text-[#7BA7BC]" />
          <span>Field Trait Matcher</span>
        </button>
      </div>

      {/* TAB 1: ASK NATURALIST AI */}
      {activeTab === 'ask' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#A8BDA0]/40 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#4A6741]/15 text-[#4A6741] mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask About Any Discovery
                </span>
                <h2 className="text-xl font-serif font-bold text-[#102B24]">
                  Describe What You Discovered Outdoors
                </h2>
                <p className="text-xs text-[#5C4A3A] mt-1">
                  Saw a strange mushroom ring? Found an unusual feather, bird call, or track? Describe what you saw in plain words or attach a photo.
                </p>
              </div>
            </div>

            <form onSubmit={handleAskNaturalist} className="space-y-4">
              <div className="space-y-2">
                <textarea
                  rows={3}
                  required
                  value={askQuery}
                  onChange={(e) => setAskQuery(e.target.value)}
                  placeholder="e.g. I found a blue feather with black bars under a pine tree... or A large yellow bracket mushroom growing on an oak log after rainfall..."
                  className="w-full p-4 rounded-2xl border border-[#A8BDA0]/50 text-sm text-[#102B24] placeholder-[#6B756C]/60 focus:outline-none focus:ring-2 focus:ring-[#183D32] bg-[#FDFCF8]"
                />
              </div>

              {/* Optional Photo Attachment */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <input
                    ref={askPhotoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAskPhotoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => askPhotoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#A8BDA0]/50 text-[#183D32] bg-[#F7F5EC] hover:bg-[#A8BDA0]/20 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#4A6741]" />
                    {askPhotoUrl ? 'Change Photo' : 'Attach Photo (Optional)'}
                  </button>

                  {askPhotoUrl && (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#A8BDA0]/40">
                      <img src={askPhotoUrl} alt="Discovery" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setAskPhotoUrl(null);
                          setAskPhotoBase64(null);
                        }}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-xs opacity-0 hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isAsking || !askQuery.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#183D32] text-white hover:bg-[#102B24] active:scale-95 transition-all shadow-md disabled:opacity-50"
                >
                  {isAsking ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Consulting Naturalist AI...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Ask Field Naturalist
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Inspiration Chips */}
            <div className="pt-2 border-t border-[#A8BDA0]/20">
              <span className="text-[11px] font-semibold text-[#6B756C] uppercase tracking-wider block mb-2">
                Or Try One of These Common Discoveries:
              </span>
              <div className="flex flex-wrap gap-2">
                {NATURALIST_SUGGESTIONS.map((sugg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAskQuery(sugg);
                      handleAskNaturalist(undefined, sugg);
                    }}
                    className="text-xs text-left px-3 py-1.5 rounded-xl bg-[#F7F5EC] border border-[#A8BDA0]/30 text-[#183D32] hover:bg-white hover:border-[#183D32] transition-all flex items-center gap-1.5"
                  >
                    <CornerDownRight className="w-3 h-3 text-[#C87956] shrink-0" />
                    <span>{sugg}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {isAsking && (
            <div className="bg-white rounded-3xl border border-[#A8BDA0]/40 p-8 text-center space-y-3 shadow-sm">
              <RefreshCw className="w-8 h-8 text-[#4A6741] animate-spin mx-auto" />
              <h4 className="text-base font-serif font-bold text-[#102B24]">
                Evaluating Morphology & Biodiversity Databases...
              </h4>
              <p className="text-xs text-[#5C4A3A]">
                Cross-referencing botanical keys, bird plumage patterns, and local ecological niches.
              </p>
            </div>
          )}

          {/* Naturalist Response Card */}
          {naturalistAnswer && !isAsking && (
            naturalistAnswer.notFound ? (
              <div className="bg-white rounded-3xl border border-rose-300 overflow-hidden shadow-lg animate-fade-in">
                <div className="p-6 bg-gradient-to-r from-rose-900 via-rose-800 to-amber-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
                      <SearchX className="w-6 h-6 text-rose-200" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-rose-200 font-semibold mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-300" />
                        <span>{naturalistAnswer.source === 'gemini' ? 'Google Gemini AI' : 'WildSense Naturalist Engine'}</span>
                        {naturalistAnswer.apiNotice && (
                          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white">Local Engine Active</span>
                        )}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                        {naturalistAnswer.suggestedName || 'Specimen Not Found'}
                      </h3>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-left sm:text-right shrink-0">
                    <span className="text-[10px] text-rose-200 uppercase font-bold block">Status</span>
                    <span className="text-xs font-mono font-bold text-rose-100">
                      {naturalistAnswer.confidenceText || 'Unrecognized / Not Found'}
                    </span>
                  </div>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                  {naturalistAnswer.apiNotice && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
                      <Info className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>{naturalistAnswer.apiNotice}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Observation Assessment
                    </h4>
                    <p className="text-sm text-[#102B24] leading-relaxed bg-rose-50/70 p-4 rounded-2xl border border-rose-200 font-medium">
                      {naturalistAnswer.answer}
                    </p>
                  </div>

                  <div className="bg-[#F7F5EC] p-5 rounded-2xl border border-[#A8BDA0]/40 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#183D32] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#C87956]" />
                      Tips for Identifying Nature Specimens:
                    </h4>
                    <ul className="text-xs text-[#5C4A3A] space-y-1.5 list-disc list-inside">
                      <li>Describe observable physical traits: colors, leaf shapes, petal count, or feather patterns.</li>
                      <li>Mention where you found it: forest floor, creek bank, rotting oak log, or garden lawn.</li>
                      <li>Ensure your query refers to real wild flora, fauna, fungi, tracks, or natural phenomena.</li>
                      <li>Attach a photo using the button above if you took one on the trail!</li>
                    </ul>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setNaturalistAnswer(null);
                        setAskQuery('');
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#183D32] text-white hover:bg-[#102B24] transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Try Another Observation
                    </button>
                  </div>
                </div>
              </div>
            ) : (
            <div className="bg-white rounded-3xl border border-[#A8BDA0]/40 overflow-hidden shadow-lg animate-fade-in">
              <div className="p-6 bg-gradient-to-r from-[#183D32] to-[#102B24] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#A8BDA0] font-semibold mb-1">
                    <Sparkles className="w-4 h-4 text-[#D4956B]" />
                    {naturalistAnswer.source === 'gemini' ? 'Google Gemini 2.0 Flash Naturalist' : 'WildSense Offline Field Guide'}
                    {naturalistAnswer.apiNotice && (
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white ml-2">Local Engine</span>
                    )}
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#F7F5EC]">
                    {naturalistAnswer.suggestedName}
                  </h3>
                </div>

                <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-right">
                  <span className="text-[10px] text-[#A8BDA0] uppercase font-bold block">Assessment</span>
                  <span className="text-xs font-mono font-semibold text-white">
                    {naturalistAnswer.confidenceText || 'Field Observation'}
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                {naturalistAnswer.apiNotice && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{naturalistAnswer.apiNotice}</span>
                  </div>
                )}

                {/* Naturalist Narrative */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#183D32]">
                    Naturalist Assessment
                  </h4>
                  <p className="text-sm text-[#102B24] leading-relaxed bg-[#F7F5EC]/60 p-4 rounded-2xl border border-[#A8BDA0]/30 font-medium">
                    {naturalistAnswer.answer}
                  </p>
                </div>

                {/* Characteristics and Ecological Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#183D32] flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-[#4A6741]" />
                      Traits To Verify Outdoors
                    </h4>
                    <ul className="space-y-1.5">
                      {naturalistAnswer.characteristics.map((char, i) => (
                        <li key={i} className="text-xs text-[#5C4A3A] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4A6741] mt-1.5 shrink-0" />
                          <span>{char}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#183D32] flex items-center gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-[#7BA7BC]" />
                      Ecological Context
                    </h4>
                    <p className="text-xs text-[#5C4A3A] leading-relaxed bg-[#F7F5EC] p-3 rounded-xl border border-[#A8BDA0]/30">
                      {naturalistAnswer.ecologicalContext}
                    </p>
                  </div>
                </div>

                {/* Safety Caution */}
                {naturalistAnswer.safetyCaution && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>{naturalistAnswer.safetyCaution}</span>
                  </div>
                )}

                {/* Follow up sensory cue */}
                {naturalistAnswer.suggestedFollowUp && (
                  <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block mb-0.5">Sensory Checkpoint:</strong>
                      <span>{naturalistAnswer.suggestedFollowUp}</span>
                    </div>
                  </div>
                )}

                {/* Action button to save into journal */}
                <div className="pt-2 flex items-center justify-between border-t border-[#A8BDA0]/20">
                  <span className="text-xs text-[#6B756C]">
                    Add this to your permanent nature journal:
                  </span>
                  <button
                    onClick={handleSaveAskToJournal}
                    disabled={askSavedToJournal}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                      askSavedToJournal
                        ? 'bg-emerald-700 text-white cursor-default'
                        : 'bg-[#183D32] text-white hover:bg-[#102B24] active:scale-95'
                    }`}
                  >
                    {askSavedToJournal ? (
                      <>
                        <Check className="w-4 h-4" />
                        Added to Field Journal!
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4" />
                        Log Discovery in Field Journal
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            )
          )}
        </div>
      )}

      {/* TAB 2: PHOTO CLASSIFICATION */}
      {activeTab === 'photo' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 border-dashed border-[#A8BDA0]/60 p-8 text-center hover:border-[#183D32] transition-colors shadow-sm">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#A8BDA0]/20 text-[#183D32] flex items-center justify-center mx-auto shadow-inner">
                <Camera className="w-8 h-8 text-[#4A6741]" />
              </div>

              <div>
                <h3 className="text-base font-semibold text-[#102B24]">
                  Upload Nature Specimen Photo
                </h3>
                <p className="text-xs text-[#5C4A3A] mt-1">
                  Works 100% offline. No photos are sent to external servers.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#183D32] text-[#F7F5EC] hover:bg-[#102B24] transition-all shadow-md active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  Select File or Photo
                </button>
              </div>
            </div>
          </div>

          {/* Sample Specimens Carousel */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B756C] mb-3">
              Or Try A Sample Specimen
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SAMPLE_SPECIMENS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(sample)}
                  className="bg-white rounded-2xl border border-[#A8BDA0]/30 p-3 text-left hover:border-[#183D32] hover:shadow-md transition-all group"
                >
                  <div className="h-24 rounded-xl bg-stone-100 overflow-hidden mb-2.5">
                    <img
                      src={sample.previewUrl}
                      alt={sample.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-xs text-[#102B24]">
                    <span>{sample.icon}</span>
                    <span className="truncate">{sample.name}</span>
                  </div>
                  <div className="text-[11px] text-[#6B756C] truncate mt-0.5">
                    {sample.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Photo Result Card */}
          {result && !isAnalyzing && (
            result.notFound ? (
              <div className="bg-white rounded-3xl border border-rose-300 overflow-hidden shadow-lg animate-fade-in">
                <div className="p-6 bg-gradient-to-r from-rose-900 via-rose-800 to-amber-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
                      <SearchX className="w-6 h-6 text-rose-200" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-rose-200 font-semibold mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-300" />
                        <span>{result.source === 'gemini' ? 'Google Gemini Vision AI' : 'WildSense Vision Engine'}</span>
                        {result.apiNotice && (
                          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white">Local Engine Active</span>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                        {result.predictedLabel}
                      </h2>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-left sm:text-right shrink-0">
                    <span className="text-[10px] text-rose-200 uppercase font-bold block">Status</span>
                    <span className="text-xs font-mono font-bold text-rose-100">
                      Not Found / Unrecognized
                    </span>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {imageUrl && (
                    <div className="md:col-span-1">
                      <div className="rounded-2xl overflow-hidden border border-rose-200 h-56 bg-stone-100 shadow-inner">
                        <img src={imageUrl} alt="Uploaded Specimen" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}

                  <div className={imageUrl ? 'md:col-span-2 space-y-5' : 'md:col-span-3 space-y-5'}>
                    {result.apiNotice && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
                        <Info className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>{result.apiNotice}</span>
                      </div>
                    )}

                    <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        Identification Error
                      </h4>
                      <p className="text-xs text-[#102B24] leading-relaxed">
                        {result.error || result.warning || 'No outdoor plant, animal, bird, insect, or fungus could be identified in this image.'}
                      </p>
                    </div>

                    <div className="bg-[#F7F5EC] p-4 rounded-xl border border-[#A8BDA0]/30 space-y-2">
                      <h5 className="text-xs font-bold text-[#183D32]">Photo Guidance:</h5>
                      <ul className="text-xs text-[#5C4A3A] space-y-1 list-disc list-inside">
                        <li>Capture the specimen in natural outdoor daylight without heavy glare or shadow.</li>
                        <li>Take a close-up photo showing clear leaf margins, petals, bark texture, or plumage.</li>
                        <li>Avoid uploading indoor household objects, vehicles, screens, or blurry images.</li>
                        <li>You can also switch to the <strong>Ask Naturalist</strong> tab to describe what you saw using words!</li>
                      </ul>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setResult(null);
                          setImageUrl(null);
                          setImageFile(null);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#183D32] text-white hover:bg-[#102B24] transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Select Another Photo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="bg-white rounded-3xl border border-[#A8BDA0]/40 overflow-hidden shadow-lg">
              <div className="p-6 border-b border-[#A8BDA0]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F7F5EC]/40">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#4A6741] mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    {result.source === 'gemini' ? 'Google Gemini Vision AI' : 'Offline Botanical Vision Match'}
                    {result.apiNotice && (
                      <span className="text-[10px] bg-[#183D32]/10 text-[#183D32] font-semibold px-2 py-0.5 rounded-full ml-1.5">Local Engine</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-[#102B24]">
                    {result.predictedLabel}
                  </h2>
                </div>

                {result.confidence !== null && (
                  <div className="bg-white px-3.5 py-2 rounded-xl border border-[#A8BDA0]/30 shadow-xs">
                    <div className="text-[11px] uppercase tracking-wider text-[#6B756C] font-semibold">
                      Confidence
                    </div>
                    <div className="text-lg font-mono font-bold text-[#183D32]">
                      {Math.round(result.confidence * 100)}%
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {imageUrl && (
                  <div className="md:col-span-1">
                    <div className="rounded-2xl overflow-hidden border border-[#A8BDA0]/40 h-56 bg-stone-100 shadow-inner">
                      <img src={imageUrl} alt={result.predictedLabel} className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                <div className={imageUrl ? 'md:col-span-2 space-y-5' : 'md:col-span-3 space-y-5'}>
                  {result.apiNotice && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>{result.apiNotice}</span>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#183D32] mb-2 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-[#4A6741]" />
                      Key Identifying Traits
                    </h4>
                    <ul className="space-y-1.5">
                      {result.characteristics.map((char, idx) => (
                        <li key={idx} className="text-xs text-[#5C4A3A] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4A6741] mt-1.5 shrink-0" />
                          <span>{char}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#183D32] mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4956B]" />
                      Natural History
                    </h4>
                    <div className="space-y-2">
                      {result.natureFacts.map((fact, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#F7F5EC] border border-[#A8BDA0]/30 text-xs text-[#5C4A3A]">
                          {fact}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSaveResultToJournal}
                      disabled={addedToJournal}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
                        addedToJournal
                          ? 'bg-emerald-700 text-white'
                          : 'bg-[#183D32] text-white hover:bg-[#102B24]'
                      }`}
                    >
                      {addedToJournal ? <Check className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                      {addedToJournal ? 'Saved in Journal!' : 'Save Observation to Journal'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )
          )}
        </div>
      )}

      {/* TAB 3: MANUAL FIELD TRAIT MATCHER */}
      {activeTab === 'manual' && (
        <div className="bg-white rounded-3xl border border-[#A8BDA0]/40 p-6 md:p-8 shadow-sm max-w-xl">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#183D32] mb-1">
                What does it resemble?
              </label>
              <input
                type="text"
                required
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="e.g. Oak tree, blue-winged warbler, yellow bracket fungus"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#A8BDA0]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#183D32]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183D32] mb-1">
                Domain / Category
              </label>
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#A8BDA0]/40 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#183D32]"
              >
                <option value="plant">🌿 Plant / Flora / Tree</option>
                <option value="bird">🐦 Bird / Avian</option>
                <option value="insect">🐛 Insect / Invertebrate</option>
                <option value="fungus">🍄 Fungi / Lichen</option>
                <option value="mammal">🐾 Mammal / Animal Tracks</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183D32] mb-1">
                Distinct Features (comma separated)
              </label>
              <input
                type="text"
                value={manualFeature}
                onChange={(e) => setManualFeature(e.target.value)}
                placeholder="e.g. serrated leaf edges, yellow crest, bark with diamond fissures"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#A8BDA0]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#183D32]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183D32] mb-1">
                Field Context & Notes
              </label>
              <textarea
                rows={3}
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="What time of day? Was it under direct sun? How did it behave?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#A8BDA0]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#183D32]"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#183D32] text-[#F7F5EC] hover:bg-[#102B24] transition-all shadow-md"
            >
              Analyze Field Attributes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
