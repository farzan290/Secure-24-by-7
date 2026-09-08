import React, { useState } from 'react';
import {
  Shield,
  Building2,
  Crown,
  Lock,
  Radio,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Share2,
  Copy,
  ExternalLink,
  Check
} from 'lucide-react';
import { Role, Society } from '../types';
import { soundEngine } from '../services/audio';

interface Props {
  onSelectRole: (role: Role) => void;
  activeSociety: Society;
  onOpenEmergency: () => void;
  isAmbientPlaying: boolean;
  onToggleAmbient: () => void;
  networkStatus: 'ONLINE' | 'WEAK' | 'OFFLINE';
}

export const RoleSelectScreen: React.FC<Props> = ({
  onSelectRole,
  activeSociety,
  onOpenEmergency,
  isAmbientPlaying,
  onToggleAmbient,
  networkStatus
}) => {
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Preferred public URL
  const publicAppUrl = typeof window !== 'undefined' 
    ? (window.location.origin.includes('ais-dev') 
        ? window.location.origin.replace('ais-dev-', 'ais-pre-') 
        : window.location.origin)
    : 'https://ais-pre-h24n4onpfwsw5imsrkogix-723147772528.asia-east1.run.app';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicAppUrl);
      soundEngine.playSuccessChime();
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = publicAppUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      soundEngine.playSuccessChime();
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white relative overflow-hidden">
      {/* Background visual security grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/30 border border-cyan-400/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wider text-slate-100 text-lg uppercase font-mono">
                Secure 24 by 7
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-widest px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                PRO EDITION
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium truncate max-w-xs md:max-w-md">
              {activeSociety.name} • {activeSociety.city}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Share App Link for Guest / Direct Access */}
          <button
            id="btn-share-app-link"
            onClick={() => setShowShareModal(true)}
            className="px-3 py-2 rounded-lg border border-cyan-800/80 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm hover:border-cyan-500"
            title="Get Link for Chrome Guest ID or sharing"
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline font-semibold">Share App Link</span>
          </button>

          {/* Security Music Control */}
          <button
            id="btn-ambient-sound"
            onClick={onToggleAmbient}
            title={isAmbientPlaying ? 'Pause Security Music' : 'Play Security Music'}
            className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center space-x-2 transition-all ${
              isAmbientPlaying
                ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/80 shadow-md shadow-cyan-900/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {isAmbientPlaying ? (
              <div className="flex items-end space-x-0.5 h-3 w-3.5">
                <span className="w-0.5 h-2 bg-cyan-400 rounded-t animate-pulse" />
                <span className="w-0.5 h-3 bg-cyan-300 rounded-t animate-bounce" />
                <span className="w-0.5 h-1.5 bg-blue-400 rounded-t animate-pulse" />
              </div>
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <div className="flex flex-col text-left">
              <span className="hidden sm:inline text-xs font-semibold leading-tight">Security Music</span>
              <span className="hidden sm:inline text-[9px] font-mono text-cyan-400/80 leading-none">
                {isAmbientPlaying ? 'MUSIC ACTIVE' : 'MUTED'}
              </span>
            </div>
          </button>

          {/* Network Status Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${
              networkStatus === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`} />
            <span className="text-slate-300 font-mono">
              {networkStatus === 'ONLINE' ? 'SYSTEM ONLINE' : 'WEAK NETWORK'}
            </span>
          </div>

          {/* Emergency Trigger */}
          <button
            id="btn-quick-emergency"
            onClick={onOpenEmergency}
            className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-lg shadow-red-950/60 border border-red-400/40 transition-transform active:scale-95"
          >
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span className="tracking-wide">EMERGENCY</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center items-center text-center">
        {/* Title & Subtitle */}
        <div className="mb-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 mb-4 shadow-sm">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Commercial Access Control &amp; Gate Intelligence</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 font-mono">
            SECURE 24 BY 7
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-medium">
            Smart Security • Intelligent Access • Complete Protection
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Select your authorized access portal to continue
          </p>
        </div>

        {/* 3 Large Professional Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {/* 1. Security Guard */}
          <button
            id="role-guard-card"
            onClick={() => onSelectRole('GUARD')}
            className="group relative bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/80 rounded-2xl p-7 text-left transition-all duration-200 shadow-xl shadow-slate-950/50 hover:shadow-cyan-950/40 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-xl bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform text-cyan-400">
                <Shield className="w-7 h-7" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Security Guard
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  GATE CONSOLE
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Fast gate operations, vehicle ANPR scan, visitor check-in, electronic barrier controls &amp; resident confirmation.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400 font-medium">
              <span>Verify ID &amp; Enter</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 2. Society Management */}
          <button
            id="role-management-card"
            onClick={() => onSelectRole('MANAGEMENT')}
            className="group relative bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/80 rounded-2xl p-7 text-left transition-all duration-200 shadow-xl shadow-slate-950/50 hover:shadow-blue-950/40 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-xl bg-blue-950/80 border border-blue-700/50 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform text-blue-400">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                  Society Management
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
                  ADMIN PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Command center, guard rosters, resident directory, incident reviews, CCTV grid, reports &amp; Secure AI query engine.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-blue-400 font-medium">
              <span>Secure Password Access</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 3. Owner */}
          <button
            id="role-owner-card"
            onClick={() => onSelectRole('OWNER')}
            className="group relative bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/80 rounded-2xl p-7 text-left transition-all duration-200 shadow-xl shadow-slate-950/50 hover:shadow-amber-950/40 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform text-amber-400">
                <Crown className="w-7 h-7" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  Owner
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                  MASTER SUITE
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                High-level multi-society governance, security scores, executive audit logs, system health &amp; hardware integrations.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-medium">
              <span>Owner Master Login</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Security Trust Indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End Encrypted Access</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Multi-Tenant Society Isolation</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>3-Attempt Intrusion Lockout Protection</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500 font-mono">
        SECURE 24 BY 7 • COMMERCIAL RESIDENTIAL GATE MANAGEMENT SYSTEM • PROTOCOL V4.2
      </footer>

      {/* Share / Chrome Guest Access Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 text-left relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Direct App Link for Chrome Guest / Sharing</h3>
                  <p className="text-xs text-slate-400">Ready to present or run in any clean Chrome Guest ID window</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* URL Display Box */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider block mb-1">
                  Short Link (Easy to type in Guest ID):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value="https://tinyurl.com/29xcwvxn"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono font-bold selection:bg-emerald-500 selection:text-white focus:outline-none"
                  />
                  <button
                    id="btn-copy-short-url"
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText("https://tinyurl.com/29xcwvxn");
                      soundEngine.playSuccessChime();
                      setCopied(true);
                      setTimeout(() => setCopied(false), 3000);
                    }}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950 flex items-center space-x-1.5 transition-all"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy Short Link'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider block mb-1">
                  Full Direct App URL:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={publicAppUrl}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-mono selection:bg-cyan-500 selection:text-white focus:outline-none"
                  />
                  <button
                    id="btn-copy-url-modal"
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-2.5 rounded-xl font-bold text-xs bg-cyan-700 hover:bg-cyan-600 text-white shadow-md shadow-cyan-950 flex items-center space-x-1.5 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Full</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick action: Open in New Tab */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-xs text-slate-400">
                Test the link directly in a clean browser window
              </div>
              <a
                href={publicAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Instructions for Chrome Guest Profile */}
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/40 space-y-2 text-xs">
              <span className="font-bold text-cyan-300 block font-mono">
                HOW TO RUN IN CHROME GUEST ID:
              </span>
              <ol className="list-decimal list-inside text-slate-300 space-y-1.5 leading-relaxed">
                <li>Click your profile icon in the top-right corner of Google Chrome.</li>
                <li>Select <strong>&quot;Guest&quot;</strong> (or press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono">Ctrl+Shift+N</kbd> for Incognito).</li>
                <li>Paste the copied link into the address bar and press Enter.</li>
                <li>The app starts instantly with zero setup or login hurdles.</li>
              </ol>
            </div>

            {/* Demo Quick Credentials Note */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">GUARD PIN</span>
                <span className="text-cyan-400 font-bold">1234</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">MANAGEMENT PIN</span>
                <span className="text-emerald-400 font-bold">9999</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">OWNER PIN</span>
                <span className="text-amber-400 font-bold">7777</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
