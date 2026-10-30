import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Trash2,
  Lock,
  Globe,
  Sliders,
  Check,
  Moon,
  Laptop,
  Smartphone,
  Tablet,
  CheckCircle2,
} from 'lucide-react';
import { SearchEngine, ShieldSettings, XyroBoostSettings } from '../../types/browser';
import { SEARCH_ENGINES } from '../../utils/browserLogic';

interface SettingsPageProps {
  currentEngine: SearchEngine;
  onSelectEngine: (engine: SearchEngine) => void;
  shieldSettings: ShieldSettings;
  onUpdateShieldSettings: (settings: ShieldSettings) => void;
  boostSettings: XyroBoostSettings;
  onUpdateBoostSettings: (settings: XyroBoostSettings) => void;
  onClearData: (types: { history: boolean; cache: boolean; downloads: boolean }) => void;
  deviceMode: 'desktop' | 'tablet' | 'mobile';
  onSetDeviceMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentEngine,
  onSelectEngine,
  shieldSettings,
  onUpdateShieldSettings,
  boostSettings,
  onUpdateBoostSettings,
  onClearData,
  deviceMode,
  onSetDeviceMode,
}) => {
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearHistory, setClearHistory] = useState(true);
  const [clearCache, setClearCache] = useState(true);
  const [clearDownloads, setClearDownloads] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  const handleToggleShield = (key: keyof ShieldSettings) => {
    onUpdateShieldSettings({
      ...shieldSettings,
      [key]: !shieldSettings[key],
    });
  };

  const handleExecuteClear = () => {
    onClearData({
      history: clearHistory,
      cache: clearCache,
      downloads: clearDownloads,
    });
    setClearSuccess(true);
    setTimeout(() => {
      setClearSuccess(false);
      setShowClearModal(false);
    }, 1200);
  };

  return (
    <div className="min-h-full w-full bg-[#0A0D14] text-slate-100 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <Sliders className="w-7 h-7 text-[#00F0FF]" />
            XyroBrowse Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure search engines, XyroShields privacy rules, XyroBoost memory scheduler, and UI preferences.
          </p>
        </div>

        {/* Search Engine Section */}
        <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Globe className="w-5 h-5 text-[#00F0FF]" />
            Default Search Engine
          </div>
          <p className="text-xs text-slate-400">
            Choose which search engine processes queries from the Omnibox when not using a Bang shortcut (!g, !ddg, !b).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {SEARCH_ENGINES.map((engine) => {
              const isSelected = currentEngine.id === engine.id;
              return (
                <div
                  key={engine.id}
                  onClick={() => onSelectEngine(engine)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF] shadow-sm shadow-[#00F0FF]/20'
                      : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-white">{engine.name}</span>
                    <span className="text-xs font-mono text-slate-400 mt-0.5">Bang: {engine.bang}</span>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-[#00F0FF]" />}
                </div>
              );
            })}
          </div>
        </section>

        {/* XyroShields Privacy HUD Section */}
        <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Shield className="w-5 h-5 text-[#00F0FF]" />
              XyroShields Global Protection
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">
              Active Protection
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Built-in native ad-blocker, tracker eviscerator, and canvas fingerprint defender.
          </p>

          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-white">Block Ads & Cross-Site Trackers</div>
                <div className="text-xs text-slate-400">Removes banner ads, telemetry scripts, and tracking beacons</div>
              </div>
              <input
                type="checkbox"
                checked={shieldSettings.blockAds}
                onChange={() => handleToggleShield('blockAds')}
                className="w-5 h-5 accent-[#00F0FF] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-white">Force HTTPS-Only Mode</div>
                <div className="text-xs text-slate-400">Upgrades all unencrypted HTTP traffic to TLS HTTPS</div>
              </div>
              <input
                type="checkbox"
                checked={shieldSettings.forceHttps}
                onChange={() => handleToggleShield('forceHttps')}
                className="w-5 h-5 accent-[#00F0FF] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-white">Block Canvas & WebGL Fingerprinting</div>
                <div className="text-xs text-slate-400">Injects subtle noise into canvas rendering to prevent unique device profiling</div>
              </div>
              <input
                type="checkbox"
                checked={shieldSettings.blockFingerprinting}
                onChange={() => handleToggleShield('blockFingerprinting')}
                className="w-5 h-5 accent-[#00F0FF] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-white">Block 3rd-Party Tracking Cookies</div>
                <div className="text-xs text-slate-400">Strictly isolates cookie jars to current top-level domain</div>
              </div>
              <input
                type="checkbox"
                checked={shieldSettings.block3rdPartyCookies}
                onChange={() => handleToggleShield('block3rdPartyCookies')}
                className="w-5 h-5 accent-[#00F0FF] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-white">Block Invasive Third-Party Scripts</div>
                <div className="text-xs text-slate-400">Prevents execution of external unknown JavaScript libraries</div>
              </div>
              <input
                type="checkbox"
                checked={shieldSettings.scriptBlocker}
                onChange={() => handleToggleShield('scriptBlocker')}
                className="w-5 h-5 accent-[#00F0FF] rounded cursor-pointer"
              />
            </label>
          </div>
        </section>

        {/* XyroBoost RAM & Resource Manager */}
        <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-5">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Zap className="w-5 h-5 text-amber-400" />
            XyroBoost RAM & Hibernation Engine
          </div>
          <p className="text-xs text-slate-400">
            Intelligently puts inactive background tabs to sleep to free up CPU and system memory.
          </p>

          <div className="space-y-4 pt-1">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
              <div>
                <div className="text-sm font-semibold text-white">Enable Auto-Hibernation</div>
                <div className="text-xs text-slate-400">Automatically hibernate tabs idle beyond the configured timeout</div>
              </div>
              <input
                type="checkbox"
                checked={boostSettings.autoHibernateEnabled}
                onChange={(e) =>
                  onUpdateBoostSettings({ ...boostSettings, autoHibernateEnabled: e.target.checked })
                }
                className="w-5 h-5 accent-[#00F0FF] rounded cursor-pointer"
              />
            </label>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-white">Hibernation Delay</span>
                <span className="font-mono text-[#00F0FF] font-bold">
                  {boostSettings.hibernateTimeoutMinutes} minutes
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={boostSettings.hibernateTimeoutMinutes}
                onChange={(e) =>
                  onUpdateBoostSettings({
                    ...boostSettings,
                    hibernateTimeoutMinutes: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-[#00F0FF] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 min (Ultra Lean)</span>
                <span>5 mins</span>
                <span>15 mins</span>
                <span>30 mins</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-white">Max Concurrently Active Renderers</span>
                <span className="font-mono text-[#00F0FF] font-bold">
                  {boostSettings.maxActiveTabs} tabs
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="1"
                value={boostSettings.maxActiveTabs}
                onChange={(e) =>
                  onUpdateBoostSettings({
                    ...boostSettings,
                    maxActiveTabs: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-[#00F0FF] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>2 tabs (Save Battery)</span>
                <span>5 tabs (Recommended)</span>
                <span>12 tabs (Heavy Multitask)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Viewport Simulation & Device Mode */}
        <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Smartphone className="w-5 h-5 text-purple-400" />
            Device Mode & APK Viewport Emulation
          </div>
          <p className="text-xs text-slate-400">
            Preview XyroBrowse in Desktop, Tablet, or Mobile APK format (bottom thumb toolbar + 3D card switcher).
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSetDeviceMode('desktop')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
                deviceMode === 'desktop'
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF]'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Laptop className="w-6 h-6" />
              <span>Desktop Shell</span>
            </button>

            <button
              type="button"
              onClick={() => onSetDeviceMode('tablet')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
                deviceMode === 'tablet'
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF]'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-6 h-6" />
              <span>Tablet Shell</span>
            </button>

            <button
              type="button"
              onClick={() => onSetDeviceMode('mobile')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all ${
                deviceMode === 'mobile'
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF]'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-6 h-6" />
              <span>Mobile APK Shell</span>
            </button>
          </div>
        </section>

        {/* Clear Data Section */}
        <section className="bg-red-500/[0.04] border border-red-500/20 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Trash2 className="w-5 h-5 text-red-400" />
              Clear Browsing Data & Cache
            </div>
            <button
              type="button"
              onClick={() => setShowClearModal(true)}
              className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs font-bold transition-colors"
            >
              Clear Data...
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Purge stored URLs, cached page states, cookies, and local database entries safely.
          </p>
        </section>
      </div>

      {/* Clear Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0F1520] border border-white/10 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Clear Browsing Data
            </h3>

            {clearSuccess ? (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                <div className="text-sm font-bold text-white">Data Cleared Successfully!</div>
              </div>
            ) : (
              <>
                <div className="space-y-3 py-2">
                  <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearHistory}
                      onChange={(e) => setClearHistory(e.target.checked)}
                      className="w-4 h-4 accent-[#00F0FF]"
                    />
                    <span>Browsing History & Log</span>
                  </label>

                  <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearCache}
                      onChange={(e) => setClearCache(e.target.checked)}
                      className="w-4 h-4 accent-[#00F0FF]"
                    />
                    <span>Cached Web Images & Storage (84.2 MB)</span>
                  </label>

                  <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearDownloads}
                      onChange={(e) => setClearDownloads(e.target.checked)}
                      className="w-4 h-4 accent-[#00F0FF]"
                    />
                    <span>Download Manager History</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowClearModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteClear}
                    className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-red-500/20"
                  >
                    Confirm Clear
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
