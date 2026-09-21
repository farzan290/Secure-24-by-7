import React, { useState } from 'react';
import {
  Shield,
  Building2,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Car,
  Copy,
  Check,
  ArrowLeft,
  Users,
  Sparkles,
  Bot,
  Send,
  Loader2,
  Share2
} from 'lucide-react';
import { Society, Gate, Guard, House, Vehicle, Role } from '../types';
import { api } from '../services/api';
import { soundEngine } from '../services/audio';

interface Props {
  society: Society;
  societies: Society[];
  onSelectSociety: (societyId: string) => void;
  onSelectRole: (role: Role) => void;
  onBackToHome: () => void;
  houses: House[];
  vehicles: Vehicle[];
  gates: Gate[];
  guards: Guard[];
}

export const SocietyPortalPage: React.FC<Props> = ({
  society,
  societies,
  onSelectSociety,
  onSelectRole,
  onBackToHome,
  houses,
  vehicles,
  gates,
  guards
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RESIDENTS' | 'GATES' | 'AI_SECURITY'>('OVERVIEW');
  const [residentSearch, setResidentSearch] = useState('');

  // AI Security Query State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiChatLog, setAiChatLog] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([
    {
      role: 'ai',
      text: `Hello! I am Secure AI for **${society.name}**. Ask me to verify any car number plate, resident house, or gate activity strictly for this society.`
    }
  ]);

  // Scoped entities for this society
  const socHouses = houses.filter(h => !h.societyId || h.societyId === society.id);
  const socVehicles = vehicles.filter(v => !v.societyId || v.societyId === society.id);
  const socGates = gates.filter(g => !g.societyId || g.societyId === society.id);
  const socGuards = guards.filter(g => !g.societyId || g.societyId === society.id);

  // Search filter for residents
  const filteredHouses = socHouses.filter(h =>
    h.ownerName.toLowerCase().includes(residentSearch.toLowerCase()) ||
    h.houseNumber.toLowerCase().includes(residentSearch.toLowerCase()) ||
    h.contactNumber.includes(residentSearch) ||
    (h.registeredPlates || []).some(p => p.toLowerCase().includes(residentSearch.toLowerCase()))
  );

  // Preferred public URL for this specific society
  const baseAppUrl = typeof window !== 'undefined'
    ? (window.location.origin.includes('ais-dev')
        ? window.location.origin.replace('ais-dev-', 'ais-pre-')
        : window.location.origin)
    : 'https://ais-pre-h24n4onpfwsw5imsrkogix-723147772528.asia-east1.run.app';

  const socUrlCode = society.id.replace('soc_', '');
  const societyDirectUrl = `${baseAppUrl}/?society=${socUrlCode}`;

  const handleCopyDirectLink = async () => {
    try {
      await navigator.clipboard.writeText(societyDirectUrl);
      soundEngine.playSuccessChime();
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = societyDirectUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      soundEngine.playSuccessChime();
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleAskAI = async (queryText?: string) => {
    const q = queryText || aiPrompt;
    if (!q.trim()) return;

    const userEntry = { role: 'user' as const, text: q };
    setAiChatLog(prev => [...prev, userEntry]);
    setAiPrompt('');
    setAiLoading(true);

    try {
      const res = await api.askAI(q, society.id, {
        clientSociety: society,
        clientHouses: socHouses,
        clientVehicles: socVehicles
      });
      setAiChatLog(prev => [...prev, { role: 'ai', text: res.answer }]);
      soundEngine.playSuccessChime();
    } catch {
      setAiChatLog(prev => [
        ...prev,
        {
          role: 'ai',
          text: `Secure AI response for ${society.name}: System active. Query could not be parsed at this moment.`
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Society Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1 text-xs"
            title="Return to Main Portal"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">All Societies</span>
          </button>

          <div className="h-6 w-px bg-slate-800" />

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white tracking-wide text-base sm:text-lg font-mono">
                {society.name}
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700">
                OFFICIAL PORTAL
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {society.city}, {society.provinceState} • Dedicated Security &amp; Access Page
            </p>
          </div>
        </div>

        {/* Quick Society Switcher & Share */}
        <div className="flex items-center space-x-3">
          {/* Society Selector Dropdown */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Switch Page:</span>
            <select
              value={society.id}
              onChange={e => onSelectSociety(e.target.value)}
              className="bg-transparent text-cyan-400 font-bold focus:outline-none cursor-pointer"
            >
              {societies.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          {/* Copy Direct Link Button */}
          <button
            type="button"
            onClick={handleCopyDirectLink}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              copied
                ? 'bg-emerald-900/80 border-emerald-500 text-emerald-200 shadow-md'
                : 'bg-cyan-950/70 border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/60'
            }`}
            title="Copy unique URL for this society to open in Chrome Guest ID"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Copy Society Link'}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Society Hero Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>GATED RESIDENTIAL COMMUNITY</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                {society.name}
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                {society.completeAddress || `${society.name}, ${society.city}, ${society.provinceState}`}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span>President / Owner: <strong className="text-slate-200">{society.ownerName}</strong></span>
                <span>•</span>
                <span>Management Secretariat: <strong className="text-slate-200">{society.managementContact}</strong></span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-slate-500 block text-[10px] font-mono uppercase">Residences</span>
                <span className="text-xl font-bold font-mono text-cyan-400">{socHouses.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-slate-500 block text-[10px] font-mono uppercase">Gates Online</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{socGates.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-slate-500 block text-[10px] font-mono uppercase">Guards</span>
                <span className="text-xl font-bold font-mono text-blue-400">{socGuards.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-slate-500 block text-[10px] font-mono uppercase">Security Score</span>
                <span className="text-xl font-bold font-mono text-amber-400">{society.securityScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Terminals - Enter Portals for this Specific Society */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Guard Portal */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Guard Security Terminal</h3>
              <p className="text-xs text-slate-400">
                Access boom barrier controls, live camera feeds, number plate verification, and guest clearances for {society.name}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectRole('GUARD')}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-cyan-950"
            >
              <Lock className="w-4 h-4" />
              <span>Launch Guard Portal (PIN 1234)</span>
            </button>
          </div>

          {/* 2. Management Portal */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Society Management</h3>
              <p className="text-xs text-slate-400">
                Add and manage residents, vehicle number plates, guard shifts, and generate security compliance reports for {society.name}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectRole('MANAGEMENT')}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Enter Portal (PIN 9999)</span>
            </button>
          </div>

          {/* 3. Owner Portal */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-700/50 flex items-center justify-center text-amber-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Executive Ownership</h3>
              <p className="text-xs text-slate-400">
                Review executive security audit logs, resident rosters, emergency triggers, and multi-gate oversight for {society.name}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectRole('OWNER')}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-amber-950"
            >
              <Lock className="w-4 h-4" />
              <span>Launch Owner Portal (PIN 7777)</span>
            </button>
          </div>
        </div>

        {/* Page View Tabs */}
        <div className="flex border-b border-slate-800 space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2.5 text-xs font-bold font-mono tracking-wider border-b-2 transition-all ${
              activeTab === 'OVERVIEW'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            SOCIETY INTELLIGENCE &amp; AI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RESIDENTS')}
            className={`px-4 py-2.5 text-xs font-bold font-mono tracking-wider border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'RESIDENTS'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>RESIDENTS &amp; VEHICLE PLATES</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px]">
              {socHouses.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('GATES')}
            className={`px-4 py-2.5 text-xs font-bold font-mono tracking-wider border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'GATES'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>GATES &amp; GUARDS</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px]">
              {socGates.length}
            </span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & AI SECURITY TERMINAL */}
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* AI Security Query Assistant for this Society */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-600/50 flex items-center justify-center text-cyan-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">
                      Secure AI — {society.name} Intelligence
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Zero-hallucination security assistant strictly scoped to this society
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  TENANT ISOLATED
                </span>
              </div>

              {/* Chat Log */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {aiChatLog.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-cyan-950/60 border border-cyan-800 text-cyan-100 ml-8'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 mr-4'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 font-mono text-[10px] font-bold">
                      {msg.role === 'user' ? (
                        <span className="text-cyan-400">YOU (SECURITY QUERY)</span>
                      ) : (
                        <span className="text-emerald-400 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" />
                          <span>SECURE AI ({society.name.toUpperCase()})</span>
                        </span>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span>Analyzing {society.name} resident plates &amp; gate records...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleAskAI(`Is plate ${socHouses[0]?.registeredPlates?.[0] || 'ABC-123'} of a resident or someone else?`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-mono"
                >
                  Verify Plate {socHouses[0]?.registeredPlates?.[0] || 'ABC-123'}
                </button>
                <button
                  type="button"
                  onClick={() => handleAskAI('Is plate SUS-999 a resident or someone else?')}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-mono"
                >
                  Check Suspicious Plate
                </button>
                <button
                  type="button"
                  onClick={() => handleAskAI('What is the official registered name of our society?')}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-mono"
                >
                  Confirm Society Name
                </button>
              </div>

              {/* AI Query Input */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleAskAI();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder={`Ask about cars, residents, or gates in ${society.name}...`}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs uppercase flex items-center space-x-1.5 shadow-md shadow-cyan-950"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ask AI</span>
                </button>
              </form>
            </div>

            {/* Society Contact & Direct Link Card */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>Shareable Link for Chrome Guest ID</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You can copy and send this URL to view this exact society in Chrome Guest ID or on another device without any setup issues:
                </p>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-cyan-300 truncate select-all">
                    {societyDirectUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyDirectLink}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex-shrink-0"
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emergency Police:</span>
                    <span className="font-mono font-bold text-red-400">{society.emergencyContacts?.police || '15'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ambulance / Rescue:</span>
                    <span className="font-mono font-bold text-emerald-400">{society.emergencyContacts?.ambulance || '1122'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Security Chief:</span>
                    <span className="font-mono font-bold text-cyan-400">{society.emergencyContacts?.securityChief || '+92-300-9988771'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Management Secretariat:</span>
                    <span className="font-mono font-bold text-slate-200">{society.managementContact}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RESIDENTS & VEHICLE PLATES DIRECTORY */}
        {activeTab === 'RESIDENTS' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={residentSearch}
                  onChange={e => setResidentSearch(e.target.value)}
                  placeholder="Search by resident name, villa, phone, or plate number..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Showing <strong>{filteredHouses.length}</strong> of {socHouses.length} Verified Residences
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHouses.map(house => (
                <div
                  key={house.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-cyan-400 text-sm block">
                        {house.houseNumber}
                      </span>
                      <span className="text-white font-semibold text-sm">
                        {house.ownerName}
                      </span>
                      <span className="text-xs text-slate-400 block">
                        {house.block} • {house.street}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold">
                      VERIFIED
                    </span>
                  </div>

                  {/* Registered Vehicle Plates */}
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">
                      Registered Number Plates
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {house.registeredPlates && house.registeredPlates.length > 0 ? (
                        house.registeredPlates.map(plate => (
                          <span
                            key={plate}
                            className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-xs border border-slate-700 flex items-center space-x-1"
                          >
                            <Car className="w-3 h-3 text-cyan-400" />
                            <span>{plate}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 italic">No plates on file</span>
                      )}
                    </div>
                  </div>

                  {/* Contact Phone & Direct Action */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center space-x-1 text-slate-300 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{house.contactNumber}</span>
                    </div>
                    <a
                      href={`tel:${house.contactNumber}`}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-[11px] flex items-center space-x-1"
                    >
                      <span>Call Resident</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GATES & GUARDS */}
        {activeTab === 'GATES' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socGates.map(gate => (
                <div
                  key={gate.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm font-mono">{gate.name}</h4>
                      <p className="text-xs text-slate-400">{gate.location}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[10px] font-bold">
                      {gate.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">BARRIER</span>
                      <span className={`font-mono font-bold ${gate.barrierState === 'OPEN' ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {gate.barrierState}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">CAMERA</span>
                      <span className="font-mono font-bold text-emerald-400">ONLINE</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">ENTERED TODAY</span>
                      <span className="font-mono font-bold text-cyan-400">{gate.vehiclesEnteredToday || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Guards on Duty */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="font-bold text-white text-sm font-mono flex items-center space-x-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Security Guards Assigned to {society.name} ({socGuards.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {socGuards.map(guard => (
                  <div key={guard.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-xs">{guard.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">{guard.badgeNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>Shift: {guard.shift}</span>
                      <span className="text-emerald-400 font-bold">{guard.dutyStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
