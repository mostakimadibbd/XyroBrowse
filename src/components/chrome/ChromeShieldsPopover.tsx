import React from 'react';
import { Shield, Check, Lock, EyeOff, X } from 'lucide-react';
import { ShieldSettings, ShieldStats } from '../../types/browser';

interface ChromeShieldsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  siteUrl: string;
  settings: ShieldSettings;
  stats: ShieldStats;
  onToggleShield: (key: keyof ShieldSettings) => void;
}

export const ChromeShieldsPopover: React.FC<ChromeShieldsPopoverProps> = ({
  isOpen,
  onClose,
  siteUrl,
  settings,
  stats,
  onToggleShield,
}) => {
  if (!isOpen) return null;

  let siteDomain = 'Current Site';
  try {
    if (siteUrl.startsWith('http')) {
      siteDomain = new URL(siteUrl).hostname;
    } else {
      siteDomain = siteUrl.split('/')[0] || siteUrl;
    }
  } catch {
    siteDomain = siteUrl;
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-12 right-12 w-80 bg-[#2b2d31] border border-[#3c4043] rounded-xl shadow-2xl z-50 p-4 text-[#e8eaed] text-xs font-sans">
        {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#3c4043]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#ff6b4a]/20 flex items-center justify-center text-[#ff6b4a]">
            <Shield className="w-4 h-4 fill-current/30" />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight text-[#e8eaed]">Brave Shields</h3>
            <p className="text-[11px] text-[#9aa0a6] truncate max-w-[180px]">{siteDomain}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-[#9aa0a6] hover:text-[#e8eaed]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Switch */}
      <div className="flex items-center justify-between my-3 p-2.5 rounded-lg bg-[#1e1f22]">
        <div>
          <span className="font-medium text-xs block text-[#e8eaed]">Shields are UP</span>
          <span className="text-[10px] text-[#9aa0a6]">Protection active for this site</span>
        </div>
        <button
          type="button"
          onClick={() => onToggleShield('blockTrackers')}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
            settings.blockTrackers ? 'bg-[#ff6b4a]' : 'bg-[#5f6368]'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.blockTrackers ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Feature Toggles */}
      <div className="space-y-2 pt-1">
        <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-white/5">
          <span className="flex items-center gap-2 text-xs text-[#bdc1c6]">
            <Shield className="w-3.5 h-3.5 text-[#ff6b4a]" />
            <span>Block Trackers & Ads</span>
          </span>
          <input
            type="checkbox"
            checked={settings.blockAds}
            onChange={() => onToggleShield('blockAds')}
            className="rounded accent-[#ff6b4a]"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-white/5">
          <span className="flex items-center gap-2 text-xs text-[#bdc1c6]">
            <Lock className="w-3.5 h-3.5 text-[#81c995]" />
            <span>Force HTTPS Connection</span>
          </span>
          <input
            type="checkbox"
            checked={settings.forceHttps}
            onChange={() => onToggleShield('forceHttps')}
            className="rounded accent-[#ff6b4a]"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-white/5">
          <span className="flex items-center gap-2 text-xs text-[#bdc1c6]">
            <EyeOff className="w-3.5 h-3.5 text-[#8ab4f8]" />
            <span>Block Fingerprinting</span>
          </span>
          <input
            type="checkbox"
            checked={settings.blockFingerprinting}
            onChange={() => onToggleShield('blockFingerprinting')}
            className="rounded accent-[#ff6b4a]"
          />
        </label>
      </div>

      {/* Stats Summary */}
      <div className="mt-3 pt-3 border-t border-[#3c4043] flex items-center justify-between text-[11px] text-[#9aa0a6]">
        <span>Total Trackers Blocked</span>
        <span className="font-semibold text-[#e8eaed]">{stats.trackersBlocked.toLocaleString()}</span>
      </div>
    </div>
  </>
);
};
