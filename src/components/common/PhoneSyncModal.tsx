import { useState } from 'react';
import { Smartphone, QrCode, X, Check, Copy, ExternalLink, Leaf, Shield, WifiOff } from 'lucide-react';

interface PhoneSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PhoneSyncModal({ isOpen, onClose }: PhoneSyncModalProps) {
  const [copied, setCopied] = useState(false);
  const currentHost = window.location.hostname;
  const currentPort = window.location.port ? `:${window.location.port}` : '';
  const mobileUrl = window.location.protocol + '//' + currentHost + currentPort;

  // Simple QR code generator using quickchart.io or inline SVG QR
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mobileUrl)}&color=18-61-50&bgcolor=247-245-236`;

  const handleCopy = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FDFCF8] rounded-3xl border border-[#A8BDA0]/40 max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#A8BDA0]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#183D32] flex items-center justify-center text-white">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#102B24]">
                Take WildSense on Your Walk
              </h3>
              <p className="text-[11px] text-[#5C4A3A]">
                Never carry your laptop into the woods!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6B756C] hover:text-[#102B24] hover:bg-[#F7F5EC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="bg-[#F7F5EC] rounded-2xl p-4 border border-[#A8BDA0]/30 text-center space-y-3">
          <div className="w-44 h-44 mx-auto bg-white rounded-xl p-2 border border-[#A8BDA0]/40 shadow-sm flex items-center justify-center overflow-hidden">
            <img
              src={qrCodeUrl}
              alt="Scan to open on phone"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#183D32] block">
              Scan with your phone's camera
            </span>
            <p className="text-[11px] text-[#6B756C]">
              Make sure your phone is connected to the same Wi-Fi network.
            </p>
          </div>

          {/* Copy URL */}
          <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 border border-[#A8BDA0]/30">
            <input
              type="text"
              readOnly
              value={mobileUrl}
              className="text-xs text-[#102B24] bg-transparent px-2 flex-1 font-mono outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#183D32] text-white hover:bg-[#102B24] transition-colors flex items-center gap-1 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* 3 Mobile Reality Highlights */}
        <div className="space-y-2.5 text-xs text-[#5C4A3A]">
          <div className="flex items-start gap-2.5">
            <WifiOff className="w-4 h-4 text-[#4A6741] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#102B24] block">100% Offline On The Trail</strong>
              <span>All 50+ curated missions, plant & bird classifier, and journal work without internet or laptop connection.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-[#C87956] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#102B24] block">Install as Mobile App (PWA)</strong>
              <span>On Safari tap "Share → Add to Home Screen". On Chrome tap "Add to Home Screen".</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Leaf className="w-4 h-4 text-[#7BA7BC] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#102B24] block">True Screen-Free Walking</strong>
              <span>Put your phone in your pocket with Screen-Rest mode active, or print a 3x5 Pocket Field Slip before leaving.</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#183D32] text-white hover:bg-[#102B24] transition-all shadow-md"
          >
            Got It — Ready to Walk Outside
          </button>
        </div>
      </div>
    </div>
  );
}
