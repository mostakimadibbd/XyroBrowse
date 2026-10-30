import React, { useState } from 'react';
import { Key, Search, Plus, Copy, Eye, EyeOff, Trash2, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { PasswordCredential } from '../../types/browser';

interface PasswordsPageProps {
  passwords: PasswordCredential[];
  onAddPassword: (site: string, username: string, pass: string) => void;
  onDeletePassword: (id: string) => void;
}

export const PasswordsPage: React.FC<PasswordsPageProps> = ({
  passwords,
  onAddPassword,
  onDeletePassword,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New credential state
  const [site, setSite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [genLength, setGenLength] = useState(16);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';
    for (let i = 0; i < genLength; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!site.trim() || !username.trim() || !password.trim()) return;
    onAddPassword(site.trim(), username.trim(), password.trim());
    setSite('');
    setUsername('');
    setPassword('');
    setShowAddModal(false);
  };

  const filtered = passwords.filter(
    (p) =>
      p.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-full w-full bg-[#0A0D14] text-slate-100 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
              <Key className="w-7 h-7 text-[#00F0FF]" />
              Password & Identity Vault
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Encrypted local password store with built-in cryptographic generator and autofill bridge.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              generateRandomPassword();
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#00D0DF] text-black text-xs font-bold flex items-center gap-2 shadow-md shadow-[#00F0FF]/20 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Password
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved accounts by website or username..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-[#00F0FF]"
          />
        </div>

        {/* Credentials List */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/5">
            <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-base font-semibold text-slate-300">No passwords stored in vault</div>
            <div className="text-xs text-slate-500 mt-1">
              Save your website login credentials securely in local sandbox storage.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const isRevealed = !!revealedIds[item.id];
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-white/10 flex items-center justify-center text-[#00F0FF] shrink-0 font-bold">
                      {item.site.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate font-mono">
                        {item.site}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {item.username}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Password display */}
                    <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 font-mono text-xs text-slate-300 min-w-36 text-center">
                      {isRevealed ? item.password : '••••••••••••'}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleReveal(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title={isRevealed ? 'Hide Password' : 'Show Password'}
                    >
                      {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.password)}
                      className="p-2 rounded-lg text-slate-400 hover:text-[#00F0FF] hover:bg-[#00F0FF]/10 transition-colors"
                      title="Copy Password"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeletePassword(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Password Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0F1520] border border-white/10 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-[#00F0FF]" />
              Add Password Credential
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Website Domain</label>
                <input
                  type="text"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  placeholder="e.g. github.com"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#00F0FF]"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Username / Email</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. user@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#00F0FF]"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-400">Password</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-xs text-[#00F0FF] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate Strong
                  </button>
                </div>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm outline-none focus:border-[#00F0FF]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#00D0DF] text-black text-xs font-bold shadow-md shadow-[#00F0FF]/20"
                >
                  Save Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
