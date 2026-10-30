import React, { useState } from 'react';
import { Download, Play, Pause, X, Trash2, CheckCircle, FileText, HardDrive, RefreshCw } from 'lucide-react';
import { DownloadItem } from '../../types/browser';

interface DownloadsPageProps {
  downloads: DownloadItem[];
  onStartTestDownload: () => void;
  onClearDownloads: () => void;
  onCancelDownload: (id: string) => void;
  onDeleteDownload: (id: string) => void;
}

export const DownloadsPage: React.FC<DownloadsPageProps> = ({
  downloads,
  onStartTestDownload,
  onClearDownloads,
  onCancelDownload,
  onDeleteDownload,
}) => {
  return (
    <div className="min-h-full w-full bg-[#0A0D14] text-slate-100 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
              <Download className="w-7 h-7 text-[#00F0FF]" />
              Download Manager
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Active streams, package installers, and local offline artifacts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onStartTestDownload}
              className="px-4 py-2 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Download Test Package
            </button>
            {downloads.length > 0 && (
              <button
                type="button"
                onClick={onClearDownloads}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Downloads List */}
        {downloads.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/5">
            <HardDrive className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-base font-semibold text-slate-300">No downloads in queue</div>
            <div className="text-xs text-slate-500 mt-1">
              Files you download will appear here with live speed and progress metrics.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {downloads.map((item) => {
              const isCompleted = item.status === 'completed';
              const isDownloading = item.status === 'downloading';

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-[#00F0FF]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate font-mono">
                          {item.fileName}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                          {item.url}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isDownloading && (
                        <button
                          type="button"
                          onClick={() => onCancelDownload(item.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Cancel Download"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteDownload(item.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Remove from List"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-emerald-400'
                            : 'bg-gradient-to-r from-[#00F0FF] to-blue-500'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                      <span>
                        {isCompleted
                          ? `${item.fileSize} • Complete`
                          : `${item.progress}% • ${item.speed || 'Downloading...'}`}
                      </span>
                      <span>{item.fileSize}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
