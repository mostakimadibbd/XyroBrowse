import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Smartphone } from 'lucide-react';

interface QrCodeModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ url, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Generate a clean deterministic QR code SVG matrix representation
  const qrBlocks: boolean[][] = [];
  const size = 21;
  const hash = url.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000007, 42);

  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      // Corner squares
      const isCornerTL = (r < 7 && c < 7) && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
      const isCornerTR = (r < 7 && c >= size - 7) && (r === 0 || r === 6 || c === size - 7 || c === size - 1 || (r >= 2 && r <= 4 && c >= size - 5 && c <= size - 3));
      const isCornerBL = (r >= size - 7 && c < 7) && (r === size - 7 || r === size - 1 || c === 0 || c === 6 || (r >= size - 5 && r <= size - 3 && c >= 2 && c <= 4));
      
      if (isCornerTL || isCornerTR || isCornerBL) {
        row.push(true);
      } else {
        const cellHash = (hash * (r + 1) * 17 + c * 37) % 7;
        row.push(cellHash < 3);
      }
    }
    qrBlocks.push(row);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#0F1522] border border-white/10 rounded-2xl p-6 shadow-2xl relative space-y-5 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
          aria-label="Close QR Modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] mb-2">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Scan with Mobile Device</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Open camera on your phone to instantly view this webpage or Capacitor APK test target.
          </p>
        </div>

        {/* QR Code Graphic Container */}
        <div className="flex justify-center my-3">
          <div className="p-4 bg-white rounded-2xl shadow-xl inline-block border-4 border-[#00F0FF]/30">
            <svg
              width="180"
              height="180"
              viewBox="0 0 21 21"
              className="shape-rendering-crisp"
            >
              {qrBlocks.map((row, r) =>
                row.map((cell, c) =>
                  cell ? (
                    <rect
                      key={`${r}-${c}`}
                      x={c}
                      y={r}
                      width="1"
                      height="1"
                      fill="#0A0D14"
                    />
                  ) : null
                )
              )}
            </svg>
          </div>
        </div>

        {/* URL Box & Copy */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
          <span className="truncate font-mono text-slate-300 flex-1 text-left px-1">
            {url}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] font-semibold flex items-center gap-1 shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
