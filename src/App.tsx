import React, { useState, useEffect } from 'react';
import {
  Role,
  Society,
  Gate,
  Guard,
  Vehicle,
  Visitor,
  Delivery,
  ServiceWorker,
  SecurityAlert,
  Incident,
  House,
  ShiftHandoverNote,
  AuditLog,
  ResidentApprovalRequest,
  GuardClearanceRecord,
  AuditMode
} from './types';
import {
  mockSocieties,
  mockGates,
  mockGuards,
  mockVehicles,
  mockVisitors,
  mockDeliveries,
  mockServiceWorkers,
  mockSecurityAlerts,
  mockIncidents,
  mockHouses,
  mockShiftNotes,
  mockAuditLogs,
  mockClearanceRecords
} from './data/mockData';
import { api } from './services/api';
import { soundEngine } from './services/audio';
import { RoleSelectScreen } from './components/RoleSelectScreen';
import { GuardLoginModal } from './components/GuardLoginModal';
import { ManagementLoginModal } from './components/ManagementLoginModal';
import { OwnerLoginModal } from './components/OwnerLoginModal';
import { EmergencyModal } from './components/EmergencyModal';
import { GuardDashboard } from './components/GuardDashboard';
import { ManagementDashboard } from './components/ManagementDashboard';
import { OwnerDashboard } from './components/OwnerDashboard';
import { ResidentApprovalDialog } from './components/ResidentApprovalDialog';
import { SecurityMusicPlayer } from './components/SecurityMusicPlayer';

export function App() {
  // Navigation & Role Authentication
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [showGuardModal, setShowGuardModal] = useState(false);
  const [showMgmtModal, setShowMgmtModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Authenticated Entities & Audit State
  const [loggedGuard, setLoggedGuard] = useState<Guard | null>(null);
  const [isMgmtAuth, setIsMgmtAuth] = useState(false);
  const [isOwnerAuth, setIsOwnerAuth] = useState(false);
  const [auditMode, setAuditMode] = useState<AuditMode>(null);
  const [supervisorName, setSupervisorName] = useState<string | null>(null);

  // Societies
  const [societies, setSocieties] = useState<Society[]>(mockSocieties);
  const [activeSocietyId, setActiveSocietyId] = useState<string>('soc_grand_horizon');

  // Core Data
  const [gates, setGates] = useState<Gate[]>(mockGates);
  const [guards, setGuards] = useState<Guard[]>(mockGuards);
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [visitors, setVisitors] = useState<Visitor[]>(mockVisitors);
  const [deliveries, setDeliveries] = useState<Delivery[]>(mockDeliveries);
  const [serviceWorkers, setServiceWorkers] = useState<ServiceWorker[]>(mockServiceWorkers);
  const [alerts, setAlerts] = useState<SecurityAlert[]>(mockSecurityAlerts);
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [houses, setHouses] = useState<House[]>(mockHouses);
  const [shiftNotes, setShiftNotes] = useState<ShiftHandoverNote[]>(mockShiftNotes);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [clearanceRecords, setClearanceRecords] = useState<GuardClearanceRecord[]>(mockClearanceRecords);

  // Resident Approvals
  const [residentRequests, setResidentRequests] = useState<ResidentApprovalRequest[]>([
    {
      id: 'req_init_104',
      visitorName: 'Bilal Farooq',
      vehiclePlate: 'UNK-9941',
      destinationHouse: 'Villa 104',
      hostName: 'Mr. Vance Astley',
      purpose: 'Family Dinner Guest',
      gateName: 'Gate 1 (Main Entrance)',
      timestamp: 'Just now',
      status: 'PENDING'
    }
  ]);

  // Ambient Audio & Network
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'ONLINE' | 'WEAK' | 'OFFLINE'>('ONLINE');

  // Selected Gate for Guard
  const [selectedGateId, setSelectedGateId] = useState<string>('gate_1');

  // Fetch initial backend state on mount
  const refreshData = async () => {
    try {
      const state = await api.getInitialState(activeSocietyId);
      if (state) {
        if (state.gates) setGates(state.gates);
        if (state.guards) setGuards(state.guards);
        if (state.vehicles) setVehicles(state.vehicles);
        if (state.visitors) setVisitors(state.visitors);
        if (state.deliveries) setDeliveries(state.deliveries);
        if (state.serviceWorkers) setServiceWorkers(state.serviceWorkers);
        if (state.alerts) setAlerts(state.alerts);
        if (state.incidents) setIncidents(state.incidents);
        if (state.houses) setHouses(state.houses);
        if (state.shiftNotes) setShiftNotes(state.shiftNotes);
        if (state.auditLogs) setAuditLogs(state.auditLogs);
      }
    } catch {
      // Fallback in memory
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeSocietyId]);

  // Sync security music state with soundEngine
  useEffect(() => {
    const unsub = soundEngine.subscribe(state => {
      setIsAmbientPlaying(state.isPlaying);
    });
    return () => unsub();
  }, []);

  // Security music toggle
  const toggleAmbientSound = () => {
    soundEngine.toggleMusic();
  };

  // Role Selection Flow
  const handleSelectRole = (role: Role) => {
    soundEngine.playSuccessChime();
    if (role === 'GUARD') {
      if (loggedGuard) {
        setCurrentRole('GUARD');
      } else {
        setShowGuardModal(true);
      }
    } else if (role === 'MANAGEMENT') {
      if (isMgmtAuth) {
        setCurrentRole('MANAGEMENT');
      } else {
        setShowMgmtModal(true);
      }
    } else if (role === 'OWNER') {
      if (isOwnerAuth) {
        setCurrentRole('OWNER');
      } else {
        setShowOwnerModal(true);
      }
    }
  };

  // Guard / Owner / Management Login to Guard Portal Success
  const handleGuardLoginSuccess = (guard: Guard, audit?: AuditMode, supName?: string) => {
    setLoggedGuard(guard);
    setAuditMode(audit || null);
    setSupervisorName(supName || null);
    setSelectedGateId(guard.assignedGateId || gates[0]?.id || 'gate_1');
    setShowGuardModal(false);
    setCurrentRole('GUARD');
  };

  // Direct Enter Guard Portal from Owner Dashboard
  const handleEnterGuardPortalFromOwner = () => {
    const targetGuard = guards.find(g => g.assignedGateId === selectedGateId) || guards[0];
    setLoggedGuard(targetGuard);
    setAuditMode('OWNER');
    setSupervisorName('Col. (Retd) R. Jamali (Owner)');
    setCurrentRole('GUARD');
  };

  // Direct Enter Guard Portal from Management Dashboard
  const handleEnterGuardPortalFromMgmt = () => {
    const targetGuard = guards.find(g => g.assignedGateId === selectedGateId) || guards[0];
    setLoggedGuard(targetGuard);
    setAuditMode('MANAGEMENT');
    setSupervisorName('Engr. Asif Rizvi (Management)');
    setCurrentRole('GUARD');
  };

  // Return to supervisor dashboard or logout
  const handleReturnFromAudit = () => {
    if (auditMode === 'OWNER') {
      setCurrentRole('OWNER');
    } else if (auditMode === 'MANAGEMENT') {
      setCurrentRole('MANAGEMENT');
    } else {
      setCurrentRole(null);
    }
    setAuditMode(null);
    setSupervisorName(null);
  };

  // Management Login Success
  const handleMgmtLoginSuccess = () => {
    setIsMgmtAuth(true);
    setShowMgmtModal(false);
    setCurrentRole('MANAGEMENT');
  };

  // Owner Login Success
  const handleOwnerLoginSuccess = () => {
    setIsOwnerAuth(true);
    setShowOwnerModal(false);
    setCurrentRole('OWNER');
  };

  // Critical Alert Triggered by 3 Failed Attempts
  const handleCriticalAlertTriggered = () => {
    refreshData();
  };

  // Resident Decision Response
  const handleResidentDecision = async (requestId: string, decision: 'APPROVED' | 'DENIED') => {
    setResidentRequests(prev => prev.filter(r => r.id !== requestId));
    try {
      await api.respondResidentApproval(requestId, decision);
      refreshData();
    } catch {
      // Fallback
    }
  };

  const activeSociety = societies.find(s => s.id === activeSocietyId) || societies[0];
  const currentGate = gates.find(g => g.id === selectedGateId) || gates[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* 1. ROLE SELECT SCREEN (If no active role chosen) */}
      {!currentRole && (
        <RoleSelectScreen
          onSelectRole={handleSelectRole}
          activeSociety={activeSociety}
          onOpenEmergency={() => setShowEmergencyModal(true)}
          isAmbientPlaying={isAmbientPlaying}
          onToggleAmbient={toggleAmbientSound}
          networkStatus={networkStatus}
        />
      )}

      {/* 2. GUARD DASHBOARD */}
      {currentRole === 'GUARD' && loggedGuard && (
        <GuardDashboard
          society={activeSociety}
          currentGuard={loggedGuard}
          currentGate={currentGate}
          gates={gates}
          guards={guards}
          vehicles={vehicles}
          visitors={visitors}
          deliveries={deliveries}
          serviceWorkers={serviceWorkers}
          alerts={alerts}
          houses={houses}
          shiftNotes={shiftNotes}
          clearanceRecords={clearanceRecords}
          auditMode={auditMode}
          supervisorName={supervisorName || undefined}
          onReturnToRole={auditMode ? handleReturnFromAudit : undefined}
          onSwitchGuard={g => setLoggedGuard(g)}
          onSwitchGate={gateId => setSelectedGateId(gateId)}
          onLogout={() => {
            setCurrentRole(null);
            setAuditMode(null);
            setSupervisorName(null);
            setLoggedGuard(null);
          }}
          onOpenEmergency={() => setShowEmergencyModal(true)}
          onRefresh={refreshData}
        />
      )}

      {/* 3. MANAGEMENT DASHBOARD */}
      {currentRole === 'MANAGEMENT' && isMgmtAuth && (
        <ManagementDashboard
          society={activeSociety}
          societies={societies}
          onSelectSociety={socId => setActiveSocietyId(socId)}
          gates={gates}
          guards={guards}
          vehicles={vehicles}
          visitors={visitors}
          deliveries={deliveries}
          serviceWorkers={serviceWorkers}
          alerts={alerts}
          incidents={incidents}
          houses={houses}
          shiftNotes={shiftNotes}
          auditLogs={auditLogs}
          onEnterGuardPortal={handleEnterGuardPortalFromMgmt}
          onLogout={() => setCurrentRole(null)}
          onOpenEmergency={() => setShowEmergencyModal(true)}
          onRefresh={refreshData}
        />
      )}

      {/* 4. OWNER DASHBOARD */}
      {currentRole === 'OWNER' && isOwnerAuth && (
        <OwnerDashboard
          societies={societies}
          activeSociety={activeSociety}
          onSelectSociety={socId => setActiveSocietyId(socId)}
          alerts={alerts}
          incidents={incidents}
          auditLogs={auditLogs}
          houses={houses}
          vehicles={vehicles}
          onEnterGuardPortal={handleEnterGuardPortalFromOwner}
          onOpenEmergency={() => setShowEmergencyModal(true)}
          onLogout={() => setCurrentRole(null)}
          onRefresh={refreshData}
        />
      )}

      {/* AUTHENTICATION MODALS */}
      <GuardLoginModal
        isOpen={showGuardModal}
        onClose={() => setShowGuardModal(false)}
        gates={gates}
        guards={guards}
        onSuccess={handleGuardLoginSuccess}
      />

      <ManagementLoginModal
        isOpen={showMgmtModal}
        onClose={() => setShowMgmtModal(false)}
        onSuccess={handleMgmtLoginSuccess}
        onCriticalAlertTriggered={handleCriticalAlertTriggered}
      />

      <OwnerLoginModal
        isOpen={showOwnerModal}
        onClose={() => setShowOwnerModal(false)}
        onSuccess={handleOwnerLoginSuccess}
        onCriticalAlertTriggered={handleCriticalAlertTriggered}
      />

      {/* EMERGENCY MODAL */}
      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        society={activeSociety}
        currentGate={currentGate}
        currentGuard={loggedGuard || undefined}
        onEmergencyTriggered={() => refreshData()}
      />

      {/* FLOATING RESIDENT APPROVAL PROMPT (Simulates Resident Receiving Push Notification) */}
      <ResidentApprovalDialog
        requests={residentRequests}
        onRespond={handleResidentDecision}
      />

      {/* FLOATING LOW SOUND SECURITY MUSIC CONSOLE */}
      <SecurityMusicPlayer />
    </div>
  );
}

export default App;
