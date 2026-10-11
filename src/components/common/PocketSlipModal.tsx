import { Printer, Copy, Check, X, Leaf, Sparkles, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';
import type { Mission } from '../../types';

interface PocketSlipModalProps {
  mission: Mission;
  isOpen: boolean;
  onClose: () => void;
}

export function PocketSlipModal({ mission, isOpen, onClose }: PocketSlipModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `🌿 WildSense Field Mission: ${mission.title}
Duration: ${mission.duration} mins | Environment: ${mission.environment}

TASKS:
${mission.tasks.map((t, i) => `${i + 1}. ${t.description}`).join('\n')}

OBSERVATION CUES:
${mission.observationTips.map((tip) => `• ${tip}`).join('\n')}

REFLECTION QUESTION:
"${mission.reflectionQuestion}"

(Put this in your pocket and touch grass!)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl border border-[#A8BDA0]/40 max-w-lg w-full p-6 shadow-2xl space-y-5 print:border-none print:shadow-none print:p-0">
        <div className="flex items-center justify-between pb-3 border-b border-[#A8BDA0]/30 print:hidden">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-[#183D32]" />
            <h3 className="font-serif font-bold text-lg text-[#102B24]">
              Pocket Field Slip
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B756C] hover:text-[#102B24] hover:bg-[#F7F5EC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The 3x5 Printable Card Body */}
        <div className="border-2 border-dashed border-[#183D32]/40 rounded-2xl p-5 bg-[#FDFCF8] text-[#102B24] space-y-4 print:border-solid print:border-2">
          <div className="flex items-start justify-between border-b border-[#A8BDA0]/30 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#4A6741]">
                WildSense Pocket Guide
              </span>
              <h2 className="text-xl font-serif font-bold text-[#102B24] leading-snug">
                {mission.title}
              </h2>
            </div>
            <div className="text-right text-xs font-mono font-bold text-[#C87956] shrink-0">
              {mission.duration}m
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#5C4A3A]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#4A6741]" />
              {mission.duration} mins
            </span>
            <span className="flex items-center gap-1 capitalize">
              <MapPin className="w-3.5 h-3.5 text-[#4A6741]" />
              {mission.environment}
            </span>
            <span className="capitalize text-[#183D32] font-semibold">
              {mission.category}
            </span>
          </div>

          {/* Tasks */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#183D32] uppercase tracking-wider block">
              Outdoor Checkpoints
            </span>
            <div className="space-y-2">
              {mission.tasks.map((task, i) => (
                <div key={task.id || i} className="flex items-start gap-2.5 text-xs text-[#102B24]">
                  <span className="w-4 h-4 rounded-md border border-[#183D32]/40 inline-flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{task.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {mission.observationTips?.length > 0 && (
            <div className="bg-[#F7F5EC] p-3 rounded-xl border border-[#A8BDA0]/30 text-xs text-[#5C4A3A] space-y-1">
              <span className="font-semibold text-[#183D32] block">Sensory Cue:</span>
              <p className="italic">"{mission.observationTips[0]}"</p>
            </div>
          )}

          {/* Reflection */}
          {mission.reflectionQuestion && (
            <div className="border-t border-[#A8BDA0]/20 pt-3 text-xs text-[#5C4A3A]">
              <span className="font-semibold text-[#183D32] block mb-0.5">Walk Reflection:</span>
              <p className="italic">"{mission.reflectionQuestion}"</p>
            </div>
          )}

          <div className="text-[10px] text-center text-[#6B756C] border-t border-[#A8BDA0]/20 pt-2">
            Fold this slip and put your phone in your pocket. Reconnect with the wild!
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1 print:hidden">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border border-[#A8BDA0]/50 text-[#183D32] hover:bg-[#F7F5EC] transition-colors flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied to Clipboard!' : 'Copy Summary'}
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#183D32] text-white hover:bg-[#102B24] transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Pocket Card
          </button>
        </div>
      </div>
    </div>
  );
}
