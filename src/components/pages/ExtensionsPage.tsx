import React, { useState } from 'react';
import {
  Puzzle,
  Check,
  Moon,
  Shield,
  Zap,
  RotateCw,
  Code,
  FileCode,
  Save,
  CheckCircle2,
  Sun,
  Type,
} from 'lucide-react';
import { ExtensionItem } from '../../types/browser';

interface ExtensionsPageProps {
  extensions: ExtensionItem[];
  onToggleExtension: (id: string) => void;
  onUpdateExtensionScript: (id: string, customCss?: string, customJs?: string) => void;
}

export const ExtensionsPage: React.FC<ExtensionsPageProps> = ({
  extensions,
  onToggleExtension,
  onUpdateExtensionScript,
}) => {
  const [selectedExtId, setSelectedExtId] = useState<string>('ext-custom-injector');
  const [activeTab, setActiveTab] = useState<'css' | 'js'>('css');
  const [editedCss, setEditedCss] = useState('');
  const [editedJs, setEditedJs] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const selectedExt = extensions.find((e) => e.id === selectedExtId);

  // Sync editor when selectedExt changes
  React.useEffect(() => {
    if (selectedExt) {
      setEditedCss(selectedExt.customCss || '');
      setEditedJs(selectedExt.customJs || '');
    }
  }, [selectedExtId, extensions]);

  const handleSaveCode = () => {
    if (!selectedExt) return;
    onUpdateExtensionScript(selectedExt.id, editedCss, editedJs);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Moon': return <Moon className="w-5 h-5 text-indigo-400" />;
      case 'Sun': return <Sun className="w-5 h-5 text-amber-400" />;
      case 'Type': return <Type className="w-5 h-5 text-blue-400" />;
      case 'Shield': return <Shield className="w-5 h-5 text-[#00F0FF]" />;
      case 'Zap': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'RotateCw': return <RotateCw className="w-5 h-5 text-emerald-400" />;
      case 'Code': return <Code className="w-5 h-5 text-pink-400" />;
      case 'FileCode': return <FileCode className="w-5 h-5 text-cyan-400" />;
      default: return <Puzzle className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-full w-full bg-[#0A0D14] text-slate-100 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <Puzzle className="w-7 h-7 text-[#00F0FF]" />
            Extension & Userscript Manager
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Active browser extensions, Manifest V3 scripts, and live CSS/JS DOM injectors.
          </p>
        </div>

        {/* Extensions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {extensions.map((ext) => (
            <div
              key={ext.id}
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                ext.enabled
                  ? 'bg-white/[0.04] border-[#00F0FF]/30 shadow-lg shadow-[#00F0FF]/5'
                  : 'bg-white/[0.02] border-white/5 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center shrink-0">
                    {renderIcon(ext.icon)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{ext.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
                        v{ext.version}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">By {ext.author}</div>
                  </div>
                </div>

                {/* Switch */}
                <button
                  type="button"
                  onClick={() => onToggleExtension(ext.id)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors relative cursor-pointer ${
                    ext.enabled ? 'bg-[#00F0FF]' : 'bg-slate-700'
                  }`}
                  aria-label={`Toggle ${ext.name}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-black transition-transform ${
                      ext.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{ext.description}</p>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-500">
                <span className="uppercase tracking-wider font-mono font-semibold">
                  {ext.type === 'manifest_v3' ? 'Manifest V3' : 'Userscript'}
                </span>
                {ext.customCss !== undefined && (
                  <button
                    type="button"
                    onClick={() => setSelectedExtId(ext.id)}
                    className="text-[#00F0FF] hover:underline font-medium"
                  >
                    Edit Script / Rules →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Live CSS/JS Injector Code Editor */}
        {selectedExt && (selectedExt.customCss !== undefined || selectedExt.customJs !== undefined) && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code className="w-5 h-5 text-pink-400" />
                  Script Editor: {selectedExt.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Code here is actively injected into web viewports when enabled.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCode}
                  className="px-4 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#00D0DF] text-black text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#00F0FF]/20"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span>Saved & Injected!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save & Apply</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('css')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeTab === 'css'
                    ? 'bg-white/10 text-[#00F0FF] border border-[#00F0FF]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Injected CSS Stylesheet
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('js')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeTab === 'js'
                    ? 'bg-white/10 text-pink-400 border border-pink-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Userscript JavaScript
              </button>
            </div>

            {/* Code Textarea */}
            {activeTab === 'css' ? (
              <textarea
                value={editedCss}
                onChange={(e) => setEditedCss(e.target.value)}
                placeholder="/* Write custom CSS styles here */"
                rows={8}
                className="w-full p-4 rounded-xl bg-black/50 border border-white/10 text-[#00F0FF] font-mono text-xs outline-none focus:border-[#00F0FF] resize-none"
              />
            ) : (
              <textarea
                value={editedJs}
                onChange={(e) => setEditedJs(e.target.value)}
                placeholder="// Write custom JavaScript userscript here"
                rows={8}
                className="w-full p-4 rounded-xl bg-black/50 border border-white/10 text-pink-400 font-mono text-xs outline-none focus:border-pink-400 resize-none"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
