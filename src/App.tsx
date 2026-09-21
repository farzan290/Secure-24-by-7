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
import { SocietyPortalPage } from './components/SocietyPortalPage';
import { GuardLoginModal } from './components/GuardLoginModal';
import { ManagementLoginModal } from './components/ManagementLoginModal';
import { OwnerLoginModal } from './components/OwnerLoginModal';
import { EmergencyModal } from './components/EmergencyModal';
import { GuardDashboard } from './components/GuardDashboard';
import { ManagementDashboard } from './components/ManagementDashboard';
import { OwnerDashboard } from './components/OwnerDashboard';
import { ResidentMessagesPortal } from './components/ResidentMessagesPortal';
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
  const [isViewingSocietyPage, setIsViewingSocietyPage] = useState<boolean>(false);

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

  // Read URL query parameter on initial load (e.g. ?society=aeechs or ?society=grand_horizon)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const socParam = params.get('society') || params.get('soc');
      if (socParam) {
        const found = societies.find(s =>
          s.id.toLowerCase() === socParam.toLowerCase() ||
          s.id.toLowerCase() === `soc_${socParam.toLowerCase()}` ||
          s.name.toLowerCase().includes(socParam.toLowerCase())
        );
        if (found) {
          setActiveSocietyId(found.id);
          if (params.get('page') === 'society') {
            setIsViewingSocietyPage(true);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [societies]);

  // Synchronize active society to browser address bar for one-click sharing
  useEffect(() => {
    try {
      const currentUrl = new URL(window.location.href);
      const cleanCode = activeSocietyId.replace('soc_', '');
      currentUrl.searchParams.set('society', cleanCode);
      if (isViewingSocietyPage) {
        currentUrl.searchParams.set('page', 'society');
      } else {
        currentUrl.searchParams.delete('page');
      }
      window.history.replaceState({}, '', currentUrl.toString());
    } catch {
      // ignore
    }
  }, [activeSocietyId, isViewingSocietyPage]);

  // Resident Approvals (Empty initial state - requests appear only when actively dispatched by guards)
  const [residentRequests, setResidentRequests] = useState<ResidentApprovalRequest[]>([]);

  // Ambient Audio & Network
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'ONLINE' | 'WEAK' | 'OFFLINE'>('ONLINE');

  // Selected Gate for Guard
  const [selectedGateId, setSelectedGateId] = useState<string>('gate_1');

  // Fetch initial backend state on mount
  const refreshData = async (targetSocietyId?: string) => {
    const socId = targetSocietyId || activeSocietyId;
    try {
      const state = await api.getInitialState(socId);
      if (state) {
        if (state.gates && state.gates.length > 0) {
          setGates(prev => {
            const other = prev.filter(g => g.societyId && g.societyId !== socId);
            return [...state.gates, ...other];
          });
        }
        if (state.guards && state.guards.length > 0) {
          setGuards(prev => {
            const other = prev.filter(g => g.societyId && g.societyId !== socId);
            return [...state.guards, ...other];
          });
        }
        if (state.vehicles && state.vehicles.length > 0) {
          setVehicles(prev => {
            const other = prev.filter(v => v.societyId && v.societyId !== socId);
            return [...state.vehicles, ...other];
          });
        }
        if (state.visitors) setVisitors(state.visitors);
        if (state.deliveries) setDeliveries(state.deliveries);
        if (state.serviceWorkers) setServiceWorkers(state.serviceWorkers);
        if (state.alerts) setAlerts(state.alerts);
        if (state.incidents) setIncidents(state.incidents);
        if (state.houses && state.houses.length > 0) {
          setHouses(prev => {
            const other = prev.filter(h => h.societyId && h.societyId !== socId);
            const seen = new Set<string>();
            const deduped: House[] = [];
            for (const h of [...state.houses, ...other]) {
              const keyNum = `${h.societyId || ''}::${(h.houseNumber || '').trim().toLowerCase()}`;
              const keyId = h.id;
              if (!seen.has(keyId) && !seen.has(keyNum)) {
                seen.add(keyId);
                seen.add(keyNum);
                deduped.push(h);
              }
            }
            return deduped;
          });
        }
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
      // Always prompt for password before entering society management portal
      setShowMgmtModal(true);
    } else if (role === 'OWNER') {
      if (isOwnerAuth) {
        setCurrentRole('OWNER');
      } else {
        setShowOwnerModal(true);
      }
    } else if (role === 'RMP') {
      setCurrentRole('RMP');
    }
  };

  // Guard / Owner / Management Login to Guard Portal Success
  const handleGuardLoginSuccess = (guard: Guard, audit?: AuditMode, supName?: string) => {
    setLoggedGuard(guard);
    setGuards(prev => prev.map(g => g.id === guard.id ? guard : g));
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

  // Add new society from the first screen or management
  const handleAddSociety = (newSociety: Society) => {
    setSocieties(prev => [newSociety, ...prev]);
    setActiveSocietyId(newSociety.id);

    // Automatically provision starter guards for the new society
    const newGuards: Guard[] = [
      {
        id: `guard_${newSociety.id}_1`,
        societyId: newSociety.id,
        name: 'Subedar Tariq Mehmood',
        badgeNumber: 'SEC-101',
        contactNumber: '+92-300-8811224',
        cnic: '37405-1234567-1',
        assignedGateId: `gate_${newSociety.id}_1`,
        shift: 'MORNING',
        dutyStatus: 'ON_DUTY',
        identityVerified: true,
        identityDocName: 'VERIFIED_DUTY_CODE',
        attendanceRate: 100,
        incidentsReported: 0,
        shiftStartTime: '06:00 AM',
        accessCode: '1234'
      },
      {
        id: `guard_${newSociety.id}_2`,
        societyId: newSociety.id,
        name: 'Officer Zulfiqar Ali',
        badgeNumber: 'SEC-102',
        contactNumber: '+92-321-4455668',
        cnic: '37405-7654321-3',
        assignedGateId: `gate_${newSociety.id}_2`,
        shift: 'EVENING',
        dutyStatus: 'ON_DUTY',
        identityVerified: true,
        identityDocName: 'VERIFIED_DUTY_CODE',
        attendanceRate: 100,
        incidentsReported: 0,
        shiftStartTime: '02:00 PM',
        accessCode: '5678'
      }
    ];

    // Automatically provision starter gates for the new society
    const newGates: Gate[] = [
      {
        id: `gate_${newSociety.id}_1`,
        societyId: newSociety.id,
        name: 'Main Gate (North Boulevard)',
        gateNumber: 1,
        location: `${newSociety.name} Main Access`,
        type: 'MAIN',
        assignedGuardIds: [newGuards[0].id],
        status: 'ONLINE',
        barrierState: 'CLOSED',
        barrierMode: 'SIMULATION',
        cameraOnline: true,
        direction: 'TWO_WAY',
        vehiclesEnteredToday: 0,
        vehiclesExitedToday: 0
      },
      {
        id: `gate_${newSociety.id}_2`,
        societyId: newSociety.id,
        name: 'Gate 2 (South Perimeter)',
        gateNumber: 2,
        location: `${newSociety.name} Secondary Access`,
        type: 'SECONDARY',
        assignedGuardIds: [newGuards[1].id],
        status: 'ONLINE',
        barrierState: 'CLOSED',
        barrierMode: 'SIMULATION',
        cameraOnline: true,
        direction: 'TWO_WAY',
        vehiclesEnteredToday: 0,
        vehiclesExitedToday: 0
      }
    ];
    setGates(prev => [...newGates, ...prev]);
    setGuards(prev => [...newGuards, ...prev]);
    setSelectedGateId(newGates[0].id);

    // Automatically provision starter resident houses for this society
    const newHouses: House[] = [
      {
        id: `house_${newSociety.id}_101`,
        societyId: newSociety.id,
        houseNumber: 'Villa 101',
        block: 'Sector A',
        street: 'North Boulevard',
        ownerName: 'Dr. Tariq Al-Mansoor',
        residentCount: 4,
        contactNumber: '+92-300-4455661',
        email: 'tariq.mansoor@example.com',
        registeredPlates: ['LEA-1010'],
        emergencyContact: '+92-321-7788991',
        currentVisitorsCount: 0
      },
      {
        id: `house_${newSociety.id}_102`,
        societyId: newSociety.id,
        houseNumber: 'Villa 102',
        block: 'Sector A',
        street: 'Palm Avenue',
        ownerName: 'Begum Farida Khan',
        residentCount: 3,
        contactNumber: '+92-333-5566772',
        email: 'farida.khan@example.com',
        registeredPlates: ['KHI-2020'],
        emergencyContact: '+92-345-9988772',
        currentVisitorsCount: 0
      },
      {
        id: `house_${newSociety.id}_103`,
        societyId: newSociety.id,
        houseNumber: 'Villa 103',
        block: 'Sector B',
        street: 'Pine Court',
        ownerName: 'Engr. Haris Mehmood',
        residentCount: 5,
        contactNumber: '+92-312-8899003',
        email: 'haris.mehmood@example.com',
        registeredPlates: ['ISB-3030'],
        emergencyContact: '+92-301-2233443',
        currentVisitorsCount: 0
      }
    ];
    setHouses(prev => [...newHouses, ...prev]);

    // Provision starter vehicles for this society
    const newVehicles: Vehicle[] = [
      {
        id: `veh_${newSociety.id}_1`,
        societyId: newSociety.id,
        plateNumber: 'LEA-1010',
        type: 'SUV',
        make: 'Toyota',
        model: 'Land Cruiser Prado',
        color: 'Pearl White',
        ownerName: 'Dr. Tariq Al-Mansoor',
        houseNumber: 'Villa 101',
        contactNumber: '+92-300-4455661',
        classification: 'RESIDENT',
        status: 'INSIDE',
        lastGateId: `gate_${newSociety.id}_1`,
        lastGateName: 'Main Gate (North Boulevard)',
        lastEntryTime: '08:30 AM Today',
        timeline: [
          {
            id: `evt_${newSociety.id}_1`,
            timestamp: '08:30 AM Today',
            type: 'ENTRY',
            gateName: 'Main Gate (North Boulevard)',
            guardName: 'Tariq Mehmood',
            notes: 'RFID Smart Clearance'
          }
        ]
      },
      {
        id: `veh_${newSociety.id}_2`,
        societyId: newSociety.id,
        plateNumber: 'ISB-3030',
        type: 'CAR',
        make: 'Honda',
        model: 'Civic RS Turbo',
        color: 'Metallic Grey',
        ownerName: 'Engr. Haris Mehmood',
        houseNumber: 'Villa 103',
        contactNumber: '+92-312-8899003',
        classification: 'RESIDENT',
        status: 'INSIDE',
        lastGateId: `gate_${newSociety.id}_1`,
        lastGateName: 'Main Gate (North Boulevard)',
        lastEntryTime: '09:15 AM Today',
        timeline: [
          {
            id: `evt_${newSociety.id}_2`,
            timestamp: '09:15 AM Today',
            type: 'ENTRY',
            gateName: 'Main Gate (North Boulevard)',
            guardName: 'Tariq Mehmood',
            notes: 'Resident Verified'
          }
        ]
      }
    ];
    setVehicles(prev => [...newVehicles, ...prev]);

    // Asynchronously synchronize new society and starter resources to server backend
    api.createSociety({
      society: newSociety,
      gates: newGates,
      houses: newHouses,
      vehicles: newVehicles,
      guards: newGuards
    }).catch(err => {
      console.warn('Backend sync notice for new society:', err);
    });

    soundEngine.playSuccessChime();
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

  // Strictly scope collections to the active society (AEECHS, Grand Horizon, etc.)
  const scopedHouses = houses.filter(h => !h.societyId || h.societyId === activeSociety.id);
  const scopedVehicles = vehicles.filter(v => !v.societyId || v.societyId === activeSociety.id);
  const scopedGates = gates.filter(g => !g.societyId || g.societyId === activeSociety.id);
  const scopedGuards = guards.filter(g => !g.societyId || g.societyId === activeSociety.id);
  const scopedVisitors = visitors.filter(v => !v.societyId || v.societyId === activeSociety.id);
  const scopedDeliveries = deliveries.filter(d => !d.societyId || d.societyId === activeSociety.id);
  const scopedServiceWorkers = serviceWorkers.filter(s => !s.societyId || s.societyId === activeSociety.id);
  const scopedAlerts = alerts.filter(a => !a.societyId || a.societyId === activeSociety.id);
  const scopedIncidents = incidents.filter(i => !i.societyId || i.societyId === activeSociety.id);
  const scopedShiftNotes = shiftNotes.filter(n => !n.societyId || n.societyId === activeSociety.id);
  const scopedAuditLogs = auditLogs.filter(a => !a.societyId || a.societyId === activeSociety.id);

  const currentGate = scopedGates.find(g => g.id === selectedGateId) || scopedGates[0] || gates[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* 1A. SEPARATE DEDICATED SOCIETY PAGE VIEW */}
      {!currentRole && isViewingSocietyPage && (
        <SocietyPortalPage
          society={activeSociety}
          societies={societies}
          onSelectSociety={socId => setActiveSocietyId(socId)}
          onSelectRole={role => {
            setIsViewingSocietyPage(false);
            handleSelectRole(role);
          }}
          onBackToHome={() => setIsViewingSocietyPage(false)}
          houses={houses}
          vehicles={vehicles}
          gates={gates}
          guards={guards}
        />
      )}

      {/* 1B. ROLE SELECT SCREEN (If no active role chosen and not on separate society page) */}
      {!currentRole && !isViewingSocietyPage && (
        <RoleSelectScreen
          onSelectRole={handleSelectRole}
          activeSociety={activeSociety}
          societies={societies}
          onSelectSociety={socId => setActiveSocietyId(socId)}
          onAddSociety={handleAddSociety}
          onViewSocietyPage={socId => {
            setActiveSocietyId(socId);
            setIsViewingSocietyPage(true);
          }}
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
          gates={scopedGates}
          guards={scopedGuards}
          vehicles={scopedVehicles}
          visitors={scopedVisitors}
          deliveries={scopedDeliveries}
          serviceWorkers={scopedServiceWorkers}
          alerts={scopedAlerts}
          houses={scopedHouses}
          shiftNotes={scopedShiftNotes}
          clearanceRecords={clearanceRecords}
          auditMode={auditMode}
          supervisorName={supervisorName || undefined}
          onReturnToRole={auditMode ? handleReturnFromAudit : undefined}
          onSwitchToManagement={() => handleSelectRole('MANAGEMENT')}
          onSwitchGuard={g => setLoggedGuard(g)}
          onSwitchGate={gateId => {
            setSelectedGateId(gateId);
            if (loggedGuard) {
              const updated = { ...loggedGuard, assignedGateId: gateId };
              setLoggedGuard(updated);
              setGuards(prev => prev.map(g => g.id === loggedGuard.id ? updated : g));
              api.updateGuard(loggedGuard.id, { assignedGateId: gateId }).catch(console.error);
            }
          }}
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
          gates={scopedGates}
          guards={scopedGuards}
          vehicles={scopedVehicles}
          visitors={scopedVisitors}
          deliveries={scopedDeliveries}
          serviceWorkers={scopedServiceWorkers}
          alerts={scopedAlerts}
          incidents={scopedIncidents}
          houses={scopedHouses}
          shiftNotes={scopedShiftNotes}
          auditLogs={scopedAuditLogs}
          onEnterGuardPortal={handleEnterGuardPortalFromMgmt}
          onLogout={() => {
            setCurrentRole(null);
            setIsMgmtAuth(false);
          }}
          onOpenEmergency={() => setShowEmergencyModal(true)}
          onRefresh={refreshData}
          onAddGuard={newGuard => {
            setGuards(prev => [newGuard, ...prev]);
          }}
          onUpdateGuard={updatedGuard => {
            setGuards(prev => prev.map(g => g.id === updatedGuard.id ? updatedGuard : g));
          }}
          onUpdateGate={updatedGate => {
            setGates(prev => prev.map(gt => gt.id === updatedGate.id ? updatedGate : gt));
          }}
          onSaveHouse={savedHouse => {
            setHouses(prev => {
              // Deduplicate by id, (societyId + houseNumber), or (societyId + ownerName)
              const existingIdx = prev.findIndex(h =>
                h.id === savedHouse.id ||
                (h.societyId === savedHouse.societyId &&
                  (h.houseNumber.trim().toLowerCase() === savedHouse.houseNumber.trim().toLowerCase() ||
                   h.ownerName.trim().toLowerCase() === savedHouse.ownerName.trim().toLowerCase()))
              );
              if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx] = savedHouse;
                // Filter out any other accidental duplicates that might have existed
                return updated.filter((h, idx) =>
                  idx === existingIdx ||
                  h.id !== savedHouse.id &&
                  (h.societyId !== savedHouse.societyId ||
                    (h.houseNumber.trim().toLowerCase() !== savedHouse.houseNumber.trim().toLowerCase() &&
                     h.ownerName.trim().toLowerCase() !== savedHouse.ownerName.trim().toLowerCase()))
                );
              }
              return [savedHouse, ...prev];
            });
          }}
          onDeleteHouse={houseId => {
            setHouses(prev => prev.filter(h => h.id !== houseId));
          }}
        />
      )}

      {/* 4. OWNER DASHBOARD */}
      {currentRole === 'OWNER' && isOwnerAuth && (
        <OwnerDashboard
          societies={societies}
          activeSociety={activeSociety}
          onSelectSociety={socId => setActiveSocietyId(socId)}
          alerts={scopedAlerts}
          incidents={scopedIncidents}
          auditLogs={scopedAuditLogs}
          houses={scopedHouses}
          vehicles={scopedVehicles}
          onEnterGuardPortal={handleEnterGuardPortalFromOwner}
          onEnterManagementPortal={() => handleSelectRole('MANAGEMENT')}
          onOpenEmergency={() => setShowEmergencyModal(true)}
          onLogout={() => setCurrentRole(null)}
          onRefresh={refreshData}
        />
      )}

      {/* 5. RMP — RESIDENT MESSAGES PORTAL */}
      {currentRole === 'RMP' && (
        <ResidentMessagesPortal
          society={activeSociety}
          societies={societies}
          onSelectSociety={socId => setActiveSocietyId(socId)}
          onLogout={() => setCurrentRole(null)}
          onNavigateToGuard={() => handleSelectRole('GUARD')}
          onOpenEmergency={() => setShowEmergencyModal(true)}
        />
      )}

      {/* AUTHENTICATION MODALS */}
      <GuardLoginModal
        isOpen={showGuardModal}
        onClose={() => setShowGuardModal(false)}
        gates={scopedGates}
        guards={scopedGuards}
        onSuccess={handleGuardLoginSuccess}
      />

      <ManagementLoginModal
        isOpen={showMgmtModal}
        society={activeSociety}
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

      {/* FLOATING RESIDENT APPROVAL PROMPT (Never shown on landing/first page; only when user is inside a role portal and active request exists) */}
      {currentRole && residentRequests.length > 0 && (
        <ResidentApprovalDialog
          requests={residentRequests}
          onRespond={handleResidentDecision}
        />
      )}

      {/* FLOATING LOW SOUND SECURITY MUSIC CONSOLE */}
      <SecurityMusicPlayer />
    </div>
  );
}

export default App;
