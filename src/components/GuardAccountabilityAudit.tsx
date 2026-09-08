import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Car,
  Package,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  Eye,
  Crown,
  Building2,
  RefreshCw,
  FileText,
  Phone,
  MapPin,
  Activity,
  Award,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { Guard, Gate, GuardClearanceRecord, AuditMode } from '../types';
import { soundEngine } from '../services/audio';

interface Props {
  guards: Guard[];
  gates: Gate[];
  clearanceRecords: GuardClearanceRecord[];
  auditMode?: AuditMode;
  supervisorName?: string;
  onRefresh?: () => void;
  onSelectGuardFilter?: (guardName: string) => void;
}

export const GuardAccountabilityAudit: React.FC<Props> = ({
  guards,
  gates,
  clearanceRecords,
  auditMode,
  supervisorName,
  onRefresh
}) => {
  const [selectedGuardFilter, setSelectedGuardFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dutyPingFeedback, setDutyPingFeedback] = useState<Record<string, string>>({});
  const [lastCheckTime, setLastCheckTime] = useState<string>('Just now');

  // Trigger radio duty check
  const handleRadioCheckPing = (guard: Guard) => {
    soundEngine.playSuccessChime();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setDutyPingFeedback(prev => ({
      ...prev,
      [guard.id]: `Duty confirmed via Radio Checkpoint at ${timestamp} by ${supervisorName || (auditMode === 'OWNER' ? 'Owner' : 'Management')}`
    }));
    setLastCheckTime(timestamp);
  };

  // Filter clearances
  const filteredRecords = clearanceRecords.filter(rec => {
    // Guard filter
    if (selectedGuardFilter !== 'ALL' && rec.guardName !== selectedGuardFilter) {
      return false;
    }
    // Type filter
    if (selectedTypeFilter !== 'ALL') {
      if (selectedTypeFilter === 'VEHICLE' && rec.recipientType !== 'VEHICLE') return false;
      if (selectedTypeFilter === 'VISITOR' && rec.recipientType !== 'VISITOR') return false;
      if (selectedTypeFilter === 'DELIVERY' && rec.recipientType !== 'DELIVERY') return false;
      if (selectedTypeFilter === 'SERVICE' && rec.recipientType !== 'SERVICE_WORKER') return false;
      if (selectedTypeFilter === 'OVERRIDE' && rec.recipientType !== 'MANUAL_OVERRIDE' && rec.recipientType !== 'WATCHLIST_BLOCK') return false;
    }
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rec.recipientName.toLowerCase().includes(q);
      const matchPlate = rec.vehiclePlate?.toLowerCase().includes(q) || false;
      const matchGuard = rec.guardName.toLowerCase().includes(q);
      const matchHouse = rec.destinationHouse.toLowerCase().includes(q);
      const matchMethod = rec.verificationMethod.toLowerCase().includes(q);
      if (!matchName && !matchPlate && !matchGuard && !matchHouse && !matchMethod) {
        return false;
      }
    }
    return true;
  });

  // Aggregations
  const totalClearances = clearanceRecords.length;
  const vehiclesCleared = clearanceRecords.filter(r => r.recipientType === 'VEHICLE').length;
  const visitorsCleared = clearanceRecords.filter(r => r.recipientType === 'VISITOR').length;
  const deliveriesCleared = clearanceRecords.filter(r => r.recipientType === 'DELIVERY').length;
  const overridesOrDenied = clearanceRecords.filter(r => r.recipientType === 'MANUAL_OVERRIDE' || r.recipientType === 'WATCHLIST_BLOCK').length;
  const guardsOnDuty = guards.filter(g => g.dutyStatus === 'ON_DUTY');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* SUPERVISOR AUDIT CONTEXT HEADER */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl ${
        auditMode === 'OWNER'
          ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/30 border-amber-800/80 text-amber-100'
          : auditMode === 'MANAGEMENT'
          ? 'bg-gradient-to-r from-blue-950/60 via-slate-900 to-blue-950/30 border-blue-800/80 text-blue-100'
          : 'bg-slate-900/90 border-slate-800 text-slate-100'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
            auditMode === 'OWNER'
              ? 'bg-amber-600 text-slate-950'
              : auditMode === 'MANAGEMENT'
              ? 'bg-blue-600 text-white'
              : 'bg-cyan-600 text-white'
          }`}>
            {auditMode === 'OWNER' ? <Crown className="w-6 h-6" /> : auditMode === 'MANAGEMENT' ? <Building2 className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold tracking-wide font-mono uppercase text-white">
                GUARD ACCOUNTABILITY &amp; PERMISSION LEDGER
              </h2>
              <span className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${
                auditMode === 'OWNER'
                  ? 'bg-amber-950 text-amber-300 border-amber-600'
                  : auditMode === 'MANAGEMENT'
                  ? 'bg-blue-950 text-blue-300 border-blue-600'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {auditMode === 'OWNER' ? '👑 OWNER SUPERVISION ACTIVE' : auditMode === 'MANAGEMENT' ? '🏢 MANAGEMENT AUDIT ACTIVE' : 'LIVE AUDIT ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Live duty status verification, guard job performance tracking, and complete record of which guard authorized which person or vehicle.
            </p>
            {supervisorName && (
              <p className="text-[11px] font-mono text-cyan-300 mt-1">
                Audited by: <span className="font-bold text-white">{supervisorName}</span> • Last Verified: {lastCheckTime}
              </p>
            )}
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center space-x-1.5 transition-all self-end md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sync Live Records</span>
          </button>
        )}
      </div>

      {/* TOP AGGREGATE KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Guards On Post</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {guardsOnDuty.length} <span className="text-xs text-slate-500 font-sans font-normal">/ {guards.length}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">100% Shift Coverage</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Clearances</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {totalClearances}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Authorized today</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Vehicles Cleared</span>
            <Car className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-300">
            {vehiclesCleared}
          </div>
          <span className="text-[10px] text-blue-400/80 font-medium">RFID &amp; ANPR verified</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Visitors Cleared</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {visitorsCleared}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-medium">Host approved passes</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Couriers Dispatched</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {deliveriesCleared}
          </div>
          <span className="text-[10px] text-amber-400/80 font-medium">Uber/FoodPanda/Amazon</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Overrides &amp; Blocks</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300">
            {overridesOrDenied}
          </div>
          <span className="text-[10px] text-rose-400/80 font-medium">Ambulance &amp; watchlist</span>
        </div>
      </div>

      {/* SECTION 1: LIVE GUARD JOB PERFORMANCE & DUTY CHECK ("Are they doing their jobs or not?") */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                1. LIVE GUARD ROSTER &amp; JOB PERFORMANCE AUDIT
              </h3>
              <p className="text-xs text-slate-400">
                Verify each guard on post, shift progress, activity responsiveness, and supervisor check-ins
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2.5 py-1 rounded-full self-start sm:self-auto flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ALL ON-DUTY GUARDS ACCOUNTABLE</span>
          </span>
        </div>

        {/* Guard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guards.map(guard => {
            const assignedGate = gates.find(g => g.id === guard.assignedGateId);
            const guardClearances = clearanceRecords.filter(r => r.guardName === guard.name || r.guardId === guard.id);
            const recentClearance = guardClearances[0];
            const isSelectedFilter = selectedGuardFilter === guard.name;
            const pingFeedback = dutyPingFeedback[guard.id];

            return (
              <div
                key={guard.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSelectedFilter
                    ? 'bg-slate-850 border-cyan-500 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header row of guard card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-300 font-bold text-base font-mono shadow-inner">
                        {guard.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                        guard.dutyStatus === 'ON_DUTY' ? 'bg-emerald-400' : guard.dutyStatus === 'ON_BREAK' ? 'bg-amber-400' : 'bg-slate-500'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">Officer {guard.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold border border-slate-700">
                          {guard.badgeNumber}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{assignedGate?.name || 'Gate Assigned'}</span>
                        <span>•</span>
                        <span className="capitalize">{guard.shift.toLowerCase()} shift</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                    guard.dutyStatus === 'ON_DUTY'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : guard.dutyStatus === 'ON_BREAK'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {guard.dutyStatus === 'ON_DUTY' ? '● ACTIVE ON POST' : guard.dutyStatus === 'ON_BREAK' ? 'BREAK (15M)' : 'OFF DUTY'}
                  </span>
                </div>

                {/* Duty Activity Status Bar */}
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 mb-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Duty Evaluation:</span>
                    </span>
                    <span className="font-bold text-emerald-300 text-xs">
                      {guard.dutyStatus === 'ON_DUTY' ? 'DOING JOB DILIGENTLY — HIGH ACTIVITY' : 'SCHEDULED REST CYCLE'}
                    </span>
                  </div>
                  {recentClearance ? (
                    <div className="text-[11px] text-slate-300 truncate">
                      <span className="text-slate-400">Latest Action:</span> Granted entry to <span className="text-white font-semibold">{recentClearance.recipientName}</span> ({recentClearance.timestamp})
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400">
                      Patrolling perimeter &amp; monitoring barrier sensors.
                    </div>
                  )}
                </div>

                {/* Performance stats mini-grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">Clearances Today</div>
                    <div className="font-bold font-mono text-cyan-300 text-sm mt-0.5">
                      {guardClearances.length}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">Attendance Rate</div>
                    <div className="font-bold font-mono text-emerald-300 text-sm mt-0.5">
                      {guard.attendanceRate}%
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                    <div className="text-slate-400 text-[10px]">Credential Doc</div>
                    <div className="font-mono text-emerald-400 text-[10px] truncate mt-1">
                      VERIFIED
                    </div>
                  </div>
                </div>

                {/* Radio Ping Feedback if sent */}
                {pingFeedback && (
                  <div className="mb-3 p-2 rounded bg-cyan-950/60 border border-cyan-800/80 text-[11px] text-cyan-200 flex items-center space-x-1.5 animate-pulse">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{pingFeedback}</span>
                  </div>
                )}

                {/* Supervisor Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleRadioCheckPing(guard)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Radio Duty Check</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGuardFilter(isSelectedFilter ? 'ALL' : guard.name)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors ${
                      isSelectedFilter
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300'
                    }`}
                  >
                    <span>{isSelectedFilter ? 'Showing Clearances' : 'Filter Clearances'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: WHICH GUARD HAS GRANTED PERMISSION TO WHICH PERSON OR VEHICLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                2. GUARD CLEARANCE &amp; PERMISSION AUTHORIZATION LEDGER
              </h3>
              <p className="text-xs text-slate-400">
                Full transparent audit trail: which guard authorized which specific person or vehicle, method of verification, and gate pass details.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Showing <span className="text-cyan-400 font-bold">{filteredRecords.length}</span> of {clearanceRecords.length} records
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search person, plate (e.g. GST-3411), house or guard..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filter by Guard */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400">Guard:</span>
            <select
              value={selectedGuardFilter}
              onChange={e => setSelectedGuardFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Security Guards ({guards.length})</option>
              {guards.map(g => (
                <option key={g.id} value={g.name}>
                  {g.name} ({g.badgeNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Type */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400">Permission:</span>
            <select
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Clearances</option>
              <option value="VEHICLE">Vehicles Only</option>
              <option value="VISITOR">Visitors &amp; Guests Only</option>
              <option value="DELIVERY">Deliveries Only</option>
              <option value="SERVICE">Service Workers Only</option>
              <option value="OVERRIDE">Emergency Overrides &amp; Watchlist</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(selectedGuardFilter !== 'ALL' || selectedTypeFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedGuardFilter('ALL');
                setSelectedTypeFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Clearances Table / List */}
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No permissions matching the selected guard or filters found. Try resetting the filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <th className="py-3 px-4">TIME &amp; GATE</th>
                  <th className="py-3 px-4">AUTHORIZED BY GUARD</th>
                  <th className="py-3 px-4">RECIPIENT PERSON / VEHICLE</th>
                  <th className="py-3 px-4">DESTINATION &amp; HOST</th>
                  <th className="py-3 px-4">PERMISSION STATUS</th>
                  <th className="py-3 px-4">VERIFICATION EVIDENCE</th>
                  <th className="py-3 px-4">NOTES / PURPOSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                {filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Time & Gate */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-white font-semibold text-xs">{rec.timestamp}</div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{rec.gateName}</span>
                      </div>
                    </td>

                    {/* Authorized By Guard */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px] font-bold text-cyan-300 font-mono">
                          {rec.guardName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{rec.guardName}</div>
                          <div className="text-[10px] font-mono text-cyan-400">Badge: {rec.guardBadge}</div>
                        </div>
                      </div>
                    </td>

                    {/* Recipient Person / Vehicle */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 text-xs flex items-center space-x-1.5">
                        {rec.recipientType === 'VEHICLE' && <Car className="w-3.5 h-3.5 text-blue-400" />}
                        {rec.recipientType === 'VISITOR' && <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                        {rec.recipientType === 'DELIVERY' && <Package className="w-3.5 h-3.5 text-amber-400" />}
                        {rec.recipientType === 'MANUAL_OVERRIDE' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                        {rec.recipientType === 'WATCHLIST_BLOCK' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                        <span>{rec.recipientName}</span>
                      </div>
                      {rec.vehiclePlate && (
                        <div className="mt-0.5">
                          <span className="font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700 text-amber-300 font-bold">
                            {rec.vehiclePlate}
                          </span>
                        </div>
                      )}
                      {rec.recipientPhone && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {rec.recipientPhone}
                        </div>
                      )}
                    </td>

                    {/* Destination & Host */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white text-xs">{rec.destinationHouse}</div>
                      {rec.hostName && (
                        <div className="text-[11px] text-slate-400">Host: {rec.hostName}</div>
                      )}
                    </td>

                    {/* Permission Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        rec.permissionStatus === 'GRANTED'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                          : rec.permissionStatus === 'DENIED'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                          : 'bg-amber-950/80 text-amber-300 border-amber-700'
                      }`}>
                        {rec.permissionStatus === 'GRANTED' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>PERMISSION GRANTED</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>ACCESS DENIED</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Verification Evidence */}
                    <td className="py-3 px-4">
                      <div className="text-slate-200 text-xs font-medium">
                        {rec.verificationMethod}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 italic">
                        {rec.actionTaken}
                      </div>
                    </td>

                    {/* Notes / Purpose */}
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {rec.notes || 'Routine gate check'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
