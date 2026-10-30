import React, { useState } from 'react';
import {
  Zap,
  Moon,
  Trash2,
  Cpu,
  Layers,
  X,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import { Tab, XyroBoostSettings } from '../types/browser';

interface XyroBoostPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: Tab[];
  activeTabId: string;
  boostSettings: XyroBoostSettings;
  onUpdateBoostSettings: (settings: XyroBoostSettings) => void;
  onHibernateAllBackground: () => void;
  onToggleTabHibernate: (tabId: string) => void;
  onPurgeMemory: () => void;
  totalRamMb: number;
}

export const XyroBoostPanel: React.FC<XyroBoostPanelProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  boostSettings,
  onUpdateBoostSettings,
  onHibernateAllBackground,
  onToggleTabHibernate,
  onPurgeMemory,
  totalRamMb,
}) => {
  const [purgedFeedback, setPurgedFeedback] = useState(false);

  if (!isOpen) return null;

  const activeTabs = tabs.filter((t) => !t.isHibernated);
  const hibernatedTabs = tabs.filter((t) => t.isHibernated);
  const memoryPercentage = Math.min(100, Math.round((totalRamMb / boostSettings.ramLimitMb) * 100));

  const handlePurge = () => {
    onPurgeMemory();
    setPurgedFeedback(true);
    setTimeout(() => setPurgedFeedback(false), 2000);
  };

  return (
    <div className="absolute right-4 top-14 z-50 w-96 rounded-2xl bg-[#0F1522]/95 border border-amber-500/30 backdrop-blur-2xl shadow-2xl shadow-black/80 p-5 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              XyroBoost RAM & Resource Manager
            </div>
            <div className="text-sm font-bold text-white">
              {totalRamMb} MB Used <span className="text-slate-400 font-normal">/ {boostSettings.ramLimitMb} MB Cap</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close Boost Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Real-Time Memory Bar */}
      <div className="my-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            Memory Saturation
          </span>
          <span className="font-mono font-bold text-amber-400">{memoryPercentage}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              memoryPercentage > 80
                ? 'bg-red-500'
                : memoryPercentage > 50
                ? 'bg-amber-400'
                : 'bg-[#00F0FF]'
            }`}
            style={{ width: `${memoryPercentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <span>Active: {activeTabs.length} tabs ({activeTabs.reduce((a, b) => a + b.estimatedRamMb, 0)} MB)</span>
          <span className="text-emerald-400">Sleeping: {hibernatedTabs.length} tabs ({hibernatedTabs.reduce((a, b) => a + b.estimatedRamMb, 0)} MB)</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={onHibernateAllBackground}
          className="p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <Moon className="w-3.5 h-3.5 text-amber-400" />
          <span>Hibernate Inactive</span>
        </button>

        <button
          type="button"
          onClick={handlePurge}
          className="p-2.5 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          {purgedFeedback ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Purged!</span>
            </>
          ) : (
            <>
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Cache</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs Breakdown List */}
      <div className="space-y-2 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
          <span>Tab Memory Footprint</span>
          <span>Status</span>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
          {tabs.map((tab) => {
            const isCurrent = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
                  isCurrent
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/[0.02] border-white/5'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-white truncate max-w-40 flex items-center gap-1.5">
                    {tab.isHibernated && <Moon className="w-3 h-3 text-amber-400 shrink-0" />}
                    <span className="truncate">{tab.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ~{tab.estimatedRamMb} MB
                  </div>
                </div>

                <div className="shrink-0">
                  {isCurrent ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#00F0FF]/20 text-[#00F0FF] font-semibold">
                      Focused
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleTabHibernate(tab.id)}
                      className={`text-[10px] px-2 py-1 rounded font-semibold transition-colors ${
                        tab.isHibernated
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                      }`}
                    >
                      {tab.isHibernated ? 'Wake' : 'Sleep'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
