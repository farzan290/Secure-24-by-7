import React, { useState, useRef, useEffect } from 'react';
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
  Check,
  Search,
  Plus,
  MapPin,
  Sparkles,
  X,
  CheckCircle,
  MessageSquare,
  Globe,
  Languages
} from 'lucide-react';
import { Role, Society } from '../types';
import { soundEngine } from '../services/audio';
import {
  useLanguage,
  SUPPORTED_LANGUAGES,
  SUPPORTED_COUNTRIES,
  LanguageCode
} from '../services/i18n';

interface PresetSociety {
  name: string;
  city: string;
  provinceState: string;
}

// Presets list - kept empty by default so user only sees their own three societies without Emerald or Bahria
const PRESET_SOCIETIES: PresetSociety[] = [];

interface Props {
  onSelectRole: (role: Role) => void;
  activeSociety: Society;
  societies: Society[];
  onSelectSociety: (societyId: string) => void;
  onAddSociety: (newSociety: Society) => void;
  onViewSocietyPage?: (societyId: string) => void;
  onOpenEmergency: () => void;
  isAmbientPlaying: boolean;
  onToggleAmbient: () => void;
  networkStatus: 'ONLINE' | 'WEAK' | 'OFFLINE';
}

export const RoleSelectScreen: React.FC<Props> = ({
  onSelectRole,
  activeSociety,
  societies,
  onSelectSociety,
  onAddSociety,
  onViewSocietyPage,
  onOpenEmergency,
  isAmbientPlaying,
  onToggleAmbient,
  networkStatus
}) => {
  const { language, languageOption, country, setLanguage, setCountryByCode, t, tr } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Society Search & Autocomplete State
  const [searchQuery, setSearchQuery] = useState(activeSociety ? tr(activeSociety.name) : '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSocietyConfirmed, setIsSocietyConfirmed] = useState(true);
  const [mgmtLockedWarning, setMgmtLockedWarning] = useState<string | null>(null);

  // New Society Creation Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomCity, setNewCustomCity] = useState('');
  const [newCustomProvince, setNewCustomProvince] = useState('');
  const [newCustomAddress, setNewCustomAddress] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep search query synced with active society and active language
  useEffect(() => {
    if (activeSociety) {
      setSearchQuery(tr(activeSociety.name));
      setIsSocietyConfirmed(true);
    }
  }, [activeSociety?.id, language]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter matching existing societies and preset suggestions based on what is typed
  const trimmedQuery = searchQuery.trim().toLowerCase();

  const matchingExisting = societies.filter(s =>
    trimmedQuery
      ? s.name.toLowerCase().includes(trimmedQuery) ||
        tr(s.name).toLowerCase().includes(trimmedQuery)
      : true
  );

  const matchingPresets = PRESET_SOCIETIES.filter(p =>
    trimmedQuery
      ? p.name.toLowerCase().includes(trimmedQuery) &&
        !societies.some(s => s.name.toLowerCase() === p.name.toLowerCase())
      : !societies.some(s => s.name.toLowerCase() === p.name.toLowerCase())
  ).slice(0, 6);

  const isExactMatch = societies.some(
    s =>
      s.name.toLowerCase() === trimmedQuery ||
      tr(s.name).toLowerCase() === trimmedQuery
  );

  // Handle selecting an existing society
  const handleSelectExisting = (soc: Society) => {
    onSelectSociety(soc.id);
    setSearchQuery(tr(soc.name));
    setIsSocietyConfirmed(true);
    setMgmtLockedWarning(null);
    setIsDropdownOpen(false);
    soundEngine.playSuccessChime();
  };

  // Handle selecting a preset suggestion
  const handleSelectPreset = (preset: PresetSociety) => {
    const existing = societies.find(
      s => s.name.toLowerCase() === preset.name.toLowerCase() ||
      (preset.name.toLowerCase().includes('aeechs') && (s.id === 'soc_aeechs' || s.name.toLowerCase().includes('aeechs')))
    );
    if (existing) {
      handleSelectExisting(existing);
      return;
    }

    const newSoc: Society = {
      id: preset.name.toLowerCase().includes('aeechs') ? 'soc_aeechs' : `soc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: preset.name,
      provinceState: preset.provinceState,
      city: preset.city,
      country: 'Pakistan',
      continent: 'Asia',
      completeAddress: `${preset.name}, Main Boulevard`,
      houseCount: 120,
      gateCount: 2,
      guardCount: 6,
      emergencyContacts: {
        police: '15',
        fire: '16',
        ambulance: '1122',
        securityChief: '+92-300-1122334'
      },
      managementContact: '+92-21-34567890 (Direct Desk)',
      ownerName: 'Executive Directorate',
      securityScore: 92,
      securityStatus: 'EXCELLENT'
    };
    onAddSociety(newSoc);
    setSearchQuery(newSoc.name);
    setIsSocietyConfirmed(true);
    setMgmtLockedWarning(null);
    setIsDropdownOpen(false);
  };

  // Open modal to register a completely new custom society
  const handleOpenAddCustomModal = (presetName?: string) => {
    const initialName = presetName || searchQuery.trim();
    setNewCustomName(initialName);
    setNewCustomCity('Metropolis');
    setNewCustomProvince('Federal District');
    setNewCustomAddress(initialName ? `${initialName} Main Boulevard` : '');
    setShowNewModal(true);
    setIsDropdownOpen(false);
  };

  // Confirm and create custom society
  const handleConfirmAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomName.trim()) return;

    const trimmed = newCustomName.trim();
    const existing = societies.find(
      s => s.name.toLowerCase() === trimmed.toLowerCase() ||
      (trimmed.toLowerCase().includes('aeechs') && (s.id === 'soc_aeechs' || s.name.toLowerCase().includes('aeechs')))
    );
    if (existing) {
      handleSelectExisting(existing);
      setShowNewModal(false);
      return;
    }

    const newSoc: Society = {
      id: trimmed.toLowerCase().includes('aeechs') ? 'soc_aeechs' : `soc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      provinceState: newCustomProvince.trim() || 'Federal District',
      city: newCustomCity.trim() || 'Metropolis',
      country: country.name,
      continent: country.continent,
      completeAddress: newCustomAddress.trim() || `${trimmed}, Main Avenue`,
      houseCount: 95,
      gateCount: 2,
      guardCount: 6,
      emergencyContacts: {
        police: country.emergencyContacts.police,
        fire: country.emergencyContacts.fire,
        ambulance: country.emergencyContacts.ambulance,
        securityChief: `${country.dialCode}-300-5544332`
      },
      managementContact: `${country.dialCode}-21-39887766 (Security Office)`,
      ownerName: 'Board of Governors',
      securityScore: 90,
      securityStatus: 'EXCELLENT'
    };

    onAddSociety(newSoc);
    setSearchQuery(newSoc.name);
    setIsSocietyConfirmed(true);
    setMgmtLockedWarning(null);
    setShowNewModal(false);
    soundEngine.playSuccessChime();
  };

  // Role click: selection of portals
  const handleRoleClick = (role: Role) => {
    setMgmtLockedWarning(null);
    onSelectRole(role);
  };

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
    <div
      dir={languageOption.dir}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white relative overflow-hidden"
    >
      {/* Background visual security grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/30 border border-cyan-400/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wider text-slate-100 text-lg uppercase font-mono">
                {t.appTitle}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                {country.flag} {country.name} • {languageOption.nativeName}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium truncate max-w-xs md:max-w-md">
              {tr(activeSociety.name)} • {tr(activeSociety.city)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Header Country Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs">
            <Globe className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <select
              id="header-country-select"
              aria-label={t.selectCountry}
              value={country.code}
              onChange={(e) => {
                setCountryByCode(e.target.value, false);
                soundEngine.playSuccessChime();
              }}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
            >
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                  {c.flag} {c.name} ({c.dialCode})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Header Language Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-cyan-700/60 rounded-lg px-2.5 py-1.5 text-xs">
            <Languages className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <select
              id="header-language-select"
              aria-label={t.selectLanguage}
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value as LanguageCode);
                soundEngine.playSuccessChime();
              }}
              className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.flag} {l.name} — {l.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* View Dedicated Society Page */}
          {onViewSocietyPage && (
            <button
              id="btn-view-society-page"
              onClick={() => onViewSocietyPage(activeSociety.id)}
              className="px-3 py-2 rounded-lg border border-emerald-700/80 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 text-xs font-medium flex items-center space-x-1.5 transition-all shadow-sm"
              title={`Open separate dedicated page for ${activeSociety.name}`}
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline font-semibold">{t.separateSocietyPage}</span>
            </button>
          )}

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
              <span className="hidden sm:inline text-xs font-semibold leading-tight">{t.securityMusic}</span>
              <span className="hidden sm:inline text-[9px] font-mono text-cyan-400/80 leading-none">
                {isAmbientPlaying ? t.musicActive : t.muted}
              </span>
            </div>
          </button>

          {/* Network Status Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${
              networkStatus === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`} />
            <span className="text-slate-300 font-mono">
              {networkStatus === 'ONLINE' ? t.systemOnline : t.weakNetwork}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-6 py-10 flex-1 flex flex-col justify-center items-center text-center">
        {/* Title & Subtitle */}
        <div className="mb-7 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 mb-4 shadow-sm">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>{t.heroBadge}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 font-mono">
            {t.heroTitle}
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-medium">
            {t.heroSubtitle}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {t.heroInstruction}
          </p>
        </div>

        {/* INTERNATIONAL COUNTRY & 7-LANGUAGE SELECTION PANEL ON MAIN DASHBOARD */}
        <div
          id="dashboard-country-language-panel"
          className="w-full max-w-4xl mb-6 bg-slate-900/90 border border-cyan-800/60 hover:border-cyan-600/70 rounded-2xl p-5 shadow-xl backdrop-blur-md text-left transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-800/80">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/90 border border-cyan-600/50 flex items-center justify-center text-cyan-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <span>{t.localizationTitle}</span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-700/50">
                    7 LANGUAGES
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.localizationSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-700/50 px-3 py-1.5 rounded-lg self-start sm:self-center">
              <span>{country.flag} {country.name} ({country.dialCode})</span>
              <span>•</span>
              <span>{languageOption.flag} {languageOption.nativeName}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Country Selector Dropdown */}
            <div className="md:col-span-4">
              <label
                htmlFor="main-country-select"
                className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5 font-semibold"
              >
                {t.countryLabel}
              </label>
              <div className="relative">
                <select
                  id="main-country-select"
                  value={country.code}
                  onChange={(e) => {
                    setCountryByCode(e.target.value, true);
                    soundEngine.playSuccessChime();
                  }}
                  className="w-full bg-slate-950 border border-slate-700 hover:border-cyan-500/70 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none transition-colors cursor-pointer"
                >
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                      {c.flag} {c.name} ({c.nativeName}) — {c.dialCode}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 7 International Languages Interactive Selector Buttons */}
            <div className="md:col-span-8">
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5 font-semibold">
                {t.selectLanguage}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      id={`lang-btn-${lang.code}`}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code);
                        soundEngine.playSuccessChime();
                      }}
                      className={`px-2.5 py-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-cyan-600/25 border-cyan-400 text-white shadow-md shadow-cyan-950/60'
                          : 'bg-slate-950/90 border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-sm leading-none mb-1">{lang.flag}</span>
                      <span className="text-[11px] font-bold leading-tight block truncate max-w-full">
                        {lang.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-cyan-300/90 font-medium leading-tight block truncate max-w-full">
                        {lang.nativeName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SOCIETY NAME SELECTION & REGISTRATION COMPONENT */}
        <div className="w-full max-w-4xl mb-8 bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md text-left transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-600/50 flex items-center justify-center text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 flex-wrap">
                  <span>{t.societySelectionTitle}</span>
                  <span className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700/40">
                    {t.requiredForManagement}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.societySelectionDesc}
                </p>
              </div>
            </div>

            {/* Quick Button to Add New Society */}
            <button
              id="btn-add-new-society-top"
              type="button"
              onClick={() => handleOpenAddCustomModal()}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase flex items-center space-x-1.5 shadow-md shadow-emerald-950 transition-all self-start sm:self-center"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.registerNewSociety}</span>
            </button>
          </div>

          {/* Search Input & Autocomplete Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="society-input-field"
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    if (!e.target.value.trim()) {
                      setIsSocietyConfirmed(false);
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder={t.searchSocietyPlaceholder}
                  className={`w-full bg-slate-950 border rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 font-medium focus:outline-none transition-all ${
                    mgmtLockedWarning
                      ? 'border-amber-500 ring-2 ring-amber-500/30'
                      : isSocietyConfirmed
                      ? 'border-emerald-500/80 focus:border-emerald-400'
                      : 'border-slate-700 focus:border-cyan-500'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSocietyConfirmed(false);
                      setIsDropdownOpen(true);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Button: Confirm Society */}
              <button
                type="button"
                onClick={() => {
                  if (!searchQuery.trim()) {
                    setMgmtLockedWarning('Please type a society name to continue.');
                    return;
                  }
                  const found = societies.find(s => s.name.toLowerCase() === searchQuery.trim().toLowerCase());
                  if (found) {
                    handleSelectExisting(found);
                  } else {
                    const preset = PRESET_SOCIETIES.find(p => p.name.toLowerCase() === searchQuery.trim().toLowerCase());
                    if (preset) {
                      handleSelectPreset(preset);
                    } else {
                      handleOpenAddCustomModal(searchQuery.trim());
                    }
                  }
                }}
                className="px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase flex items-center space-x-1.5 shadow-md shadow-cyan-950 transition-all whitespace-nowrap"
              >
                <Check className="w-4 h-4" />
                <span>{t.confirmSociety}</span>
              </button>
            </div>

            {/* Predictive Autocomplete Dropdown List */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-800/80">
                {/* Custom Add Option if typed text is unique */}
                {trimmedQuery && !isExactMatch && (
                  <button
                    type="button"
                    onClick={() => handleOpenAddCustomModal(searchQuery.trim())}
                    className="w-full px-4 py-3 bg-cyan-950/40 hover:bg-cyan-900/60 text-left flex items-center justify-between text-xs text-cyan-300 transition-colors group"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-md bg-cyan-600 flex items-center justify-center text-white">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold block text-white group-hover:text-cyan-200">
                          {t.registerNewSociety}: &ldquo;{searchQuery.trim()}&rdquo;
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {t.provisionStarterDesc}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-900/80 text-cyan-300 border border-cyan-700/50">
                      {t.createNewBadge}
                    </span>
                  </button>
                )}

                {/* Section Header: Matching Registered Societies */}
                {matchingExisting.length > 0 && (
                  <div className="px-3 py-1.5 bg-slate-950/80 text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                    <span>{t.registeredSocieties} ({matchingExisting.length})</span>
                    <span className="text-emerald-400">{t.readyToConnect}</span>
                  </div>
                )}
                {matchingExisting.map((soc) => (
                  <button
                    key={soc.id}
                    type="button"
                    onClick={() => handleSelectExisting(soc)}
                    className={`w-full px-4 py-2.5 text-left text-xs flex items-center justify-between transition-colors ${
                      activeSociety?.id === soc.id
                        ? 'bg-emerald-950/40 text-emerald-300'
                        : 'hover:bg-slate-800/80 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Building2 className={`w-4 h-4 ${activeSociety?.id === soc.id ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <div>
                        <span className="font-bold block text-white">{tr(soc.name)}</span>
                        <span className="text-[10px] text-slate-400">
                          {tr(soc.city)} • {soc.houseCount} {t.housesCountLabel} • {soc.gateCount} {t.gatesCountLabel}
                        </span>
                      </div>
                    </div>
                    {activeSociety?.id === soc.id ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 border border-emerald-700">
                        {t.activeBadge}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 group-hover:text-slate-200">
                        {t.selectAction}
                      </span>
                    )}
                  </button>
                ))}

                {/* Section Header: Relevant Suggestions / Presets */}
                {matchingPresets.length > 0 && (
                  <div className="px-3 py-1.5 bg-slate-950/80 text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Suggested Gated Communities</span>
                  </div>
                )}
                {matchingPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full px-4 py-2.5 hover:bg-slate-800/80 text-left text-xs text-slate-200 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <div>
                        <span className="font-bold block text-slate-100">{preset.name}</span>
                        <span className="text-[10px] text-slate-400">{preset.city}, {preset.provinceState}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      + Add &amp; Link
                    </span>
                  </button>
                ))}

                {matchingExisting.length === 0 && matchingPresets.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No exact match found. Click &ldquo;{t.registerNewSociety}&rdquo; above to create it.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Filter / Society Quick Pick Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400 font-mono">{t.yourSocieties}</span>
            {societies.map((soc) => (
              <button
                key={soc.id}
                type="button"
                onClick={() => handleSelectExisting(soc)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeSociety?.id === soc.id
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/80 shadow-sm'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {tr(soc.name)}
              </button>
            ))}
          </div>

          {/* Management Lock Warning Notification */}
          {mgmtLockedWarning && (
            <div className="mt-4 p-3 rounded-xl bg-amber-950/70 border border-amber-500/80 text-amber-200 text-xs flex items-center space-x-2.5 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{mgmtLockedWarning}</span>
            </div>
          )}

          {/* Active Society Confirmation Badge */}
          {isSocietyConfirmed && activeSociety && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-emerald-400 font-mono">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-bold">{t.verifiedSociety}</span>
                <span className="text-white font-sans font-bold">{tr(activeSociety.name)}</span>
                <span className="text-slate-400 text-[11px]">({tr(activeSociety.city)}, {tr(activeSociety.provinceState || country.name)})</span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-300 font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">{activeSociety.gateCount || 2} {t.gatesCountLabel}</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">{activeSociety.houseCount || 100}+ {t.housesCountLabel}</span>
                {onViewSocietyPage && (
                  <button
                    type="button"
                    onClick={() => onViewSocietyPage(activeSociety.id)}
                    className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-sans font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-cyan-950 transition-all ml-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{t.viewSocietyPageBtn}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4 Professional Role Cards including RMP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-6xl">
          {/* 1. Security Guard */}
          <button
            id="role-guard-card"
            onClick={() => handleRoleClick('GUARD')}
            className="group relative bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/80 rounded-2xl p-6 text-left transition-all duration-200 shadow-xl shadow-slate-950/50 hover:shadow-cyan-950/40 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-cyan-400">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-1 gap-2">
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {t.guardRoleTitle}
                </h3>
                <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  {t.guardRoleBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {t.guardRoleDesc}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400 font-medium">
              <span>{t.guardRoleCta}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 2. Society Management */}
          <button
            id="role-management-card"
            onClick={() => handleRoleClick('MANAGEMENT')}
            className="group relative rounded-2xl p-6 text-left transition-all duration-200 shadow-xl flex flex-col justify-between bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/80 shadow-slate-950/50 hover:shadow-blue-950/40 cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-700/50 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-blue-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-1 gap-2">
                <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                  {t.mgmtRoleTitle}
                </h3>
                <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 flex items-center space-x-1">
                  <Building2 className="w-2.5 h-2.5 text-blue-400" />
                  <span>{t.mgmtRoleBadge}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {t.mgmtRoleDesc}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-blue-400">
              <span className="font-semibold flex items-center space-x-1.5">
                <Lock className="w-3 h-3 text-blue-400" />
                <span>{t.mgmtRoleCta}</span>
              </span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 3. Owner */}
          <button
            id="role-owner-card"
            onClick={() => handleRoleClick('OWNER')}
            className="group relative bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/80 rounded-2xl p-6 text-left transition-all duration-200 shadow-xl shadow-slate-950/50 hover:shadow-amber-950/40 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-amber-400">
                <Crown className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-1 gap-2">
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  {t.ownerRoleTitle}
                </h3>
                <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                  {t.ownerRoleBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {t.ownerRoleDesc}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-medium">
              <span>{t.ownerRoleCta}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* 4. RMP — Resident Messages Portal */}
          <button
            id="role-rmp-card"
            onClick={() => handleRoleClick('RMP')}
            className="group relative bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/80 rounded-2xl p-6 text-left transition-all duration-200 shadow-xl shadow-slate-950/50 hover:shadow-purple-950/40 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-purple-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-1 gap-2">
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                  {t.rmpRoleTitle}
                </h3>
                <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                  {t.rmpRoleBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {t.rmpRoleDesc}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-purple-400 font-medium">
              <span>{t.rmpRoleCta}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Security Trust Indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.trustEncrypted}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.trustMultiTenant}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.trustLockout}</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500 font-mono">
        {t.footerText}
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

      {/* REGISTER NEW SOCIETY MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-left relative animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center text-emerald-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">{t.modalRegisterTitle}</h3>
                <p className="text-xs text-slate-400">
                  {t.modalRegisterSubtitle}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmAddCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase">
                  {t.societyNameField}
                </label>
                <input
                  type="text"
                  required
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  placeholder="e.g. Falcon Crest Royal Villas"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase">
                    {t.cityField}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomCity}
                    onChange={(e) => setNewCustomCity(e.target.value)}
                    placeholder="e.g. Islamabad"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase">
                    {t.provinceField}
                  </label>
                  <input
                    type="text"
                    value={newCustomProvince}
                    onChange={(e) => setNewCustomProvince(e.target.value)}
                    placeholder="e.g. Capital Territory"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase">
                  {t.addressField}
                </label>
                <input
                  type="text"
                  value={newCustomAddress}
                  onChange={(e) => setNewCustomAddress(e.target.value)}
                  placeholder="e.g. Sector F-7, Main Avenue, Islamabad"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium placeholder-slate-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-cyan-900/30 text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-cyan-300 block font-mono">{t.autoProvisionTitle}</span>
                <p>{t.autoProvision1}</p>
                <p>{t.autoProvision2}</p>
                <p>{t.autoProvision3}</p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase flex items-center space-x-2 shadow-lg shadow-emerald-950 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.registerAndConnectBtn}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
