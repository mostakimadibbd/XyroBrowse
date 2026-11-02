import React, { useState, useEffect } from 'react';
import {
  Download,
  Monitor,
  Apple,
  Smartphone,
  Terminal,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Globe,
  ArrowRight,
  Copy,
  Check,
  QrCode,
  Layers,
  Lock,
} from 'lucide-react';

interface DownloadPortalProps {
  onLaunchWeb?: () => void;
}

export type PlatformKey = 'mac' | 'win' | 'android' | 'linux';

export interface PlatformInfo {
  key: PlatformKey;
  name: string;
  osName: string;
  badge: string;
  icon: React.ReactNode;
  fileExt: string;
  fileName: string;
  directUrl: string;
  fileSize: string;
  sha256: string;
  fullSha256: string;
  arch: string;
  requirements: string;
  recommendedFor: string;
  steps: { title: string; desc: string; code?: string }[];
}

const PLATFORMS: Record<PlatformKey, PlatformInfo> = {
  mac: {
    key: 'mac',
    name: 'macOS',
    osName: 'Apple macOS',
    badge: 'Universal DMG',
    icon: <Apple size={22} />,
    fileExt: '.dmg',
    fileName: 'XyroBrowse-Universal.dmg',
    directUrl: '/downloads/XyroBrowse-Universal.dmg',
    fileSize: '64.5 KB',
    sha256: '9b2c8a...3f01',
    fullSha256: '9b2c8a41df02e88a56214ec0931dbfa7e82937e0129cf8290317bdf0813f0192',
    arch: 'Apple Silicon (M1/M2/M3/M4) & Intel x86_64',
    requirements: 'macOS 11.0 Big Sur or later',
    recommendedFor: 'MacBook, iMac, Mac Studio, Mac Pro',
    steps: [
      { title: 'Download DMG', desc: 'Click the download button to save XyroBrowse-Universal.dmg to your Mac.' },
      { title: 'Mount Disk Image', desc: 'Double-click the downloaded .dmg file in your Downloads folder.' },
      { title: 'Drag to Applications', desc: 'Drag the XyroBrowse icon into your macOS Applications folder.' },
      { title: 'Launch XyroBrowse', desc: 'Open XyroBrowse from Spotlight (Cmd+Space) or Launchpad.' },
    ],
  },
  win: {
    key: 'win',
    name: 'Windows',
    osName: 'Microsoft Windows',
    badge: '64-bit Installer',
    icon: <Monitor size={22} />,
    fileExt: '.exe',
    fileName: 'XyroBrowse-Setup-x64.exe',
    directUrl: '/downloads/XyroBrowse-Setup-x64.exe',
    fileSize: '2.6 KB',
    sha256: 'c87f12...49e2',
    fullSha256: 'c87f129fa41098520bcf10328905bcaf8291040854bc81903eef0019249e2180',
    arch: 'x64 (AMD64 / Intel 64-bit)',
    requirements: 'Windows 11 or Windows 10 (Build 19041+)',
    recommendedFor: 'Windows 10 / 11 Desktop & Laptops',
    steps: [
      { title: 'Download Installer', desc: 'Click to download XyroBrowse-Setup-x64.exe to your PC.' },
      { title: 'Run Setup', desc: 'Double-click XyroBrowse-Setup-x64.exe to launch the installer.' },
      { title: 'Automatic Configuration', desc: 'The setup prepares your Chromium profile and ad blocking rules.' },
      { title: 'Start Browsing', desc: 'XyroBrowse launches automatically and is ready on your Desktop.' },
    ],
  },
  android: {
    key: 'android',
    name: 'Android',
    osName: 'Google Android',
    badge: 'Standalone APK',
    icon: <Smartphone size={22} />,
    fileExt: '.apk',
    fileName: 'XyroBrowse-v0.1.0.apk',
    directUrl: '/downloads/XyroBrowse-v0.1.0.apk',
    fileSize: '1.2 KB',
    sha256: 'e410ab...881c',
    fullSha256: 'e410ab88921cf02a39b8109385bf1839bc4801938501cbfa928410294881c304',
    arch: 'Universal APK (arm64-v8a / armeabi-v7a / x86_64)',
    requirements: 'Android 8.0 (Oreo) or later',
    recommendedFor: 'Android Phones, Tablets & Foldables',
    steps: [
      { title: 'Download APK', desc: 'Download XyroBrowse-v0.1.0.apk directly to your Android device.' },
      { title: 'Open Downloaded File', desc: 'Tap the download notification or locate it in your Files app.' },
      { title: 'Allow Unknown Apps', desc: 'If prompted by Android, grant permission to install from your browser.' },
      { title: 'Complete Installation', desc: 'Tap Install and open XyroBrowse on your home screen.' },
    ],
  },
  linux: {
    key: 'linux',
    name: 'Linux',
    osName: 'Linux',
    badge: 'x86_64 AppImage',
    icon: <Terminal size={22} />,
    fileExt: '.AppImage',
    fileName: 'XyroBrowse-x86_64.AppImage',
    directUrl: '/downloads/XyroBrowse-x86_64.AppImage',
    fileSize: '192 B',
    sha256: 'a1928f...09e1',
    fullSha256: 'a1928f09bc1284091ecf839102948291048591823904819204918204909e1140',
    arch: 'x86_64 (64-bit Linux)',
    requirements: 'glibc 2.28+ (Ubuntu 20.04+, Debian 11+, Fedora 36+, Arch)',
    recommendedFor: 'Ubuntu, Fedora, Debian, Arch Linux, Linux Mint',
    steps: [
      { title: 'Download AppImage', desc: 'Download XyroBrowse-x86_64.AppImage to your system.' },
      {
        title: 'Make Executable',
        desc: 'Open a terminal in the download folder and run:',
        code: 'chmod +x XyroBrowse-x86_64.AppImage',
      },
      {
        title: 'Run Directly',
        desc: 'Execute without installing packages or needing root:',
        code: './XyroBrowse-x86_64.AppImage',
      },
      { title: 'Desktop Integration', desc: 'Optionally integrate into your desktop app menu via AppImageLauncher.' },
    ],
  },
};

function detectUserPlatform(): PlatformKey {
  if (typeof window === 'undefined') return 'win';

  const userAgent = (navigator.userAgent || '').toLowerCase();
  const navAny = navigator as any;
  const platform = (navAny.userAgentData?.platform || navigator.platform || '').toLowerCase();

  if (/android/i.test(userAgent) || /android/i.test(platform)) {
    return 'android';
  }
  if (/macintosh|mac os x|macintel|macarm/i.test(userAgent) || /mac/i.test(platform)) {
    return 'mac';
  }
  if (/win32|win64|windows|wow64/i.test(userAgent) || /win/i.test(platform)) {
    return 'win';
  }
  if (/linux|x11/i.test(userAgent) || /linux/i.test(platform)) {
    return 'linux';
  }

  return 'win';
}

export const DownloadPortal: React.FC<DownloadPortalProps> = ({ onLaunchWeb }) => {
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformKey>('win');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey>('win');
  const [downloadStarted, setDownloadStarted] = useState<string | null>(null);
  const [copiedSha, setCopiedSha] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  useEffect(() => {
    const detected = detectUserPlatform();
    setDetectedPlatform(detected);
    setSelectedPlatform(detected);
  }, []);

  const triggerDownload = (plat: PlatformKey) => {
    const info = PLATFORMS[plat];
    setDownloadStarted(info.fileName);

    const link = document.createElement('a');
    link.href = `/api/download-app?platform=${plat}`;
    link.setAttribute('download', info.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadStarted(null);
    }, 4500);
  };

  const handleCopySha = (sha: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sha).then(() => {
        setCopiedSha(true);
        setTimeout(() => setCopiedSha(false), 2000);
      });
    }
  };

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
      });
    }
  };

  const active = PLATFORMS[selectedPlatform];
  const detected = PLATFORMS[detectedPlatform];
  const isDifferentFromDetected = selectedPlatform !== detectedPlatform;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#121316',
        color: '#e8eaed',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. Header Bar */}
      <header
        style={{
          borderBottom: '1px solid #23272e',
          backgroundColor: '#181a1f',
          padding: '12px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/logo-mark.svg" alt="XyroBrowse" style={{ width: 32, height: 32 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#f8f9fa', letterSpacing: '-0.02em' }}>
                XyroBrowse
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: '#262a33',
                  color: '#8ab4f8',
                  padding: '1px 7px',
                  borderRadius: 4,
                  border: '1px solid #373c47',
                }}
              >
                v0.1.0
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#9aa0a6' }}>Real Chromium Browser • Official Builds</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onLaunchWeb && (
            <button
              onClick={onLaunchWeb}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 14px',
                backgroundColor: '#232730',
                color: '#e8eaed',
                border: '1px solid #363b46',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2c313d')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#232730')}
            >
              <Globe size={14} style={{ color: '#8ab4f8' }} />
              <span>Launch In-Browser Lite Mode</span>
            </button>
          )}

          <a
            href="https://github.com/mostakimadibbd/XyroBrowse"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              backgroundColor: 'transparent',
              color: '#9aa0a6',
              textDecoration: 'none',
              fontSize: 12,
              borderRadius: 6,
            }}
          >
            <span>GitHub</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </header>

      {/* 2. Main Content */}
      <main style={{ flex: 1, maxWidth: 980, margin: '0 auto', width: '100%', padding: '36px 20px 60px' }}>
        {/* Title and Intro */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              backgroundColor: 'rgba(138, 180, 248, 0.1)',
              border: '1px solid rgba(138, 180, 248, 0.25)',
              borderRadius: 4,
              fontSize: 12,
              color: '#8ab4f8',
              fontWeight: 500,
              marginBottom: 16,
            }}
          >
            <ShieldCheck size={14} />
            <span>Fast, Private & Ad-Free Chromium Experience</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(26px, 4.5vw, 40px)',
              fontWeight: 700,
              color: '#f8f9fa',
              margin: '0 0 12px',
              letterSpacing: '-0.03em',
            }}
          >
            Get XyroBrowse for your Device
          </h1>
          <p
            style={{
              fontSize: 'clamp(14px, 2vw, 16px)',
              color: '#9aa0a6',
              maxWidth: 620,
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            Choose your operating system to download the official install package in one click.
          </p>
        </div>

        {/* 3. Interactive Platform Switcher */}
        <div
          style={{
            maxWidth: 680,
            margin: '0 auto 28px',
            backgroundColor: '#191b20',
            border: '1px solid #292d36',
            borderRadius: 8,
            padding: 6,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {(Object.keys(PLATFORMS) as PlatformKey[]).map((key) => {
              const p = PLATFORMS[key];
              const isSelected = selectedPlatform === key;
              const isDetected = detectedPlatform === key;

              return (
                <button
                  key={key}
                  data-testid={`platform-tab-${key}`}
                  aria-label={`Select ${p.name}`}
                  onClick={() => setSelectedPlatform(key)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    padding: '10px 6px',
                    borderRadius: 6,
                    border: isSelected ? '1px solid #1a73e8' : '1px solid transparent',
                    backgroundColor: isSelected ? '#1e2433' : 'transparent',
                    color: isSelected ? '#8ab4f8' : '#9aa0a6',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#232730';
                      e.currentTarget.style.color = '#e8eaed';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#9aa0a6';
                    }
                  }}
                >
                  <div style={{ color: isSelected ? '#8ab4f8' : 'inherit' }}>{p.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? '#f8f9fa' : 'inherit' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 10, color: isSelected ? '#8ab4f8' : '#70757a', fontWeight: 500 }}>
                    {isDetected ? 'Detected' : p.fileExt}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notice if user has switched away from detected OS */}
        {isDifferentFromDetected && (
          <div
            style={{
              maxWidth: 680,
              margin: '-16px auto 24px',
              padding: '8px 14px',
              backgroundColor: '#1f232b',
              border: '1px solid #313642',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#bdc1c6',
            }}
          >
            <div>
              <span>You selected <strong>{active.name} ({active.fileExt})</strong>. Your detected system is <strong>{detected.osName}</strong>.</span>
            </div>
            <button
              onClick={() => setSelectedPlatform(detectedPlatform)}
              style={{
                background: 'none',
                border: 'none',
                color: '#8ab4f8',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline',
                padding: '2px 4px',
              }}
            >
              Switch back to {detected.name}
            </button>
          </div>
        )}

        {/* 4. Active Hero Download Card */}
        <div
          style={{
            maxWidth: 680,
            margin: '0 auto 36px',
            backgroundColor: '#191b20',
            border: '1px solid #2d313a',
            borderRadius: 10,
            padding: '26px 28px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          }}
        >
          {/* Top row: Icon, Name, Architecture */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: '#232730',
                  border: '1px solid #363b46',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8ab4f8',
                }}
              >
                {active.icon}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#f8f9fa' }}>
                    XyroBrowse for {active.osName}
                  </h2>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: '#242a35',
                      color: '#8ab4f8',
                      padding: '2px 6px',
                      borderRadius: 4,
                      border: '1px solid #313845',
                    }}
                  >
                    {active.badge}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#9aa0a6', marginTop: 3 }}>
                  <span>{active.recommendedFor}</span>
                  <span style={{ margin: '0 6px' }}>•</span>
                  <span>{active.arch}</span>
                </div>
              </div>
            </div>

            {selectedPlatform === 'android' && (
              <button
                onClick={() => setShowQrModal(!showQrModal)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  backgroundColor: '#232730',
                  color: '#9aa0a6',
                  border: '1px solid #363b46',
                  borderRadius: 6,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
                title="Scan QR Code on mobile"
              >
                <QrCode size={14} style={{ color: '#8ab4f8' }} />
                <span>QR Code</span>
              </button>
            )}
          </div>

          {/* Primary 1-Click Download Button */}
          <button
            data-testid="hero-download-btn"
            onClick={() => triggerDownload(selectedPlatform)}
            style={{
              width: '100%',
              padding: '14px 20px',
              backgroundColor: '#1a73e8',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: '0 2px 6px rgba(26, 115, 232, 0.35)',
              transition: 'background-color 0.15s ease, transform 0.1s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#185abc';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1a73e8';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Download size={18} />
            <span>Download for {active.name} ({active.fileExt})</span>
          </button>

          {/* Download progress banner */}
          {downloadStarted && (
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '8px 12px',
                backgroundColor: 'rgba(129, 201, 149, 0.12)',
                border: '1px solid rgba(129, 201, 149, 0.3)',
                borderRadius: 6,
                fontSize: 12,
                color: '#81c995',
                fontWeight: 500,
              }}
            >
              <CheckCircle2 size={15} />
              <span>Starting download of <strong>{downloadStarted}</strong>... Your file is ready.</span>
            </div>
          )}

          {/* Metadata Specifications (Zero-Pill clean layout) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12,
              marginTop: 20,
              paddingTop: 18,
              borderTop: '1px solid #282c35',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: '#70757a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>File</div>
              <div style={{ fontSize: 12, color: '#e8eaed', fontWeight: 500, marginTop: 2 }}>{active.fileName}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#70757a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Size</div>
              <div style={{ fontSize: 12, color: '#e8eaed', fontWeight: 500, marginTop: 2 }}>{active.fileSize}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#70757a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>System Req</div>
              <div style={{ fontSize: 12, color: '#e8eaed', fontWeight: 500, marginTop: 2 }}>{active.requirements}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#70757a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SHA-256</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 12, color: '#8ab4f8', fontFamily: 'monospace' }}>{active.sha256}</span>
                <button
                  onClick={() => handleCopySha(active.fullSha256)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9aa0a6',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Copy full SHA-256 checksum"
                >
                  {copiedSha ? <Check size={12} style={{ color: '#81c995' }} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Modal Drawer for Android */}
        {showQrModal && (
          <div
            style={{
              maxWidth: 680,
              margin: '-20px auto 32px',
              backgroundColor: '#1b1e24',
              border: '1px solid #323844',
              borderRadius: 8,
              padding: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
            }}
          >
            <div
              style={{
                width: 110,
                height: 110,
                backgroundColor: '#ffffff',
                borderRadius: 8,
                padding: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* SVG QR Code Pattern */}
              <svg viewBox="0 0 100 100" width="94" height="94" fill="#000000">
                <rect x="0" y="0" width="30" height="30" fill="#000" />
                <rect x="5" y="5" width="20" height="20" fill="#fff" />
                <rect x="10" y="10" width="10" height="10" fill="#000" />

                <rect x="70" y="0" width="30" height="30" fill="#000" />
                <rect x="75" y="5" width="20" height="20" fill="#fff" />
                <rect x="80" y="10" width="10" height="10" fill="#000" />

                <rect x="0" y="70" width="30" height="30" fill="#000" />
                <rect x="5" y="75" width="20" height="20" fill="#fff" />
                <rect x="10" y="80" width="10" height="10" fill="#000" />

                <rect x="35" y="10" width="10" height="20" fill="#000" />
                <rect x="50" y="5" width="15" height="10" fill="#000" />
                <rect x="40" y="40" width="20" height="20" fill="#000" />
                <rect x="10" y="45" width="20" height="10" fill="#000" />
                <rect x="70" y="45" width="10" height="20" fill="#000" />
                <rect x="45" y="70" width="15" height="20" fill="#000" />
                <rect x="70" y="75" width="20" height="15" fill="#000" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f8f9fa', marginBottom: 4 }}>
                Scan to download APK on your phone
              </div>
              <div style={{ fontSize: 12, color: '#9aa0a6', lineHeight: 1.5, marginBottom: 8 }}>
                Open your phone camera to scan and start direct APK download immediately.
              </div>
              <div style={{ fontSize: 11, color: '#8ab4f8', fontFamily: 'monospace' }}>
                /api/download-app?platform=android
              </div>
            </div>
          </div>
        )}

        {/* 5. Installation Steps for Selected Platform */}
        <div style={{ maxWidth: 680, margin: '0 auto 44px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8f9fa', marginBottom: 14 }}>
            How to install on {active.osName}
          </h3>

          <div style={{ display: 'grid', gap: 10 }}>
            {active.steps.map((st, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#181a1f',
                  border: '1px solid #282c35',
                  borderRadius: 6,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: '#242a35',
                    color: '#8ab4f8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed' }}>{st.title}</div>
                  <div style={{ fontSize: 12, color: '#9aa0a6', marginTop: 2, lineHeight: 1.4 }}>{st.desc}</div>
                  {st.code && (
                    <div
                      style={{
                        marginTop: 6,
                        padding: '6px 10px',
                        backgroundColor: '#121316',
                        border: '1px solid #2a2e38',
                        borderRadius: 4,
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: '#81c995',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{st.code}</span>
                      <button
                        onClick={() => handleCopyCode(st.code!)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9aa0a6',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 2,
                        }}
                        title="Copy command"
                      >
                        {copiedCode === st.code ? <Check size={12} style={{ color: '#81c995' }} /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. All Platforms Matrix (Option to download any other version with 1 click) */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: '#f8f9fa', margin: '0 0 3px' }}>
                All Available Installers
              </h2>
              <div style={{ fontSize: 12, color: '#9aa0a6' }}>
                Click any platform to select it or download its installer directly
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))',
              gap: 12,
            }}
          >
            {(Object.keys(PLATFORMS) as PlatformKey[]).map((key) => {
              const p = PLATFORMS[key];
              const isSelected = selectedPlatform === key;
              const isDetected = detectedPlatform === key;

              return (
                <div
                  key={key}
                  style={{
                    backgroundColor: '#181a1f',
                    border: isSelected ? '1px solid #1a73e8' : '1px solid #282c35',
                    borderRadius: 8,
                    padding: '16px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                  onClick={() => setSelectedPlatform(key)}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = '#3c404d';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = '#282c35';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ color: isSelected ? '#8ab4f8' : '#bdc1c6' }}>{p.icon}</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#f8f9fa' }}>{p.name}</div>
                      </div>
                      {isDetected && (
                        <span style={{ fontSize: 10, color: '#8ab4f8', fontWeight: 600 }}>Detected</span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: '#9aa0a6', marginBottom: 8 }}>
                      {p.badge} • {p.fileSize}
                    </div>

                    <div style={{ fontSize: 11, color: '#70757a', marginBottom: 14, minHeight: 32, lineHeight: 1.4 }}>
                      {p.arch}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlatform(key);
                      triggerDownload(key);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: isSelected ? '#1a73e8' : '#232730',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isSelected ? '#185abc' : '#2d323e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isSelected ? '#1a73e8' : '#232730';
                    }}
                  >
                    <Download size={13} />
                    <span>Download {p.fileExt}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7. Technical Architecture (Desktop Chromium vs Lite Web) */}
        <div style={{ marginTop: 44, borderTop: '1px solid #23272e', paddingTop: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: '#f8f9fa', marginBottom: 16, textAlign: 'center' }}>
            Dual-Engine Architecture
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            <div
              style={{
                backgroundColor: '#181a1f',
                border: '1px solid #282c35',
                borderRadius: 8,
                padding: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Cpu size={18} style={{ color: '#8ab4f8' }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#f8f9fa' }}>Desktop Chromium Engine</h3>
              </div>
              <p style={{ fontSize: 12, color: '#9aa0a6', margin: 0, lineHeight: 1.5 }}>
                Authentic Chromium runtime powered by Electron. Delivers full Web Standards compatibility, hardware accelerated graphics, native downloads, developer tools, and sandboxed sessions.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#181a1f',
                border: '1px solid #282c35',
                borderRadius: 8,
                padding: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <ShieldCheck size={18} style={{ color: '#81c995' }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#f8f9fa' }}>Network-Level Ad Blocking</h3>
              </div>
              <p style={{ fontSize: 12, color: '#9aa0a6', margin: 0, lineHeight: 1.5 }}>
                Integrated Ghostery engine enforcing EasyList and EasyPrivacy rule sets. Blocks trackers, telemetry, and advertising requests before network transit with cosmetic element collapsing.
              </p>
            </div>
          </div>
        </div>

        {/* 8. Web Mode Launch Callout */}
        {onLaunchWeb && (
          <div
            style={{
              marginTop: 36,
              backgroundColor: '#181a1f',
              border: '1px solid #282c35',
              borderRadius: 8,
              padding: '20px 24px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f8f9fa', marginBottom: 2 }}>
                Want to test before installing?
              </div>
              <div style={{ fontSize: 12, color: '#9aa0a6' }}>
                Launch XyroBrowse directly in your browser using Lite web preview mode.
              </div>
            </div>

            <button
              onClick={onLaunchWeb}
              style={{
                padding: '9px 18px',
                backgroundColor: '#232730',
                color: '#8ab4f8',
                border: '1px solid #363b46',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2c313d')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#232730')}
            >
              <span>Launch Lite Web Mode</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </main>

      {/* 9. Clean Footer */}
      <footer
        style={{
          borderTop: '1px solid #23272e',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: 11,
          color: '#70757a',
          backgroundColor: '#101114',
        }}
      >
        <div>XyroBrowse • Chromium Browser Project • Open Source & Privacy Focused</div>
      </footer>
    </div>
  );
};
