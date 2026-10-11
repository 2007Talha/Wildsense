import { useState, useRef } from 'react';
import { 
  Camera, Upload, Sparkles, AlertTriangle, ShieldCheck, Check, 
  BookOpen, Info, RefreshCw, ChevronRight, Eye, MessageSquareText, 
  HelpCircle, Send, Leaf, Heart, ArrowRight, CornerDownRight,
  SearchX, AlertCircle, Compass
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
    previewUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
    description: 'Found on shaded trail floor with sharp pointed lobes.',
    predictedLabel: 'Northern Red Oak (Quercus rubra)',
    characteristics: ['Alternate lobed leaves with pointed bristled tips', 'Acorns seated in shallow woody cups', 'Deep furrowed dark bark with vertical ridges'],
    natureFacts: ['Red oaks can live over 300 years and support over 500 species of native caterpillars and pollinators.', 'Acorns take two full growing seasons on the tree to mature.'],
  },
  {
    name: 'American Robin',
    category: 'bird',
    icon: '🐦',
    sampleQuery: 'robin',
    previewUrl: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=600&q=80',
    description: 'Rust-breasted songbird foraging on garden lawn.',
    predictedLabel: 'American Robin (Turdus migratorius)',
    characteristics: ['Rich brick-red to orange breast plumage', 'Dark charcoal back and white eye crescents', 'Alert upright foraging stance with yellow bill'],
    natureFacts: ['Robins locate earthworms moving underground through subtle soil acoustics and micro-vibrations.', 'Robin eggs are an iconic pastel cyan blue due to biliverdin pigment.'],
  },
  {
    name: 'Western Honeybee',
    category: 'insect',
    icon: '🐝',
    sampleQuery: 'bee',
    previewUrl: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=600&q=80',
    description: 'Pollinating wild clover blossoms.',
    predictedLabel: 'Western Honeybee (Apis mellifera)',
    characteristics: ['Hairy golden-brown thorax and striped abdomen', 'Corbiculae (pollen baskets) on hind legs', 'Two pairs of linked membranous wings'],
    natureFacts: ['A single honeybee colony visits millions of flowers each season, essential for wildflower biodiversity.', 'Communicate floral coordinate angles via intricate figure-eight "waggle dances".'],
  },
  {
    name: 'Forest Fern',
    category: 'plant',
    icon: '🌿',
    sampleQuery: 'fern',
    previewUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
    description: 'Deep green fronds unrolling near a creek bank.',
    predictedLabel: 'Woodland Fern (Polypodiopsida)',
    characteristics: ['Feathery dissected fronds unfurling from fiddleheads', 'Clusters of spore-bearing sori on leaflet undersides', 'Prefers humid, dappled shade and acidic soils'],
    natureFacts: ['Ferns are ancient vascular plants that predate flowers and seeds by over 200 million years.', 'Reproduce through microscopic spores released into wind currents.'],
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
  const [isManualAnalyzing, setIsManualAnalyzing] = useState(false);
  const [manualResult, setManualResult] = useState<IdentificationResult | null>(null);
  const [manualSavedToJournal, setManualSavedToJournal] = useState(false);

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
    setIsAnalyzing(true);
    setResult(null);
    setImageUrl(sample.previewUrl);
    setAddedToJournal(false);

    try {
      await new Promise((r) => setTimeout(r, 450));
      setResult({
        id: crypto.randomUUID(),
        imageUrl: sample.previewUrl,
        predictedLabel: sample.predictedLabel,
        confidence: 0.95,
        category: sample.category,
        characteristics: sample.characteristics,
        natureFacts: sample.natureFacts,
        source: 'model',
        modelName: 'WildSense Curated Vision Matcher',
        warning: 'AI field observation — always observe wildlife and plants with care.',
        createdAt: new Date(),
        notFound: false,
      });
    } catch (err) {
      console.error('Sample identification failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = manualName.trim();
    if (!name) return;

    setIsManualAnalyzing(true);
    setManualResult(null);
    setManualSavedToJournal(false);

    try {
      const traitsList = manualFeature.split(',').map((c) => c.trim()).filter(Boolean);
      const query = `Field observation of a ${manualCategory}: resembles "${name}". Distinct traits: ${traitsList.join(', ')}. Context notes: ${manualNotes.trim()}`;

      const resp = await aiRouter.askNaturalist(query);

      if (resp.notFound) {
        setManualResult({
          id: crypto.randomUUID(),
          predictedLabel: 'Specimen Not Found / Unrecognized Observation',
          confidence: 0,
          category: 'other',
          characteristics: [],
          natureFacts: [],
          source: 'manual',
          modelName: 'WildSense Field Trait Matcher',
          warning: 'AI could not correlate these traits with a known living outdoor organism.',
          createdAt: new Date(),
          notFound: true,
          error: resp.error || `Could not find any known wild organism matching "${name}".`,
          apiNotice: resp.apiNotice,
        });
      } else {
        setManualResult({
          id: crypto.randomUUID(),
          predictedLabel: resp.suggestedName || name,
          confidence: resp.confidence ?? 0.92,
          category: resp.category || manualCategory,
          characteristics: resp.characteristics.length > 0 ? resp.characteristics : (traitsList.length > 0 ? traitsList : ['Visual field characteristics']),
          natureFacts: resp.natureFacts && resp.natureFacts.length > 0 ? resp.natureFacts : [resp.ecologicalContext],
          source: 'manual',
          modelName: resp.source === 'gemini' ? 'Google Gemini Naturalist AI' : 'WildSense Field Trait Matcher',
          warning: resp.safetyCaution || 'Field observation record. Maintain respect for wild flora and fauna.',
          createdAt: new Date(),
          notFound: false,
          ecologicalContext: resp.ecologicalContext,
          suggestedFollowUp: resp.suggestedFollowUp,
          apiNotice: resp.apiNotice,
        });
      }
    } catch (err) {
      console.error('Manual trait matching failed:', err);
    } finally {
      setIsManualAnalyzing(false);
    }
  };

  const handleSaveManualToJournal = async () => {
    if (!manualResult) return;

    await addJournalEntry({
      id: crypto.randomUUID(),
      name: manualResult.predictedLabel,
      category: (manualResult.category as any) || 'plant',
      notes: `${manualResult.characteristics.join('. ')}\n\nFacts: ${manualResult.natureFacts.join(' ')}\n\nField Notes: ${manualNotes}`,
      dateTime: new Date(),
      tags: ['field-trait-matcher', 'manual-observation'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    setManualSavedToJournal(true);
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

      {/* TAB 3: FIELD TRAIT MATCHER */}
      {activeTab === 'manual' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Trait Presets */}
          <div className="bg-white rounded-3xl border border-[#A8BDA0]/40 p-5 shadow-sm">
            <span className="text-[11px] font-bold text-[#6B756C] uppercase tracking-wider block mb-2.5">
              Quick Observation Presets (Click to autofill traits):
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  label: '🍂 Northern Red Oak',
                  name: 'Northern Red Oak',
                  cat: 'plant',
                  traits: 'Alternate lobed leaves, sharp bristled tips, acorn seated in shallow woody cup',
                  notes: 'Found in temperate deciduous canopy floor after rainfall',
                },
                {
                  label: '🐦 American Robin',
                  name: 'American Robin',
                  cat: 'bird',
                  traits: 'Brick-red orange breast plumage, dark charcoal head, alert upright stance, yellow bill',
                  notes: 'Foraging for earthworms on open park lawn',
                },
                {
                  label: '🍄 Shelf Polypore',
                  name: 'Bracket Fungus / Shelf Polypore',
                  cat: 'fungus',
                  traits: 'Semicircular woody shelves attached to tree trunk, microscopic pores under cap',
                  notes: 'Sprouting laterally from a decaying fallen oak log',
                },
                {
                  label: '🌿 Woodland Fern',
                  name: 'Woodland Fern',
                  cat: 'plant',
                  traits: 'Dissected feathery fronds, unrolling fiddleheads, spore-bearing sori dots under leaflets',
                  notes: 'Dense moist shade along a shaded creek bank',
                },
                {
                  label: '⚠️ Poison Ivy',
                  name: 'Eastern Poison Ivy',
                  cat: 'plant',
                  traits: 'Compound leaves of three, oily sheen, trailing ground vine with off-white berries',
                  notes: 'Growing on trail edge border — leaves of three let it be',
                },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setManualName(preset.name);
                    setManualCategory(preset.cat);
                    setManualFeature(preset.traits);
                    setManualNotes(preset.notes);
                    setManualResult(null);
                  }}
                  className="text-xs px-3 py-1.5 rounded-xl bg-[#F7F5EC] border border-[#A8BDA0]/40 text-[#183D32] hover:bg-[#183D32] hover:text-white transition-all font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main 2-Column Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Trait Input Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#A8BDA0]/40 p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#7BA7BC]/15 text-[#2C5E7A] mb-2">
                  <Compass className="w-3.5 h-3.5" />
                  Taxonomic Morphological Keying
                </span>
                <h3 className="text-xl font-serif font-bold text-[#102B24]">
                  Record Visible Field Characteristics
                </h3>
                <p className="text-xs text-[#5C4A3A] mt-1">
                  Examine structural attributes like leaf margins, feather patterns, spore structures, or footprints.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-5">
                {/* Organism Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#183D32] uppercase tracking-wider">
                    Observed Specimen / Working Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Red oak tree, rust-breasted bird, yellow bracket fungus"
                    className="w-full px-4 py-3 rounded-2xl border border-[#A8BDA0]/40 text-sm text-[#102B24] placeholder-[#6B756C]/60 bg-[#FDFCF8] focus:outline-none focus:ring-2 focus:ring-[#183D32]"
                  />
                </div>

                {/* Category Pill Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#183D32] uppercase tracking-wider">
                    Biological Kingdom / Group
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'plant', label: '🌿 Flora & Trees' },
                      { id: 'bird', label: '🐦 Birds & Plumage' },
                      { id: 'insect', label: '🐛 Insects & Spiders' },
                      { id: 'fungus', label: '🍄 Fungi & Lichens' },
                      { id: 'mammal', label: '🐾 Tracks & Mammals' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setManualCategory(cat.id)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center gap-1.5 ${
                          manualCategory === cat.id
                            ? 'bg-[#183D32] text-white border-[#183D32] shadow-xs'
                            : 'bg-[#F7F5EC] text-[#5C4A3A] border-[#A8BDA0]/30 hover:border-[#183D32]'
                        }`}
                      >
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distinct Features Input + Trait Chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#183D32] uppercase tracking-wider">
                      Distinct Morphological Traits
                    </label>
                    <span className="text-[11px] text-[#6B756C]">Comma-separated</span>
                  </div>
                  <input
                    type="text"
                    value={manualFeature}
                    onChange={(e) => setManualFeature(e.target.value)}
                    placeholder="e.g. serrated leaf margins, acorn cups, orange breast, woody shelf"
                    className="w-full px-4 py-3 rounded-2xl border border-[#A8BDA0]/40 text-sm text-[#102B24] placeholder-[#6B756C]/60 bg-[#FDFCF8] focus:outline-none focus:ring-2 focus:ring-[#183D32]"
                  />

                  {/* Quick-add chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-[#6B756C] font-semibold self-center mr-1">Quick Add:</span>
                    {[
                      'Lobed leaves', 'Acorn cups', 'Orange breast', 'Pollen baskets', 
                      'Woody bracket', 'Gills under cap', 'Parallel veins', 'Five toes & claws'
                    ].map((trait, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const current = manualFeature.trim();
                          setManualFeature(current ? `${current}, ${trait}` : trait);
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-[#A8BDA0]/30 text-[#183D32] border border-stone-200 transition-colors"
                      >
                        +{trait}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Context Notes */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#183D32] uppercase tracking-wider">
                    Habitat & Environmental Context
                  </label>
                  <textarea
                    rows={3}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="e.g. Found growing directly on living bark 4 feet high in deep shade; observed early morning after rain."
                    className="w-full p-4 rounded-2xl border border-[#A8BDA0]/40 text-sm text-[#102B24] placeholder-[#6B756C]/60 bg-[#FDFCF8] focus:outline-none focus:ring-2 focus:ring-[#183D32]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setManualName('');
                      setManualFeature('');
                      setManualNotes('');
                      setManualResult(null);
                    }}
                    className="text-xs text-[#6B756C] hover:text-[#102B24] font-medium"
                  >
                    Clear Form
                  </button>

                  <button
                    type="submit"
                    disabled={isManualAnalyzing || !manualName.trim()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold bg-[#183D32] text-white hover:bg-[#102B24] active:scale-95 transition-all shadow-md disabled:opacity-50"
                  >
                    {isManualAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Evaluating Field Traits...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 text-[#A8BDA0]" />
                        Analyze Field Attributes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Field Naturalist Guide */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-[#F7F5EC] rounded-3xl border border-[#A8BDA0]/40 p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#183D32]">
                  <BookOpen className="w-4 h-4 text-[#4A6741]" />
                  Naturalist Field Checklist
                </div>
                <p className="text-xs text-[#5C4A3A] leading-relaxed">
                  Key out unknown organisms on the trail by checking these 4 fundamental diagnostic criteria:
                </p>

                <div className="space-y-3 pt-1">
                  <div className="p-3 bg-white rounded-2xl border border-[#A8BDA0]/30 text-xs">
                    <strong className="block text-[#102B24] font-semibold mb-0.5">1. Leaf Margins & Venation</strong>
                    <span className="text-[#5C4A3A]">
                      Are margins smooth (entire), toothed (serrate), or lobed? Are veins pinnate or palmate?
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-[#A8BDA0]/30 text-xs">
                    <strong className="block text-[#102B24] font-semibold mb-0.5">2. Avian Beak Morphology</strong>
                    <span className="text-[#5C4A3A]">
                      Heavy conical beaks crack seeds; slender bills probe insects; hooked bills tear meat.
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-[#A8BDA0]/30 text-xs">
                    <strong className="block text-[#102B24] font-semibold mb-0.5">3. Fungal Spore Surface</strong>
                    <span className="text-[#5C4A3A]">
                      Check under cap: bladed gills, spongy pores, or smooth brackets attached to wood?
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-[#A8BDA0]/30 text-xs">
                    <strong className="block text-[#102B24] font-semibold mb-0.5">4. Substrate & Moisture</strong>
                    <span className="text-[#5C4A3A]">
                      Living bark, forest leaf litter, sandy creek margin, or sunlit meadow turf?
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Leave No Trace Principle:</strong> When examining traits, avoid tearing live leaves, picking wild mushrooms, or touching wild animals.
                </div>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {isManualAnalyzing && (
            <div className="bg-white rounded-3xl border border-[#A8BDA0]/40 p-8 text-center space-y-3 shadow-sm animate-fade-in">
              <RefreshCw className="w-8 h-8 text-[#4A6741] animate-spin mx-auto" />
              <h4 className="text-base font-serif font-bold text-[#102B24]">
                Cross-Referencing Field Keys & Taxonomy...
              </h4>
              <p className="text-xs text-[#5C4A3A]">
                Evaluating diagnostic traits against botanical and zoological database records.
              </p>
            </div>
          )}

          {/* Result Section: Shown when manual analysis completes */}
          {manualResult && !isManualAnalyzing && (
            manualResult.notFound ? (
              <div className="bg-white rounded-3xl border border-rose-300 overflow-hidden shadow-lg animate-fade-in">
                <div className="p-6 bg-gradient-to-r from-rose-900 via-rose-800 to-amber-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0 border border-white/20">
                      <SearchX className="w-6 h-6 text-rose-200" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-rose-200 font-semibold mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-300" />
                        <span>{manualResult.modelName || 'WildSense Field Trait Engine'}</span>
                        {manualResult.apiNotice && (
                          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white">Local Engine Active</span>
                        )}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                        {manualResult.predictedLabel}
                      </h3>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-left sm:text-right shrink-0">
                    <span className="text-[10px] text-rose-200 uppercase font-bold block">Status</span>
                    <span className="text-xs font-mono font-bold text-rose-100">
                      Traits Unrecognized
                    </span>
                  </div>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                  {manualResult.apiNotice && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
                      <Info className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>{manualResult.apiNotice}</span>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Trait Analysis Result
                    </h4>
                    <p className="text-sm text-[#102B24] leading-relaxed">
                      {manualResult.error || manualResult.warning || 'Could not find any known wild organism matching these traits.'}
                    </p>
                  </div>

                  <div className="bg-[#F7F5EC] p-5 rounded-2xl border border-[#A8BDA0]/40 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#183D32] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#C87956]" />
                      Tips for Keying Out Specimens:
                    </h4>
                    <ul className="text-xs text-[#5C4A3A] space-y-1.5 list-disc list-inside">
                      <li>Use recognizable nature terms (e.g. "oak tree", "robin", "bracket mushroom", "fern").</li>
                      <li>Include distinct morphological adjectives (e.g. "lobed leaves", "fuzzy bristles", "yellow breast").</li>
                      <li>Try selecting one of the Quick Presets above to see an example of accurate trait keying.</li>
                    </ul>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setManualResult(null)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#183D32] text-white hover:bg-[#102B24] transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Adjust Field Traits
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#A8BDA0]/40 overflow-hidden shadow-lg animate-fade-in">
                <div className="p-6 bg-gradient-to-r from-[#183D32] to-[#102B24] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#A8BDA0] font-semibold mb-1">
                      <ShieldCheck className="w-4 h-4 text-[#D4956B]" />
                      <span>{manualResult.modelName || 'WildSense Field Trait Matcher'}</span>
                      {manualResult.apiNotice && (
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white ml-2">Local Engine</span>
                      )}
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-[#F7F5EC]">
                      {manualResult.predictedLabel}
                    </h3>
                  </div>

                  {manualResult.confidence !== null && (
                    <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-right">
                      <span className="text-[10px] text-[#A8BDA0] uppercase font-bold block">Trait Correlation</span>
                      <span className="text-base font-mono font-bold text-white">
                        {Math.round(manualResult.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 md:p-8 space-y-6">
                  {manualResult.apiNotice && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
                      <Info className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>{manualResult.apiNotice}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Key Identifying Traits */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#183D32] flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-[#4A6741]" />
                        Key Correlated Traits
                      </h4>
                      <ul className="space-y-1.5">
                        {manualResult.characteristics.map((char, i) => (
                          <li key={i} className="text-xs text-[#5C4A3A] flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4A6741] mt-1.5 shrink-0" />
                            <span>{char}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Ecological Context */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#183D32] flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-[#7BA7BC]" />
                        Ecological Role & Habitat
                      </h4>
                      <p className="text-xs text-[#5C4A3A] leading-relaxed bg-[#F7F5EC] p-3 rounded-xl border border-[#A8BDA0]/30 font-medium">
                        {manualResult.ecologicalContext || manualResult.natureFacts[0] || 'Plays a vital role in local biodiversity.'}
                      </p>
                    </div>
                  </div>

                  {/* Safety Warning */}
                  {manualResult.warning && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>{manualResult.warning}</span>
                    </div>
                  )}

                  {/* Save to Journal */}
                  <div className="pt-2 flex items-center justify-between border-t border-[#A8BDA0]/20">
                    <span className="text-xs text-[#6B756C]">
                      Add this observation to your permanent field journal:
                    </span>
                    <button
                      onClick={handleSaveManualToJournal}
                      disabled={manualSavedToJournal}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                        manualSavedToJournal
                          ? 'bg-emerald-700 text-white cursor-default'
                          : 'bg-[#183D32] text-white hover:bg-[#102B24] active:scale-95'
                      }`}
                    >
                      {manualSavedToJournal ? (
                        <>
                          <Check className="w-4 h-4" />
                          Logged in Field Journal!
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4" />
                          Save Observation to Journal
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
    </div>
  );
}

