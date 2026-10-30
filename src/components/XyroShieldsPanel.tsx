import React from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Clock,
  HardDrive,
  EyeOff,
  Lock,
  FileCode,
  X,
  ExternalLink,
} from 'lucide-react';
import { ShieldSettings, ShieldStats } from '../types/browser';

interface XyroShieldsPanelProps {
  currentUrl: string;
  isOpen: boolean;
  onClose: () => void;
  shieldSettings: ShieldSettings;
  onUpdateShieldSettings: (settings: ShieldSettings) => void;
  shieldStats: ShieldStats;
}

export const XyroShieldsPanel: React.FC<XyroShieldsPanelProps> = ({
  currentUrl,
  isOpen,
  onClose,
  shieldSettings,
  onUpdateShieldSettings,
  shieldStats,
}) => {
  if (!isOpen) return null;

  const isInternal = currentUrl.startsWith('xyro://');
  let hostname = 'Internal Page';
  try {
    if (!isInternal) {
      hostname = new URL(currentUrl).hostname;
    }
  } catch {
    hostname = currentUrl;
  }

  const handleToggle = (key: keyof ShieldSettings) => {
    onUpdateShieldSettings({
      ...shieldSettings,
      [key]: !shieldSettings[key],
    });
  };

  const isAllEnabled =
    shieldSettings.blockAds &&
    shieldSettings.blockTrackers &&
    shieldSettings.forceHttps &&
    shieldSettings.blockFingerprinting;

  return (
    <div className="absolute right-4 top-14 z-50 w-96 rounded-2xl bg-[#0F1522]/95 border border-[#00F0FF]/30 backdrop-blur-2xl shadow-2xl shadow-black/80 p-5 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#00F0FF]" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#00F0FF]">
              XyroShields Native Defense
            </div>
            <div className="text-sm font-bold text-white truncate max-w-56 font-mono">
              {hostname}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close Shields Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Big Status Badge */}
      <div className="my-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-[#00F0FF]/10 to-transparent border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <div>
            <div className="text-xs font-bold text-white">SHIELDS UP: PROTECTED</div>
            <div className="text-[11px] text-emerald-300">
              Aggressive ad-blocking & privacy sandboxing
            </div>
          </div>
        </div>
      </div>

      {/* Live Lifetime Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <EyeOff className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Ads & Trackers</span>
          </div>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {(shieldStats.adsBlocked + shieldStats.trackersBlocked).toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>Bandwidth Saved</span>
          </div>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {shieldStats.bandwidthSavedMb.toFixed(1)} MB
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Time Saved</span>
          </div>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {(shieldStats.timeSavedMs / 1000).toFixed(1)}s
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Connection</span>
          </div>
          <div className="text-sm font-bold font-mono text-amber-300 mt-1">
            TLS 1.3 / Strict
          </div>
        </div>
      </div>

      {/* Per-site Toggles */}
      <div className="space-y-2 border-t border-white/10 pt-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
          Protections for this site
        </div>

        <label className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs">
          <span className="text-slate-200">Block Ads & Trackers</span>
          <input
            type="checkbox"
            checked={shieldSettings.blockAds}
            onChange={() => handleToggle('blockAds')}
            className="w-4 h-4 accent-[#00F0FF] rounded"
          />
        </label>

        <label className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs">
          <span className="text-slate-200">Force HTTPS-Only</span>
          <input
            type="checkbox"
            checked={shieldSettings.forceHttps}
            onChange={() => handleToggle('forceHttps')}
            className="w-4 h-4 accent-[#00F0FF] rounded"
          />
        </label>

        <label className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs">
          <span className="text-slate-200">Block Canvas & Audio Fingerprinting</span>
          <input
            type="checkbox"
            checked={shieldSettings.blockFingerprinting}
            onChange={() => handleToggle('blockFingerprinting')}
            className="w-4 h-4 accent-[#00F0FF] rounded"
          />
        </label>

        <label className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs">
          <span className="text-slate-200">Block 3rd-Party Tracking Cookies</span>
          <input
            type="checkbox"
            checked={shieldSettings.block3rdPartyCookies}
            onChange={() => handleToggle('block3rdPartyCookies')}
            className="w-4 h-4 accent-[#00F0FF] rounded"
          />
        </label>

        <label className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs">
          <span className="text-slate-200">Block All Scripts (Strict Mode)</span>
          <input
            type="checkbox"
            checked={shieldSettings.scriptBlocker}
            onChange={() => handleToggle('scriptBlocker')}
            className="w-4 h-4 accent-[#00F0FF] rounded"
          />
        </label>
      </div>
    </div>
  );
};
