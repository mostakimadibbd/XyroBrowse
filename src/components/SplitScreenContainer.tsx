import React from 'react';
import { X, ArrowLeft, ArrowRight, RotateCw, ExternalLink } from 'lucide-react';
import { Tab } from '../types/browser';

interface SplitScreenContainerProps {
  primaryTab: Tab;
  secondaryTab: Tab;
  renderViewport: (tab: Tab, isSplitPane?: boolean) => React.ReactNode;
  onCloseSplit: () => void;
  onNavigateSecondary: (url: string) => void;
}

export const SplitScreenContainer: React.FC<SplitScreenContainerProps> = ({
  primaryTab,
  secondaryTab,
  renderViewport,
  onCloseSplit,
  onNavigateSecondary,
}) => {
  return (
    <div className="flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden relative">
      {/* Primary Left/Top Pane */}
      <div className="flex-1 h-full flex flex-col border-r border-white/10 overflow-hidden min-w-0">
        <div className="h-7 px-3 bg-[#07090E] border-b border-white/5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
            <span className="font-semibold truncate">{primaryTab.title}</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500 truncate max-w-48">
            {primaryTab.url}
          </span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          {renderViewport(primaryTab, false)}
        </div>
      </div>

      {/* Secondary Right/Bottom Pane */}
      <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">
        <div className="h-7 px-3 bg-[#07090E] border-b border-white/5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="font-semibold truncate">{secondaryTab.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500 truncate max-w-40">
              {secondaryTab.url}
            </span>
            <button
              type="button"
              onClick={onCloseSplit}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
              title="Close Split View"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative">
          {renderViewport(secondaryTab, true)}
        </div>
      </div>
    </div>
  );
};
