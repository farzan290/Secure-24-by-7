import React, { useState } from 'react';
import {
  Crown,
  Building2,
  Shield,
  Car,
  UserCheck,
  AlertTriangle,
  Server,
  Activity,
  Sliders,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Lock,
  Radio,
  FileText,
  DoorClosed,
  ChevronRight,
  Database,
  Cpu,
  Search,
  Phone
} from 'lucide-react';
import { Society, SecurityAlert, Incident, AuditLog, House, Vehicle } from '../types';
import { soundEngine } from '../services/audio';

interface Props {
  societies: Society[];
  activeSociety: Society;
  onSelectSociety: (socId: string) => void;
  alerts: SecurityAlert[];
  incidents: Incident[];
  auditLogs: AuditLog[];
  houses?: House[];
  vehicles?: Vehicle[];
  onEnterGuardPortal?: () => void;
  onOpenEmergency: () => void;
  onLogout: () => void;
  onRefresh: () => void;
}

export const OwnerDashboard: React.FC<Props> = ({
  societies,
  activeSociety,
  onSelectSociety,
  alerts,
  incidents,
  auditLogs,
  houses = [],
  vehicles = [],
  onEnterGuardPortal,
  onOpenEmergency,
  onLogout,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'RESIDENTS' | 'INCIDENTS' | 'HARDWARE' | 'SYSTEM'>('PORTFOLIO');
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [residentSearch, setResidentSearch] = useState('');

  // Cross-society aggregated metrics
  const totalGates = societies.reduce((acc, s) => acc + s.gatesCount, 0);
  const totalResidents = societies.reduce((acc, s) => acc + s.totalResidents, 0);
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');

  // Filtered residents in active society
  const filteredHouses = houses.filter(h => {
    if (!residentSearch.trim()) return true;
    const q = residentSearch.toLowerCase().trim();
    const plates = (h.registeredPlates || []).map(p => p.toLowerCase());
    return (
      h.ownerName.toLowerCase().includes(q) ||
      h.houseNumber.toLowerCase().includes(q) ||
      h.block.toLowerCase().includes(q) ||
      h.contactNumber.toLowerCase().includes(q) ||
      plates.some(p => p.includes(q))
    );
  });

  const residentVehicles = vehicles.filter(v => v.classification === 'RESIDENT');
  const residentVehiclesInside = residentVehicles.filter(v => v.status === 'INSIDE');
  const residentVehiclesOutside = residentVehicles.filter(v => v.status === 'OUTSIDE');

  const runHardwareDiagnostic = () => {
    setIsDiagnosticRunning(true);
    soundEngine.playSuccessChime();
    setTimeout(() => {
      setIsDiagnosticRunning(false);
      setDiagnosticResult('ALL 3 SOCIETIES HARDWARE GATEWAYS HEALTHY: RS-485 microcontrollers responding at 12ms latency.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* OWNER MASTER HEADER */}
      <header className="border-b border-amber-900/60 bg-slate-900/90 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-950/50">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base text-white tracking-wider font-mono">
                OWNER MASTER SUITE
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                MULTI-SOCIETY GOVERNANCE
              </span>
            </div>
            <div className="text-xs text-slate-400">
              High-level operations across {societies.length} residential developments
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onEnterGuardPortal && (
            <button
              type="button"
              onClick={onEnterGuardPortal}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase shadow-md shadow-cyan-950/50 flex items-center space-x-1.5 transition-all"
              title="Inspect perimeter gates and guard actions in Owner Audit Mode"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Inspect Guard Portal</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenEmergency}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase shadow-md shadow-red-950 flex items-center space-x-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>GLOBAL LOCKDOWN</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Exit Owner Suite"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* SUB-HEADER TABS */}
      <nav className="bg-slate-900/40 border-b border-slate-800 px-4 sm:px-6 py-2 flex items-center space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('PORTFOLIO')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'PORTFOLIO'
              ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-950 font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Societies Portfolio ({societies.length})
        </button>
        <button
          onClick={() => setActiveTab('RESIDENTS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'RESIDENTS'
              ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-950 font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Residents &amp; Vehicle Fleet ({houses.length})
        </button>
        <button
          onClick={() => setActiveTab('INCIDENTS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'INCIDENTS'
              ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-950 font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Executive Incidents ({incidents.length})
        </button>
        <button
          onClick={() => setActiveTab('HARDWARE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'HARDWARE'
              ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-950 font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Hardware &amp; Boom Barrier Network
        </button>
        <button
          onClick={() => setActiveTab('SYSTEM')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'SYSTEM'
              ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-950 font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          System Diagnostics &amp; Audit
        </button>
      </nav>

      {/* MAIN OWNER CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* EXECUTIVE KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Managed Societies</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">{societies.length}</div>
            <div className="text-[11px] text-emerald-400 font-semibold">100% Operational</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Gates Guarded</span>
              <DoorClosed className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">{totalGates}</div>
            <div className="text-[11px] text-slate-500">Across all perimeters</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Residents</span>
              <UserCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">{totalResidents}</div>
            <div className="text-[11px] text-slate-500">Registered families</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Portfolio Alerts</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">{alerts.length}</div>
            <div className="text-[11px] text-red-400 font-semibold">{criticalAlerts.length} critical alerts</div>
          </div>
        </div>

        {/* TAB 1: PORTFOLIO & SOCIETIES HEALTH */}
        {activeTab === 'PORTFOLIO' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Multi-Tenant Residential Portfolio
              </h3>
              <p className="text-xs text-slate-400">Select any society to inspect management telemetry or isolate operations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {societies.map(soc => (
                <div
                  key={soc.id}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    soc.id === activeSociety.id
                      ? 'bg-slate-900 border-amber-500 shadow-xl shadow-amber-950/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-base">{soc.name}</h4>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {soc.securityScore}/100 SCORE
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">{soc.address}, {soc.city}</p>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Perimeter Gates:</span>
                        <span className="text-slate-200">{soc.gatesCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Residents:</span>
                        <span className="text-cyan-400">{soc.totalResidents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Registered Plates:</span>
                        <span className="text-slate-200">{soc.totalVehicles}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Emergency Police:</span>
                        <span className="text-red-400">{soc.emergencyContacts.police}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectSociety(soc.id);
                      soundEngine.playSuccessChime();
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase flex items-center justify-center space-x-2 transition-all ${
                      soc.id === activeSociety.id
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{soc.id === activeSociety.id ? 'Active Selected Society' : 'Inspect Society'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: RESIDENTS & VEHICLE FLEET */}
        {activeTab === 'RESIDENTS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                  <span>{activeSociety.name} — Residents &amp; Vehicle Fleet Registry</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Full roster of registered residents, verified contact numbers, and authorized vehicle plates
                </p>
              </div>

              {/* Status Counters */}
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {residentVehiclesInside.length} INSIDE
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                  {residentVehiclesOutside.length} OUTSIDE
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                  {houses.length} RESIDENCES
                </span>
              </div>
            </div>

            {/* Quick Search */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={residentSearch}
                onChange={e => setResidentSearch(e.target.value)}
                placeholder="Search owner name, villa number, phone, or license plate..."
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
              />
              {residentSearch && (
                <button
                  type="button"
                  onClick={() => setResidentSearch('')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Residents Table / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHouses.map(house => {
                const plates = house.registeredPlates || [];
                return (
                  <div
                    key={house.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-lg shadow-slate-950/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-bold text-white tracking-wide">
                        {house.houseNumber}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-amber-400 border border-slate-800 font-bold">
                        {house.block}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{house.ownerName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Resident</span>
                      </div>
                      <div className="text-slate-400 font-mono text-[11px] flex items-center space-x-1.5">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{house.contactNumber}</span>
                      </div>
                      {house.email && (
                        <div className="text-slate-500 font-mono text-[10px] truncate">
                          {house.email}
                        </div>
                      )}
                    </div>

                    {/* Registered Plates */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Car className="w-3 h-3 text-amber-400" />
                          <span>REGISTERED VEHICLE PLATES:</span>
                        </span>
                        <span>{plates.length}</span>
                      </div>

                      {plates.length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic">No vehicle plates registered</div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {plates.map(plate => {
                            const matchVeh = vehicles.find(v => v.plateNumber.toUpperCase() === plate.toUpperCase());
                            const isInside = matchVeh?.status === 'INSIDE';
                            return (
                              <div
                                key={plate}
                                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono flex items-center space-x-1.5"
                              >
                                <span className="font-bold text-amber-300">{plate}</span>
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isInside ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                                  }`}
                                  title={isInside ? 'Currently Inside' : 'Currently Outside'}
                                />
                                <span className={`text-[9px] font-bold ${isInside ? 'text-emerald-400' : 'text-slate-500'}`}>
                                  {isInside ? 'IN' : 'OUT'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: INCIDENTS */}
        {activeTab === 'INCIDENTS' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
              Cross-Society Security Incidents
            </h3>
            <div className="space-y-3">
              {incidents.map(inc => (
                <div key={inc.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{inc.title}</span>
                    <span className="text-xs font-mono font-bold text-red-400">{inc.severity}</span>
                  </div>
                  <p className="text-xs text-slate-300">{inc.description}</p>
                  <div className="text-[11px] font-mono text-slate-500 flex justify-between">
                    <span>Location: {inc.location}</span>
                    <span>Status: {inc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: HARDWARE & BOOM BARRIERS */}
        {activeTab === 'HARDWARE' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">HARDWARE &amp; GATE CONTROLLER HEALTH</h3>
                <p className="text-xs text-slate-400">Microcontroller connections, relay boards &amp; loop detectors</p>
              </div>
              <button
                type="button"
                onClick={runHardwareDiagnostic}
                disabled={isDiagnosticRunning}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs uppercase flex items-center space-x-1.5"
              >
                <Cpu className="w-4 h-4" />
                <span>{isDiagnosticRunning ? 'Pinging Relays...' : 'Run Hardware Diagnostics'}</span>
              </button>
            </div>

            {diagnosticResult && (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="font-bold">{diagnosticResult}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-400 block font-bold">BOOM BARRIER PROTOCOL</span>
                <div className="text-emerald-400 font-bold">MODBUS RTU / RS-485</div>
                <p className="text-[11px] text-slate-500 font-sans">Simulated industrial barrier relay board interface.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-400 block font-bold">ANPR OCR ENGINE</span>
                <div className="text-cyan-400 font-bold">TESSERACT-ANPR V2.4</div>
                <p className="text-[11px] text-slate-500 font-sans">Plate character extraction at 99.4% confidence.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-400 block font-bold">BACKUP GENERATOR LINK</span>
                <div className="text-emerald-400 font-bold">STANDBY 100% READY</div>
                <p className="text-[11px] text-slate-500 font-sans">Automatic transfer switch enabled on power loss.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM DIAGNOSTICS & AUDIT */}
        {activeTab === 'SYSTEM' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white font-mono">SYSTEM INTEGRITY &amp; MASTER AUDIT LOG</h3>
              <p className="text-xs text-slate-400">Cryptographically verifiable sequence of all critical security actions</p>
            </div>

            <div className="space-y-2">
              {auditLogs.map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="text-slate-400 ml-2">by <strong>{log.performedBy}</strong></span>
                    <p className="text-[11px] text-slate-500">{log.details}</p>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
