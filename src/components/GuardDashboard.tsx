import React, { useState } from 'react';
import {
  Shield,
  Car,
  DoorClosed,
  UserCheck,
  Package,
  Wrench,
  AlertTriangle,
  Search,
  History,
  QrCode,
  Radio,
  Clock,
  CheckCircle2,
  XCircle,
  Smartphone,
  Send,
  Eye,
  Camera,
  RefreshCw,
  LogOut,
  ChevronRight,
  Flame,
  KeyRound,
  FileText,
  ShieldCheck,
  Crown,
  Building2
} from 'lucide-react';
import {
  Gate,
  Guard,
  Society,
  Vehicle,
  Visitor,
  Delivery,
  ServiceWorker,
  SecurityAlert,
  ShiftHandoverNote,
  House,
  GuardClearanceRecord,
  AuditMode
} from '../types';
import { api } from '../services/api';
import { soundEngine } from '../services/audio';
import { GuardAccountabilityAudit } from './GuardAccountabilityAudit';

interface Props {
  society: Society;
  currentGuard: Guard;
  currentGate: Gate;
  gates: Gate[];
  guards?: Guard[];
  vehicles: Vehicle[];
  visitors: Visitor[];
  deliveries: Delivery[];
  serviceWorkers: ServiceWorker[];
  alerts: SecurityAlert[];
  houses: House[];
  shiftNotes: ShiftHandoverNote[];
  clearanceRecords?: GuardClearanceRecord[];
  auditMode?: AuditMode;
  supervisorName?: string;
  onReturnToRole?: () => void;
  onSwitchGuard?: (guard: Guard) => void;
  onSwitchGate: (gateId: string) => void;
  onLogout: () => void;
  onOpenEmergency: () => void;
  onRefresh: () => void;
}

export const GuardDashboard: React.FC<Props> = ({
  society,
  currentGuard,
  currentGate,
  gates,
  guards,
  vehicles,
  visitors,
  deliveries,
  serviceWorkers,
  alerts,
  houses,
  shiftNotes,
  clearanceRecords,
  auditMode,
  supervisorName,
  onReturnToRole,
  onSwitchGuard,
  onSwitchGate,
  onLogout,
  onOpenEmergency,
  onRefresh
}) => {
  // Active Guard Action View
  type ActiveTab =
    | 'ACTIONS'
    | 'VEHICLE_ENTRY'
    | 'VEHICLE_EXIT'
    | 'VISITOR_ENTRY'
    | 'DELIVERY'
    | 'SERVICE_STAFF'
    | 'SEARCH'
    | 'ACTIVITY'
    | 'HANDOVER'
    | 'ACCOUNTABILITY';

  const [activeTab, setActiveTab] = useState<ActiveTab>('ACTIONS');
  const [mobileMode, setMobileMode] = useState(false);

  // Barrier states
  const [barrierState, setBarrierState] = useState(currentGate.barrierState);
  const [barrierLoading, setBarrierLoading] = useState(false);

  // Vehicle Entry states
  const [plateInput, setPlateInput] = useState('');
  const [scannedVehicle, setScannedVehicle] = useState<Vehicle | null>(null);
  const [isUnknownPlate, setIsUnknownPlate] = useState(false);
  const [isWatchlistPlate, setIsWatchlistPlate] = useState(false);
  const [watchlistWarning, setWatchlistWarning] = useState('');
  const [unknownSelectedHouse, setUnknownSelectedHouse] = useState('Villa 104');
  const [unknownDriverName, setUnknownDriverName] = useState('');
  const [approvalRequested, setApprovalRequested] = useState(false);
  const [entrySuccessNote, setEntrySuccessNote] = useState('');

  // Vehicle Exit states
  const [exitPlateInput, setExitPlateInput] = useState('');
  const [exitSuccessNote, setExitSuccessNote] = useState('');

  // Visitor Entry states
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorHouse, setVisitorHouse] = useState('Villa 101');
  const [visitorPurpose, setVisitorPurpose] = useState('Personal Guest');
  const [visitorPlate, setVisitorPlate] = useState('');
  const [visitorSuccessPass, setVisitorSuccessPass] = useState<string | null>(null);

  // QR Pass Scanner Simulation
  const [qrScanInput, setQrScanInput] = useState('SEC247-PASS-GP849102-VILLA104-BILAL');
  const [qrScanResult, setQrScanResult] = useState<{ valid: boolean; message: string } | null>(null);

  // Delivery states
  const [deliveryCompany, setDeliveryCompany] = useState<'FoodPanda' | 'UberEats' | 'Amazon' | 'FedEx' | 'Grocery'>('FoodPanda');
  const [deliveryRider, setDeliveryRider] = useState('');
  const [deliveryPlate, setDeliveryPlate] = useState('');
  const [deliveryHouse, setDeliveryHouse] = useState('Villa 102');

  // Service Worker states
  const [serviceWorkerName, setServiceWorkerName] = useState('');
  const [serviceCategory, setServiceCategory] = useState<'Electrician' | 'Plumber' | 'Cleaner' | 'Gardener' | 'AC Tech'>('Electrician');
  const [serviceHouse, setServiceHouse] = useState('Villa 104');

  // Handover note
  const [newHandoverNote, setNewHandoverNote] = useState('');
  const [handoverCategory, setHandoverCategory] = useState<'SUSPICIOUS_VEHICLE' | 'EXPECTED_VIP' | 'BARRIER_ISSUE' | 'GENERAL'>('GENERAL');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const vehiclesInsideCount = vehicles.filter(v => v.status === 'INSIDE').length;
  const visitorsInsideCount = visitors.filter(v => v.status === 'INSIDE').length;
  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  // Barrier Command handler
  const handleBarrierCommand = async (command: 'OPEN' | 'CLOSE' | 'EMERGENCY_LOCK') => {
    setBarrierLoading(true);
    try {
      const res = await api.sendBarrierCommand(currentGate.id, command, currentGuard.name);
      if (res.success) {
        setBarrierState(res.barrierState);
        soundEngine.playSuccessChime();
        if (command === 'OPEN') {
          setTimeout(() => setBarrierState('OPEN'), 1500);
          setTimeout(() => setBarrierState('CLOSING'), 7000);
          setTimeout(() => setBarrierState('CLOSED'), 9500);
        }
      }
    } catch {
      setBarrierState('ERROR');
    } finally {
      setBarrierLoading(false);
      onRefresh();
    }
  };

  // Silent Panic Trigger
  const handleSilentPanic = async () => {
    soundEngine.playWarningSound();
    try {
      await api.triggerPanic(currentGate.name, currentGuard.name);
      alert('PANIC ALERT BROADCASTED: Society Management and Patrol notified silently.');
      onRefresh();
    } catch {
      alert('Panic signal recorded.');
    }
  };

  // Check Plate lookup / ANPR Scan
  const handleLookupPlate = (plateToSearch: string) => {
    const cleanPlate = plateToSearch.trim().toUpperCase();
    if (!cleanPlate) return;

    setApprovalRequested(false);
    setEntrySuccessNote('');
    setIsWatchlistPlate(false);
    setWatchlistWarning('');

    // Check watchlist
    if (cleanPlate === 'SUS-999') {
      setIsWatchlistPlate(true);
      setWatchlistWarning('WATCHLIST MATCH: Suspected perimeter loitering. Do NOT allow access.');
      soundEngine.playEmergencyAlarm();
      return;
    }

    const found = vehicles.find(v => v.plateNumber.toUpperCase() === cleanPlate);
    if (found) {
      setScannedVehicle(found);
      setIsUnknownPlate(false);
      soundEngine.playSuccessChime();
    } else {
      setScannedVehicle(null);
      setIsUnknownPlate(true);
      soundEngine.playWarningSound();
    }
  };

  // Confirm registered vehicle entry
  const handleConfirmRegisteredEntry = async (veh: Vehicle) => {
    try {
      await api.recordVehicleEntry({
        plateNumber: veh.plateNumber,
        gateId: currentGate.id,
        guardName: currentGuard.name,
        houseNumber: veh.houseNumber,
        classification: veh.classification
      });
      handleBarrierCommand('OPEN');
      setEntrySuccessNote(`Registered Vehicle ${veh.plateNumber} approved. Boom barrier opened.`);
      setTimeout(() => {
        setPlateInput('');
        setScannedVehicle(null);
        setEntrySuccessNote('');
        onRefresh();
      }, 3000);
    } catch {
      alert('Error recording vehicle entry');
    }
  };

  // Request Resident Authorization for Unknown vehicle
  const handleRequestResidentAuthorization = async () => {
    const targetHouse = houses.find(h => h.houseNumber === unknownSelectedHouse);
    try {
      await api.requestResidentApproval({
        visitorName: unknownDriverName || 'Guest Driver',
        vehiclePlate: plateInput.toUpperCase(),
        destinationHouse: unknownSelectedHouse,
        hostName: targetHouse?.ownerName || 'Resident',
        purpose: 'Guest Visit / Vehicle Entry',
        gateName: currentGate.name
      });
      setApprovalRequested(true);
      soundEngine.playSuccessChime();
    } catch {
      alert('Failed to send resident approval request.');
    }
  };

  // Allow Unknown Vehicle as Guest
  const handleAuthorizeUnknownGuest = async () => {
    try {
      await api.recordVehicleEntry({
        plateNumber: plateInput.toUpperCase(),
        gateId: currentGate.id,
        guardName: currentGuard.name,
        houseNumber: unknownSelectedHouse,
        classification: 'GUEST',
        notes: `Temporary guest allowed by guard for ${unknownSelectedHouse}`
      });
      handleBarrierCommand('OPEN');
      setEntrySuccessNote(`Guest Vehicle ${plateInput.toUpperCase()} approved. Gate opened.`);
      setTimeout(() => {
        setPlateInput('');
        setIsUnknownPlate(false);
        setEntrySuccessNote('');
        onRefresh();
      }, 3000);
    } catch {
      alert('Error recording guest vehicle entry');
    }
  };

  // Handle Vehicle Exit
  const handleVehicleExit = async (plate: string) => {
    if (!plate) return;
    try {
      await api.recordVehicleExit({
        plateNumber: plate.toUpperCase(),
        gateId: currentGate.id,
        guardName: currentGuard.name
      });
      handleBarrierCommand('OPEN');
      setExitSuccessNote(`Vehicle ${plate.toUpperCase()} recorded as EXITED. Gate opened.`);
      setTimeout(() => {
        setExitPlateInput('');
        setExitSuccessNote('');
        onRefresh();
      }, 3000);
    } catch {
      alert('Error recording exit');
    }
  };

  // Verify QR Pass
  const handleScanQrPass = () => {
    if (qrScanInput.includes('GP849102') || qrScanInput.includes('BILAL')) {
      setQrScanResult({
        valid: true,
        message: 'PASS VALID: Guest Bilal Farooq -> Villa 104 (Approved by Mr. Vance). Valid until 10:00 PM.'
      });
      soundEngine.playSuccessChime();
      handleBarrierCommand('OPEN');
    } else {
      setQrScanResult({
        valid: false,
        message: 'INVALID OR EXPIRED PASS: Signature does not match authorized gate registry.'
      });
      soundEngine.playWarningSound();
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans ${mobileMode ? 'text-sm' : ''}`}>
      {/* GUARD TOP STATUS BAR */}
      <header className="border-b border-slate-800 bg-slate-900 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-900/40">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base text-white tracking-wide font-mono">
                {currentGate.name}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                GATE #{currentGate.gateNumber}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center space-x-2">
              <span>Guard: <strong className="text-slate-200">{currentGuard.name}</strong> ({currentGuard.badgeNumber})</span>
              <span>•</span>
              <span className="text-cyan-400 font-semibold">{currentGuard.shift} SHIFT</span>
            </div>
          </div>
        </div>

        {/* Live Gate Counters */}
        <div className="flex items-center space-x-2 sm:space-x-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-2">
            <Car className="w-4 h-4 text-cyan-400" />
            <span>Vehicles Inside: <strong className="text-white">{vehiclesInsideCount}</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hidden md:flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Visitors Inside: <strong className="text-white">{visitorsInsideCount}</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-2">
            <Radio className={`w-3.5 h-3.5 ${barrierState === 'OPEN' ? 'text-emerald-400 animate-ping' : 'text-amber-400'}`} />
            <span>Barrier: <strong className={barrierState === 'OPEN' ? 'text-emerald-400' : 'text-slate-300'}>{barrierState}</strong></span>
          </div>
        </div>

        {/* Gate Switcher & Actions */}
        <div className="flex items-center space-x-2">
          {/* Gate Selector */}
          <select
            value={currentGate.id}
            onChange={e => onSwitchGate(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
          >
            {gates.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Mobile Mode Toggle */}
          <button
            type="button"
            onClick={() => setMobileMode(!mobileMode)}
            title="Toggle Big Touch Mobile Guard Mode"
            className={`p-2 rounded-lg border text-xs font-medium flex items-center space-x-1 ${
              mobileMode ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden lg:inline">Mobile Mode</span>
          </button>

          {/* Silent Panic Button */}
          <button
            id="btn-silent-panic"
            type="button"
            onClick={handleSilentPanic}
            title="Silent Panic Distress Signal"
            className="px-2.5 py-1.5 rounded-lg bg-amber-950 border border-amber-800 text-amber-300 hover:bg-amber-900 text-xs font-bold"
          >
            PANIC
          </button>

          {/* Return to Owner/Management Portal button if in audit mode */}
          {onReturnToRole && (
            <button
              type="button"
              onClick={onReturnToRole}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow ${
                auditMode === 'OWNER'
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 border border-amber-400'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400'
              }`}
            >
              {auditMode === 'OWNER' ? <Crown className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
              <span>Return to {auditMode === 'OWNER' ? 'Owner Portal' : 'Management Portal'}</span>
            </button>
          )}

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="End Guard Shift / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* SUPERVISOR AUDIT NOTIFICATION BANNER (When accessed by Owner or Management) */}
      {auditMode && (
        <div className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn ${
          auditMode === 'OWNER'
            ? 'bg-amber-950/80 border-amber-800/80 text-amber-200'
            : 'bg-blue-950/80 border-blue-800/80 text-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {auditMode === 'OWNER' ? <Crown className="w-4 h-4 text-amber-400" /> : <Building2 className="w-4 h-4 text-blue-400" />}
            <span className="font-bold uppercase tracking-wider font-mono">
              {auditMode === 'OWNER' ? '👑 OWNER EXECUTIVE SUPERVISION ENGAGED' : '🏢 MANAGEMENT AUDIT CONSOLE ENGAGED'}
            </span>
            <span>•</span>
            <span className="text-slate-300">Supervised by: <strong className="text-white">{supervisorName || (auditMode === 'OWNER' ? 'Executive Owner' : 'Management Auditor')}</strong></span>
          </div>

          <div className="flex items-center space-x-3">
            {guards && guards.length > 0 && onSwitchGuard && (
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-300">Perspective:</span>
                <select
                  value={currentGuard.id}
                  onChange={e => {
                    const found = guards.find(g => g.id === e.target.value);
                    if (found) onSwitchGuard(found);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                >
                  {guards.map(g => (
                    <option key={g.id} value={g.id}>
                      Officer {g.name} ({g.badgeNumber} • {g.dutyStatus})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('ACCOUNTABILITY')}
              className={`px-3 py-1 rounded-lg font-bold border text-xs flex items-center space-x-1.5 transition-all ${
                activeTab === 'ACCOUNTABILITY'
                  ? 'bg-white text-slate-950 border-white shadow'
                  : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audit Guard Clearances</span>
            </button>
          </div>
        </div>
      )}

      {/* ELECTRONIC BOOM BARRIER ACTION STRIP */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${
              barrierState === 'OPEN' ? 'bg-emerald-400 animate-pulse' :
              barrierState === 'OPENING' || barrierState === 'CLOSING' ? 'bg-amber-400 animate-ping' :
              'bg-cyan-500'
            }`} />
            <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              ELECTRONIC BOOM BARRIER: <span className="text-cyan-400">{barrierState}</span>
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
            SIMULATION MODE ACTIVE
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-open-barrier"
            type="button"
            onClick={() => handleBarrierCommand('OPEN')}
            disabled={barrierLoading || barrierState === 'OPENING' || barrierState === 'OPEN'}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-emerald-950 border border-emerald-400/40 disabled:opacity-50 transition-all flex items-center space-x-2"
          >
            <DoorClosed className="w-4 h-4" />
            <span>OPEN GATE</span>
          </button>

          <button
            id="btn-close-barrier"
            type="button"
            onClick={() => handleBarrierCommand('CLOSE')}
            disabled={barrierLoading || barrierState === 'CLOSED'}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase border border-slate-700 transition-all"
          >
            CLOSE
          </button>

          <button
            id="btn-guard-emergency"
            type="button"
            onClick={onOpenEmergency}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase border border-red-400/40 shadow-md shadow-red-950 flex items-center space-x-1.5"
          >
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span>EMERGENCY</span>
          </button>
        </div>
      </div>

      {/* MAIN GUARD WORKSPACE */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs for Fast Actions */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('ACTIONS')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === 'ACTIONS'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Gate Fast Actions
          </button>
          <button
            onClick={() => setActiveTab('VEHICLE_ENTRY')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'VEHICLE_ENTRY'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Vehicle Entry (ANPR)</span>
          </button>
          <button
            onClick={() => setActiveTab('VEHICLE_EXIT')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'VEHICLE_EXIT'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <DoorClosed className="w-3.5 h-3.5" />
            <span>Vehicle Exit</span>
          </button>
          <button
            onClick={() => setActiveTab('VISITOR_ENTRY')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'VISITOR_ENTRY'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Visitor Entry &amp; QR Pass</span>
          </button>
          <button
            onClick={() => setActiveTab('DELIVERY')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'DELIVERY'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Delivery</span>
          </button>
          <button
            onClick={() => setActiveTab('SERVICE_STAFF')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'SERVICE_STAFF'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Service Staff</span>
          </button>
          <button
            onClick={() => setActiveTab('HANDOVER')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'HANDOVER'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Shift Handover ({shiftNotes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ACTIVITY')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'ACTIVITY'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Recent Gate Activity</span>
          </button>
          <button
            onClick={() => setActiveTab('ACCOUNTABILITY')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'ACCOUNTABILITY'
                ? (auditMode === 'OWNER' ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-950 font-extrabold' : 'bg-cyan-600 text-white shadow-md shadow-cyan-950')
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Guard Accountability &amp; Clearances</span>
          </button>
        </div>

        {/* TAB 1: MAIN FAST ACTIONS GRID */}
        {activeTab === 'ACTIONS' && (
          <div className="space-y-6">
            {/* Quick action cards - 8 main buttons from Section 11 of prompt */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('VEHICLE_ENTRY')}
                className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500 text-left transition-all group flex flex-col justify-between shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white group-hover:text-cyan-300">🚗 Vehicle Entry</h4>
                  <p className="text-xs text-slate-400 mt-1">ANPR scan &amp; resident verification</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('VEHICLE_EXIT')}
                className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500 text-left transition-all group flex flex-col justify-between shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-105 transition-transform">
                  <DoorClosed className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white group-hover:text-blue-300">🚪 Vehicle Exit</h4>
                  <p className="text-xs text-slate-400 mt-1">Log departing vehicle &amp; open</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('VISITOR_ENTRY')}
                className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500 text-left transition-all group flex flex-col justify-between shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white group-hover:text-emerald-300">👤 Visitor Entry</h4>
                  <p className="text-xs text-slate-400 mt-1">Digital passes &amp; host approval</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('DELIVERY')}
                className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500 text-left transition-all group flex flex-col justify-between shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white group-hover:text-amber-300">📦 Delivery</h4>
                  <p className="text-xs text-slate-400 mt-1">FoodPanda, Amazon &amp; Couriers</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SERVICE_STAFF')}
                className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500 text-left transition-all group flex flex-col justify-between shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-105 transition-transform">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white group-hover:text-purple-300">🛠 Service Staff</h4>
                  <p className="text-xs text-slate-400 mt-1">Electricians, Plumbers &amp; Labor</p>
                </div>
              </button>

              <button
                type="button"
                onClick={onOpenEmergency}
                className="p-5 rounded-2xl bg-red-950/50 hover:bg-red-900/60 border border-red-800/80 text-left transition-all group flex flex-col justify-between shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-red-900/80 border border-red-600 flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-red-200">🚨 Emergency</h4>
                  <p className="text-xs text-red-300/80 mt-1">Instant panic &amp; lockdown</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('HANDOVER')}
                className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500 text-left transition-all group flex flex-col justify-between shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-3 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">📋 Shift Handover</h4>
                  <p className="text-xs text-slate-400 mt-1">Notes &amp; special instructions</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ACTIVITY')}
                className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500 text-left transition-all group flex flex-col justify-between shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-3 group-hover:scale-105 transition-transform">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">🔍 Search &amp; Feed</h4>
                  <p className="text-xs text-slate-400 mt-1">Live gate log &amp; plate search</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ACCOUNTABILITY')}
                className={`p-5 rounded-2xl border text-left transition-all group flex flex-col justify-between shadow-lg ${
                  auditMode === 'OWNER'
                    ? 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-800/80 hover:border-amber-500'
                    : 'bg-slate-900 hover:bg-slate-800/90 border-slate-800 hover:border-cyan-500'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform ${
                  auditMode === 'OWNER'
                    ? 'bg-amber-900/80 border border-amber-600 text-amber-300'
                    : 'bg-cyan-950/80 border border-cyan-800 text-cyan-400'
                }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className={`font-bold text-base ${auditMode === 'OWNER' ? 'text-amber-200 group-hover:text-white' : 'text-white group-hover:text-cyan-300'}`}>
                    🛡️ Guard Permissions
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Audit which guard permitted which person or vehicle &amp; check duties
                  </p>
                </div>
              </button>
            </div>

            {/* Quick Live ANPR Scanner strip */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wide text-white">
                    Quick ANPR / Number Plate Scanner Simulation
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  AUTO-DETECTION READY
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPlateInput('ABC-123');
                    handleLookupPlate('ABC-123');
                    setActiveTab('VEHICLE_ENTRY');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-cyan-400"
                >
                  ABC-123 (Resident Villa 101)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlateInput('XYZ-786');
                    handleLookupPlate('XYZ-786');
                    setActiveTab('VEHICLE_ENTRY');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-cyan-400"
                >
                  XYZ-786 (Resident Villa 104)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlateInput('UNK-9941');
                    handleLookupPlate('UNK-9941');
                    setActiveTab('VEHICLE_ENTRY');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-amber-400"
                >
                  UNK-9941 (Unknown Guest)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlateInput('SUS-999');
                    handleLookupPlate('SUS-999');
                    setActiveTab('VEHICLE_ENTRY');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-xs font-mono font-bold text-red-400"
                >
                  SUS-999 (Watchlist Loitering)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VEHICLE ENTRY (ANPR & CLASSIFICATION) */}
        {activeTab === 'VEHICLE_ENTRY' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">VEHICLE ARRIVAL &amp; ENTRY GATE</h3>
                  <p className="text-xs text-slate-400">ANPR / Number Plate Recognition &amp; Resident Association</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ACTIONS')}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Back to Fast Actions
              </button>
            </div>

            {/* Plate Input search box */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={plateInput}
                  onChange={e => setPlateInput(e.target.value.toUpperCase())}
                  placeholder="Enter Plate Number (e.g. ABC-123 or XYZ-786)..."
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 text-sm font-mono font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 uppercase tracking-wider"
                />
              </div>
              <button
                type="button"
                onClick={() => handleLookupPlate(plateInput)}
                className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-950 border border-cyan-400/30 flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Verify Vehicle</span>
              </button>
            </div>

            {/* Notification message */}
            {entrySuccessNote && (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center space-x-2 animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="font-bold">{entrySuccessNote}</span>
              </div>
            )}

            {/* WATCHLIST ALERT DETECTED */}
            {isWatchlistPlate && (
              <div className="p-5 rounded-2xl bg-red-950/90 border-2 border-red-600 text-red-100 space-y-3 animate-pulse">
                <div className="flex items-center space-x-2 font-bold text-base text-red-200">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <span>WATCHLIST MATCH — VERIFY BEFORE ACCESS</span>
                </div>
                <p className="text-xs leading-relaxed text-red-200">
                  {watchlistWarning}
                </p>
                <div className="p-3 rounded-xl bg-black/40 text-xs font-mono space-y-1">
                  <div>Plate: <strong>{plateInput}</strong></div>
                  <div>Action Guidance: Hold barrier closed. Do not grant automated entry. Dispatch supervisor.</div>
                </div>
                <button
                  type="button"
                  onClick={onOpenEmergency}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                >
                  Report Watchlist Security Incident
                </button>
              </div>
            )}

            {/* CASE 1: REGISTERED VEHICLE CONFIRMED */}
            {scannedVehicle && (
              <div className="p-6 rounded-2xl bg-slate-950 border-2 border-emerald-500 space-y-4 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <div>
                      <span className="text-emerald-400 font-extrabold text-sm font-mono tracking-wider block">
                        REGISTERED VEHICLE CONFIRMED
                      </span>
                      <span className="text-xs text-slate-400">
                        Associated with authorized society resident
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 font-mono text-xs font-bold border border-emerald-800">
                    RESIDENT STATUS
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">PLATE NUMBER</span>
                    <span className="font-mono text-base font-extrabold text-white">{scannedVehicle.plateNumber}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">RESIDENT / OWNER</span>
                    <span className="font-bold text-slate-200">{scannedVehicle.ownerName}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">HOUSE / VILLA</span>
                    <span className="font-mono text-sm font-bold text-cyan-400">{scannedVehicle.houseNumber}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">VEHICLE DETAILS</span>
                    <span className="text-slate-300">{scannedVehicle.color} {scannedVehicle.make} {scannedVehicle.model}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => handleConfirmRegisteredEntry(scannedVehicle)}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-emerald-950 border border-emerald-400/40 flex items-center space-x-2"
                  >
                    <DoorClosed className="w-4 h-4" />
                    <span>CONFIRM &amp; OPEN GATE</span>
                  </button>
                </div>
              </div>
            )}

            {/* CASE 2: UNKNOWN VEHICLE */}
            {isUnknownPlate && (
              <div className="p-6 rounded-2xl bg-slate-950 border-2 border-amber-500 space-y-4 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                    <div>
                      <span className="text-amber-400 font-extrabold text-sm font-mono tracking-wider block">
                        UNKNOWN VEHICLE
                      </span>
                      <span className="text-xs text-slate-400">
                        Plate not found in registered resident database. Verification required.
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 font-mono text-xs font-bold border border-amber-800">
                    GUEST / VISITOR
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Driver Name / Identity (Optional)</label>
                    <input
                      type="text"
                      value={unknownDriverName}
                      onChange={e => setUnknownDriverName(e.target.value)}
                      placeholder="e.g. Asad Qureshi"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Destination House / Resident to Contact</label>
                    <select
                      value={unknownSelectedHouse}
                      onChange={e => setUnknownSelectedHouse(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {houses.map(h => (
                        <option key={h.id} value={h.houseNumber}>
                          {h.houseNumber} — {h.ownerName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {approvalRequested && (
                  <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-600 text-cyan-200 text-xs flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span>Digital Approval Prompt dispatched to {unknownSelectedHouse}. Waiting for resident...</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900">
                      PENDING PROMPT
                    </span>
                  </div>
                )}

                {/* Guard Decision Options from Section 14 */}
                <div className="pt-2 flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUnknownPlate(false);
                      setPlateInput('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 font-bold text-xs border border-red-800"
                  >
                    ❌ Deny Entry
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestResidentAuthorization}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950 flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Contact Resident ({unknownSelectedHouse})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAuthorizeUnknownGuest}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase shadow-md shadow-emerald-950 flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Allow as Verified Guest</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VEHICLE EXIT */}
        {activeTab === 'VEHICLE_EXIT' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
                  <DoorClosed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">VEHICLE DEPARTURE &amp; EXIT GATE</h3>
                  <p className="text-xs text-slate-400">Record vehicle departure and update society presence records</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ACTIONS')}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Back to Fast Actions
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={exitPlateInput}
                onChange={e => setExitPlateInput(e.target.value.toUpperCase())}
                placeholder="Enter Departing Plate Number..."
                className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-3 text-sm font-mono font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 uppercase tracking-wider"
              />
              <button
                type="button"
                onClick={() => handleVehicleExit(exitPlateInput)}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-950 border border-blue-400/30 flex items-center justify-center space-x-2"
              >
                <DoorClosed className="w-4 h-4" />
                <span>Log Exit &amp; Open Gate</span>
              </button>
            </div>

            {exitSuccessNote && (
              <div className="p-4 rounded-xl bg-blue-950/80 border border-blue-500 text-blue-200 text-xs flex items-center space-x-2 animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="font-bold">{exitSuccessNote}</span>
              </div>
            )}

            {/* Currently Inside Quick Exit Selection */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Vehicles Currently Recorded Inside Society ({vehiclesInsideCount}):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {vehicles.filter(v => v.status === 'INSIDE').map(veh => (
                  <div
                    key={veh.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-white block">{veh.plateNumber}</span>
                      <span className="text-[11px] text-slate-400">{veh.houseNumber} • {veh.ownerName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleVehicleExit(veh.plateNumber)}
                      className="px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 text-xs font-bold"
                    >
                      Exit Gate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VISITOR ENTRY & DIGITAL QR PASS */}
        {activeTab === 'VISITOR_ENTRY' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">VISITOR REGISTRATION &amp; QR SCAN</h3>
                  <p className="text-xs text-slate-400">Issue visitor pass or scan pre-authorized QR invite</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ACTIONS')}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Back to Fast Actions
              </button>
            </div>

            {/* QR Pass Scanner Section */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Scan Resident Visitor QR Pass</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">RFID / QR CAMERA READY</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrScanInput}
                  onChange={e => setQrScanInput(e.target.value)}
                  placeholder="QR Data String..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleScanQrPass}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase"
                >
                  Verify QR
                </button>
              </div>
              {qrScanResult && (
                <div className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
                  qrScanResult.valid ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200' : 'bg-red-950/80 border-red-700 text-red-200'
                }`}>
                  {qrScanResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                  <span className="font-semibold">{qrScanResult.message}</span>
                </div>
              )}
            </div>

            {/* Manual Visitor Check-in Form */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Register Walk-in / Drive-in Guest:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Visitor Full Name</label>
                  <input
                    type="text"
                    value={visitorName}
                    onChange={e => setVisitorName(e.target.value)}
                    placeholder="e.g. Bilal Farooq"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={visitorPhone}
                    onChange={e => setVisitorPhone(e.target.value)}
                    placeholder="e.g. +92-300-8811223"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Destination House</label>
                  <select
                    value={visitorHouse}
                    onChange={e => setVisitorHouse(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  >
                    {houses.map(h => (
                      <option key={h.id} value={h.houseNumber}>
                        {h.houseNumber} ({h.ownerName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Vehicle Plate (If applicable)</label>
                  <input
                    type="text"
                    value={visitorPlate}
                    onChange={e => setVisitorPlate(e.target.value.toUpperCase())}
                    placeholder="e.g. GST-3411 or leave blank"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono uppercase"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!visitorName) return alert('Visitor name required');
                  handleBarrierCommand('OPEN');
                  setVisitorSuccessPass(`PASS-VP-${Math.floor(100000 + Math.random() * 900000)}`);
                  setTimeout(() => onRefresh(), 1500);
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase shadow-lg shadow-emerald-950 flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Issue Digital Gate Pass &amp; Open Gate</span>
              </button>

              {visitorSuccessPass && (
                <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-center space-y-1">
                  <span className="text-emerald-300 font-bold text-xs">VISITOR ACCESS AUTHORIZED</span>
                  <div className="font-mono text-lg font-extrabold text-white tracking-widest">{visitorSuccessPass}</div>
                  <p className="text-[11px] text-emerald-400">Pass active for 6 hours. Boom barrier opening initiated.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: DELIVERY MANAGEMENT */}
        {activeTab === 'DELIVERY' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">DELIVERY DISPATCH &amp; COURIER</h3>
                  <p className="text-xs text-slate-400">FoodPanda, UberEats, Amazon, DHL, FedEx clearance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ACTIONS')}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Back to Fast Actions
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Company / Platform</label>
                <select
                  value={deliveryCompany}
                  onChange={e => setDeliveryCompany(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-medium"
                >
                  <option value="FoodPanda">FoodPanda</option>
                  <option value="UberEats">UberEats</option>
                  <option value="Amazon">Amazon</option>
                  <option value="FedEx">FedEx</option>
                  <option value="Grocery">Society Grocery / Local Mart</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Rider Name</label>
                <input
                  type="text"
                  value={deliveryRider}
                  onChange={e => setDeliveryRider(e.target.value)}
                  placeholder="e.g. Kamran Ali"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Vehicle / Bike Plate</label>
                <input
                  type="text"
                  value={deliveryPlate}
                  onChange={e => setDeliveryPlate(e.target.value.toUpperCase())}
                  placeholder="e.g. MTR-7712"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Destination House</label>
                <select
                  value={deliveryHouse}
                  onChange={e => setDeliveryHouse(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  {houses.map(h => (
                    <option key={h.id} value={h.houseNumber}>
                      {h.houseNumber} ({h.ownerName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                handleBarrierCommand('OPEN');
                alert(`Delivery Rider approved for ${deliveryHouse}. Gate opened.`);
                onRefresh();
              }}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs uppercase shadow-lg shadow-amber-950 flex items-center justify-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>Allow Delivery Rider &amp; Open Barrier</span>
            </button>
          </div>
        )}

        {/* TAB 6: SERVICE STAFF */}
        {activeTab === 'SERVICE_STAFF' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">SERVICE WORKERS &amp; CONTRACTORS</h3>
                  <p className="text-xs text-slate-400">Electrician, Plumber, Cleaners, Gardeners &amp; Technicians</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ACTIONS')}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Back to Fast Actions
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Worker Name</label>
                <input
                  type="text"
                  value={serviceWorkerName}
                  onChange={e => setServiceWorkerName(e.target.value)}
                  placeholder="e.g. Muhammad Asif"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Trade Category</label>
                <select
                  value={serviceCategory}
                  onChange={e => setServiceCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Cleaner">Cleaner</option>
                  <option value="Gardener">Gardener</option>
                  <option value="AC Tech">AC Technician</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Assigned House</label>
                <select
                  value={serviceHouse}
                  onChange={e => setServiceHouse(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  {houses.map(h => (
                    <option key={h.id} value={h.houseNumber}>
                      {h.houseNumber} ({h.ownerName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                handleBarrierCommand('OPEN');
                alert(`Service worker ${serviceWorkerName || 'Staff'} registered for ${serviceHouse}. Barrier opened.`);
                onRefresh();
              }}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase shadow-lg shadow-purple-950 flex items-center justify-center space-x-2"
            >
              <Wrench className="w-4 h-4" />
              <span>Register Service Worker &amp; Open Gate</span>
            </button>
          </div>
        )}

        {/* TAB 7: SHIFT HANDOVER */}
        {activeTab === 'HANDOVER' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">DIGITAL SHIFT HANDOVER LOG</h3>
                  <p className="text-xs text-slate-400">Notes from outgoing guards and instructions for incoming shifts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ACTIONS')}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Back to Fast Actions
              </button>
            </div>

            {/* Add note */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200">Leave Note for Next Shift Guard:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select
                  value={handoverCategory}
                  onChange={e => setHandoverCategory(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="SUSPICIOUS_VEHICLE">Suspicious Vehicle</option>
                  <option value="EXPECTED_VIP">Expected VIP</option>
                  <option value="BARRIER_ISSUE">Barrier / Equipment Problem</option>
                  <option value="GENERAL">General Handover Note</option>
                </select>
                <input
                  type="text"
                  value={newHandoverNote}
                  onChange={e => setNewHandoverNote(e.target.value)}
                  placeholder="e.g. VIP delegation arriving Villa 101 at 4 PM, fast-track..."
                  className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newHandoverNote) return;
                    shiftNotes.unshift({
                      id: `sn_${Date.now()}`,
                      societyId: society.id,
                      gateId: currentGate.id,
                      guardId: currentGuard.id,
                      guardName: `${currentGuard.name} (${currentGuard.shift})`,
                      timestamp: 'Just now',
                      note: newHandoverNote,
                      category: handoverCategory,
                      acknowledged: false
                    });
                    setNewHandoverNote('');
                    soundEngine.playSuccessChime();
                  }}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  Record Handover Note
                </button>
              </div>
            </div>

            {/* Existing handover notes */}
            <div className="space-y-3">
              {shiftNotes.map(sn => (
                <div key={sn.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-400">{sn.guardName}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{sn.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300">{sn.note}</p>
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 mt-1">
                    {sn.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: ACTIVITY LOG */}
        {activeTab === 'ACTIVITY' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">LIVE GATE TIMELINE</h3>
                  <p className="text-xs text-slate-400">All recent movements across society perimeter gates</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ACTIONS')}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Back to Fast Actions
              </button>
            </div>

            <div className="space-y-3">
              {vehicles.flatMap(v => v.timeline.map(t => ({ ...t, plateNumber: v.plateNumber }))).slice(0, 10).map(item => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-2 h-2 rounded-full ${item.type === 'ENTRY' ? 'bg-emerald-400' : item.type === 'EXIT' ? 'bg-blue-400' : 'bg-red-400'}`} />
                    <div>
                      <div className="font-bold text-white">
                        {item.type} — Plate <span className="font-mono text-cyan-400">{item.plateNumber}</span> ({item.gateName})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Processed by {item.guardName} • {item.houseNumber || 'Guest'} {item.notes && `• ${item.notes}`}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">{item.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: GUARD ACCOUNTABILITY, PERMISSIONS & DUTY AUDIT */}
        {activeTab === 'ACCOUNTABILITY' && (
          <GuardAccountabilityAudit
            guards={guards || [currentGuard]}
            gates={gates}
            clearanceRecords={clearanceRecords || []}
            auditMode={auditMode}
            supervisorName={supervisorName}
            onRefresh={onRefresh}
          />
        )}
      </main>
    </div>
  );
};
