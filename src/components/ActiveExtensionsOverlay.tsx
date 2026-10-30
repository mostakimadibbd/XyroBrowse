import React from 'react';
import { ExtensionItem } from '../types/browser';

interface ActiveExtensionsOverlayProps {
  extensions: ExtensionItem[];
  zoomLevel: number;
}

export const ActiveExtensionsOverlay: React.FC<ActiveExtensionsOverlayProps> = ({
  extensions,
  zoomLevel,
}) => {
  const isNightEyeActive = extensions.some(
    (e) => (e.id === 'ext-nighteye' || e.name.toLowerCase().includes('blue-light')) && e.enabled
  );

  if (!isNightEyeActive) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 transition-opacity duration-300"
      style={{
        backgroundColor: 'rgba(255, 170, 40, 0.14)',
        mixBlendMode: 'multiply',
      }}
      aria-hidden="true"
    />
  );
};
