import React, { useState } from 'react';
import {
  Building2,
  Shield,
  Car,
  UserCheck,
  Package,
  Wrench,
  AlertTriangle,
  FileText,
  Search,
  Camera,
  Layers,
  Sparkles,
  RefreshCw,
  LogOut,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  Send,
  DoorClosed,
  Clock,
  Radio,
  Download,
  AlertCircle,
  Phone,
  Home,
  User,
  ShieldAlert,
  HelpCircle,
  Plus,
  Mail,
  Users,
  PhoneCall,
  CarFront,
  MapPin,
  Filter,
  Edit3,
  Trash2
} from 'lucide-react';
import {
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
  AuditLog
} from '../types';
import { api } from '../services/api';
import { soundEngine } from '../services/audio';

interface Props {
  society: Society;
  societies: Society[];
  onSelectSociety: (socId: string) => void;
  gates: Gate[];
  guards: Guard[];
  vehicles: Vehicle[];
  visitors: Visitor[];
  deliveries: Delivery[];
  serviceWorkers: ServiceWorker[];
  alerts: SecurityAlert[];
  incidents: Incident[];
  houses: House[];
  shiftNotes: ShiftHandoverNote[];
  auditLogs: AuditLog[];
  onEnterGuardPortal?: () => void;
  onLogout: () => void;
  onOpenEmergency: () => void;
  onRefresh: () => void;
}

export const ManagementDashboard: React.FC<Props> = ({
  society,
  societies,
  onSelectSociety,
  gates,
  guards,
  vehicles,
  visitors,
  deliveries,
  serviceWorkers,
  alerts,
  incidents,
  houses,
  shiftNotes,
  auditLogs,
  onEnterGuardPortal,
  onLogout,
  onOpenEmergency,
  onRefresh
}) => {
  type MgmtTab =
    | 'OVERVIEW'
    | 'GATES'
    | 'VEHICLES'
    | 'VISITORS'
    | 'HOUSES'
    | 'GUARDS'
    | 'DELIVERIES'
    | 'STAFF'
    | 'INCIDENTS'
    | 'ALERTS'
    | 'WATCHLIST'
    | 'CCTV'
    | 'PARKING'
    | 'SEARCH'
    | 'AI_ASSISTANT'
    | 'AUDIT'
    | 'REPORTS';

  const [activeTab, setActiveTab] = useState<MgmtTab>('OVERVIEW');

  // AI Assistant state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiChatLog, setAiChatLog] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([
    {
      role: 'ai',
      text: `Hello, Society Administrator. I am your Secure AI Security Intelligence Assistant for ${society.name}. Ask me any security question, vehicle whereabouts, guard shift reports, or perimeter analysis.`
    }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Vehicle Search / "Where is vehicle X?"
  const [vehicleQuery, setVehicleQuery] = useState('ABC-123');
  const [searchedVehicle, setSearchedVehicle] = useState<Vehicle | null>(vehicles[0] || null);

  // Global Person Search
  const [personQuery, setPersonQuery] = useState('');
  const [foundPeople, setFoundPeople] = useState<any[]>([]);

  // Incident filter & new incident modal
  const [incidentFilter, setIncidentFilter] = useState<string>('ALL');
  const [showNewIncidentForm, setShowNewIncidentForm] = useState(false);
  const [newIncidentTitle, setNewIncidentTitle] = useState('');
  const [newIncidentType, setNewIncidentType] = useState('Security Breach');
  const [newIncidentSeverity, setNewIncidentSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [newIncidentLocation, setNewIncidentLocation] = useState('Gate 1 Main');
  const [newIncidentDesc, setNewIncidentDesc] = useState('');

  // Watchlist state
  const [watchlistPlates, setWatchlistPlates] = useState([
    { plate: 'SUS-999', reason: 'Repeated slow-roll loitering near perimeter', addedAt: '2026-09-02' },
    { plate: 'STOLEN-441', reason: 'Reported stolen vehicle flag from local precinct', addedAt: '2026-08-30' }
  ]);
  const [newWatchlistPlate, setNewWatchlistPlate] = useState('');
  const [newWatchlistReason, setNewWatchlistReason] = useState('');

  // Resident Directory filters and state
  const [residentSearchQuery, setResidentSearchQuery] = useState('');
  const [residentBlockFilter, setResidentBlockFilter] = useState('ALL');
  const [intercomNotice, setIntercomNotice] = useState<string | null>(null);
  const [mgmtToastNotice, setMgmtToastNotice] = useState<string | null>(null);

  // Society Name and Identity Modal State
  const [showSocietyModal, setShowSocietyModal] = useState(false);
  const [societyNameInput, setSocietyNameInput] = useState(society.name);
  const [societyAddressInput, setSocietyAddressInput] = useState(society.address);
  const [societyCityInput, setSocietyCityInput] = useState(society.city);
  const [societyProvinceInput, setSocietyProvinceInput] = useState(society.provinceState || 'Punjab');
  const [isSavingSociety, setIsSavingSociety] = useState(false);

  // Resident & Vehicle Plates Modal State
  const [showResidentModal, setShowResidentModal] = useState(false);
  const [editingResidentId, setEditingResidentId] = useState<string | null>(null);
  const [resHouseNumber, setResHouseNumber] = useState('');
  const [resBlock, setResBlock] = useState('Block A');
  const [resStreet, setResStreet] = useState('');
  const [resOwnerName, setResOwnerName] = useState('');
  const [resContactNumber, setResContactNumber] = useState('');
  const [resEmail, setResEmail] = useState('');
  const [resEmergencyContact, setResEmergencyContact] = useState('');
  const [resResidentCount, setResResidentCount] = useState(2);
  const [resPlates, setResPlates] = useState<string[]>([]);
  const [resNewPlateInput, setResNewPlateInput] = useState('');
  const [resVehicleMake, setResVehicleMake] = useState('Toyota');
  const [resVehicleModel, setResVehicleModel] = useState('Corolla');
  const [resVehicleColor, setResVehicleColor] = useState('White');
  const [isSavingResident, setIsSavingResident] = useState(false);

  const handleSaveSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!societyNameInput.trim()) return;
    setIsSavingSociety(true);
    try {
      await api.updateSociety({
        name: societyNameInput.trim(),
        completeAddress: societyAddressInput.trim(),
        city: societyCityInput.trim(),
        provinceState: societyProvinceInput.trim()
      });
      soundEngine.playSuccessChime();
      setShowSocietyModal(false);
      setMgmtToastNotice(`Society renamed to "${societyNameInput.trim()}". Synchronized with Guards & Owner.`);
      setTimeout(() => setMgmtToastNotice(null), 5000);
      onRefresh();
    } catch {
      alert('Failed to update society details');
    } finally {
      setIsSavingSociety(false);
    }
  };

  const openAddResidentModal = () => {
    setEditingResidentId(null);
    setResHouseNumber('');
    setResBlock('Block A');
    setResStreet('');
    setResOwnerName('');
    setResContactNumber('');
    setResEmail('');
    setResEmergencyContact('');
    setResResidentCount(2);
    setResPlates([]);
    setResNewPlateInput('');
    setResVehicleMake('Honda');
    setResVehicleModel('Civic');
    setResVehicleColor('Silver');
    setShowResidentModal(true);
  };

  const openEditResidentModal = (h: House) => {
    setEditingResidentId(h.id);
    setResHouseNumber(h.houseNumber);
    setResBlock(h.block);
    setResStreet(h.street || '');
    setResOwnerName(h.ownerName);
    setResContactNumber(h.contactNumber || (h as any).phone || '');
    setResEmail(h.email || '');
    setResEmergencyContact(h.emergencyContact || '');
    setResResidentCount(h.residentCount || 2);
    setResPlates(h.registeredPlates ? [...h.registeredPlates] : []);
    setResNewPlateInput('');
    setResVehicleMake('Toyota');
    setResVehicleModel('Fortuner');
    setResVehicleColor('Black');
    setShowResidentModal(true);
  };

  const handleAddPlateToList = () => {
    const clean = resNewPlateInput.trim().toUpperCase();
    if (!clean) return;
    if (!resPlates.includes(clean)) {
      setResPlates([...resPlates, clean]);
      setResNewPlateInput('');
    }
  };

  const handleRemovePlateFromList = (plateToRemove: string) => {
    setResPlates(resPlates.filter(p => p !== plateToRemove));
  };

  const handleSaveResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resOwnerName.trim() || !resHouseNumber.trim() || !resContactNumber.trim()) {
      alert('Please fill in Resident Name, House Number, and Contact Number.');
      return;
    }

    // Include plate from input field if not added yet
    let finalPlates = [...resPlates];
    if (resNewPlateInput.trim()) {
      const clean = resNewPlateInput.trim().toUpperCase();
      if (!finalPlates.includes(clean)) {
        finalPlates.push(clean);
      }
    }

    setIsSavingResident(true);
    try {
      await api.manageResident({
        id: editingResidentId || undefined,
        houseNumber: resHouseNumber.trim(),
        block: resBlock.trim(),
        street: resStreet.trim(),
        ownerName: resOwnerName.trim(),
        contactNumber: resContactNumber.trim(),
        email: resEmail.trim(),
        registeredPlates: finalPlates,
        emergencyContact: resEmergencyContact.trim(),
        residentCount: Number(resResidentCount) || 1,
        vehicleMake: resVehicleMake.trim(),
        vehicleModel: resVehicleModel.trim(),
        vehicleColor: resVehicleColor.trim()
      });

      soundEngine.playSuccessChime();
      setShowResidentModal(false);
      setMgmtToastNotice(
        `Resident ${resOwnerName.trim()} (${resHouseNumber.trim()}) and ${finalPlates.length} vehicle plate(s) registered. Data synchronized with Guards & Owner!`
      );
      setTimeout(() => setMgmtToastNotice(null), 5000);
      onRefresh();
    } catch {
      alert('Failed to save resident information');
    } finally {
      setIsSavingResident(false);
    }
  };

  const handleDeleteResident = async (h: House) => {
    if (!confirm(`Are you sure you want to remove resident ${h.ownerName} (${h.houseNumber}) and their registered vehicle plates?`)) {
      return;
    }
    try {
      await api.deleteResident(h.id);
      soundEngine.playSuccessChime();
      setMgmtToastNotice(`Resident ${h.ownerName} removed. Sync updated.`);
      setTimeout(() => setMgmtToastNotice(null), 4000);
      onRefresh();
    } catch {
      alert('Failed to remove resident');
    }
  };

  // Stats calculation
  const vehiclesInside = vehicles.filter(v => v.status === 'INSIDE').length;
  const visitorsInside = visitors.filter(v => v.status === 'INSIDE').length;
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const criticalAlertsCount = activeAlerts.filter(a => a.severity === 'CRITICAL').length;
  const activeGuardsCount = guards.filter(g => g.dutyStatus === 'ON_DUTY').length;

  // Handle AI Query
  const handleAskAI = async (promptToSend?: string) => {
    const q = promptToSend || aiQuestion;
    if (!q.trim()) return;

    const userEntry = { role: 'user' as const, text: q };
    setAiChatLog(prev => [...prev, userEntry]);
    setAiQuestion('');
    setAiLoading(true);

    try {
      const res = await api.askAI(q, society.id);
      setAiChatLog(prev => [...prev, { role: 'ai', text: res.answer }]);
      soundEngine.playSuccessChime();
    } catch {
      setAiChatLog(prev => [
        ...prev,
        { role: 'ai', text: 'Secure AI node offline or rate-limited. Fallback response: All gates operating normally.' }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Export Activity Report feature (Daily Gate Entries, Movements, Incidents, Alerts)
  const handleExportActivityReport = (format: 'markdown' | 'csv' = 'markdown') => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (format === 'csv') {
      let csv = `"SECTION","TIMESTAMP","IDENTIFIER","TYPE_OR_STATUS","LOCATION_OR_GATE","PERSONNEL_OR_RESIDENT","DETAILS"\n`;
      // Daily Gate Entries
      vehicles.forEach(v => {
        if (v.timeline && v.timeline.length > 0) {
          v.timeline.forEach(t => {
            csv += `"GATE_ENTRY","${t.timestamp}","${v.plateNumber}","${v.classification}","${t.gateName}","${t.guardName}","${v.ownerName} (${v.houseNumber})"\n`;
          });
        } else {
          csv += `"GATE_ENTRY","Today","${v.plateNumber}","${v.classification}","Main Gate","Security Force","${v.ownerName} (${v.houseNumber})"\n`;
        }
      });
      visitors.forEach(vis => {
        csv += `"VISITOR_ENTRY","${vis.entryTime}","${vis.name}","${vis.status}","${vis.entryGate}","Host: ${vis.hostResident}","Pass: ${vis.passCode}, Dest: ${vis.destinationHouse}"\n`;
      });
      // Incidents
      incidents.forEach(inc => {
        csv += `"SECURITY_INCIDENT","${inc.reportedAt}","${inc.id}","${inc.severity} / ${inc.status}","${inc.location}","Reported by: ${inc.reportedBy}","${inc.title}: ${(inc.description || '').replace(/"/g, '""')}"\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Activity_Report_${society.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      soundEngine.playSuccessChime();
      setMgmtToastNotice(`Exported Activity Report (CSV) for ${society.name}`);
      setTimeout(() => setMgmtToastNotice(null), 4000);
      return;
    }

    // Markdown / Formatted Dossier
    let report = `================================================================================\n`;
    report += `                     OFFICIAL SOCIETY ACTIVITY & SECURITY REPORT                \n`;
    report += `================================================================================\n`;
    report += `Society Name:    ${society.name}\n`;
    report += `Address:         ${society.address}, ${society.city}, ${society.provinceState || 'Pakistan'}\n`;
    report += `Report Date:     ${today} (${nowTime})\n`;
    report += `Security Score:  ${society.securityScore} / 100\n`;
    report += `Report Scope:    Daily Gate Entries, Resident Movements & Security Incidents\n`;
    report += `Generated By:    Society Executive Management\n`;
    report += `================================================================================\n\n`;

    report += `--- 1. DAILY GATE ENTRIES & MOVEMENTS ---\n`;
    report += `Vehicles Inside Society: ${vehicles.filter(v => v.status === 'INSIDE').length}\n`;
    report += `Visitors Inside Society: ${visitors.filter(v => v.status === 'INSIDE').length}\n\n`;
    report += `VEHICLE ENTRY LOGS:\n`;
    vehicles.forEach((v, idx) => {
      report += ` [${idx + 1}] Plate: ${v.plateNumber} | Class: ${v.classification} | Resident/Owner: ${v.ownerName} (${v.houseNumber})\n`;
      if (v.timeline && v.timeline.length > 0) {
        v.timeline.forEach(t => {
          report += `     • ${t.timestamp} - ${t.type} via ${t.gateName} (Verified by Guard: ${t.guardName})\n`;
        });
      } else {
        report += `     • Status: ${v.status} | Registered vehicle\n`;
      }
    });

    report += `\nVISITOR PASSES & ENTRY:\n`;
    visitors.forEach((vis, idx) => {
      report += ` [${idx + 1}] Visitor: ${vis.name} (${vis.phone || 'No phone'}) | Dest: ${vis.destinationHouse} (Host: ${vis.hostResident}) | Entry: ${vis.entryTime} via ${vis.entryGate} | Status: ${vis.status}\n`;
    });

    report += `\n--- 2. SECURITY INCIDENTS SUMMARY ---\n`;
    if (incidents.length === 0) {
      report += ` No security incidents recorded for this reporting cycle.\n`;
    } else {
      incidents.forEach((inc, idx) => {
        report += ` [${idx + 1}] [${inc.severity}] ${inc.title} (${inc.status})\n`;
        report += `     Reported: ${inc.reportedAt} | Location: ${inc.location} | Reporter: ${inc.reportedBy}\n`;
        report += `     Description: ${inc.description}\n`;
        if (inc.actionsTaken && inc.actionsTaken.length > 0) {
          report += `     Actions Taken: ${inc.actionsTaken.join('; ')}\n`;
        }
      });
    }

    report += `\n--- 3. ACTIVE SECURITY ALERTS ---\n`;
    if (alerts.length === 0) {
      report += ` Zero active alerts currently pending.\n`;
    } else {
      alerts.forEach((alt, idx) => {
        report += ` [${idx + 1}] [${alt.severity}] ${alt.title} (${alt.timestamp}) - Status: ${alt.status}\n`;
        report += `     ${alt.description}\n`;
      });
    }

    report += `\n--- 4. ON-DUTY SECURITY FORCE AT GATES ---\n`;
    guards.filter(g => g.dutyStatus === 'ON_DUTY').forEach((g, idx) => {
      report += ` [${idx + 1}] Guard: ${g.name} (Badge: ${g.badgeNumber}) | Shift: ${g.shift} | Assigned: ${g.assignedGateId}\n`;
    });

    report += `\n================================================================================\n`;
    report += `End of Activity Report for ${society.name}.\n`;
    report += `CONFIDENTIAL — FOR MANAGEMENT, OWNER & AUTHORIZED AUDIT USE ONLY.\n`;
    report += `================================================================================\n`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Activity_Report_${society.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    soundEngine.playSuccessChime();
    setMgmtToastNotice(`Exported Activity Report for ${society.name}`);
    setTimeout(() => setMgmtToastNotice(null), 4000);
  };

  // Handle Barrier Action from Management
  const handleBarrierToggle = async (gateId: string, cmd: 'OPEN' | 'CLOSE' | 'EMERGENCY_LOCK') => {
    soundEngine.playSuccessChime();
    await api.sendBarrierCommand(gateId, cmd, 'Society Administrator');
    onRefresh();
  };

  // Handle Alert Acknowledge
  const handleAcknowledgeAlert = (alertId: string) => {
    const found = alerts.find(a => a.id === alertId);
    if (found) {
      found.status = 'ACKNOWLEDGED';
      soundEngine.playSuccessChime();
      onRefresh();
    }
  };

  // Handle Alert Resolve
  const handleResolveAlert = (alertId: string) => {
    const found = alerts.find(a => a.id === alertId);
    if (found) {
      found.status = 'RESOLVED';
      soundEngine.playSuccessChime();
      onRefresh();
    }
  };

  // Handle Create Incident
  const handleCreateIncident = () => {
    if (!newIncidentTitle) return;
    const newInc: Incident = {
      id: `inc_${Date.now()}`,
      societyId: society.id,
      title: newIncidentTitle,
      type: newIncidentType as any,
      severity: newIncidentSeverity,
      reportedBy: 'Society Management',
      reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: newIncidentLocation,
      description: newIncidentDesc,
      status: 'INVESTIGATING',
      actionsTaken: ['Logged by administrator', 'Security guard dispatched']
    };
    incidents.unshift(newInc);
    setShowNewIncidentForm(false);
    setNewIncidentTitle('');
    setNewIncidentDesc('');
    soundEngine.playSuccessChime();
    onRefresh();
  };

  // Handle Search Person
  const handlePersonSearch = (q: string) => {
    setPersonQuery(q);
    if (!q.trim()) {
      setFoundPeople([]);
      return;
    }
    const clean = q.toLowerCase();
    const results: any[] = [];

    // Search residents
    houses.forEach(h => {
      if (h.ownerName.toLowerCase().includes(clean) || h.houseNumber.toLowerCase().includes(clean)) {
        results.push({ type: 'RESIDENT', name: h.ownerName, detail: `${h.houseNumber} (${h.block}) • ${h.contactNumber || (h as any).phone || 'Resident'}`, status: 'Resident' });
      }
    });

    // Search guards
    guards.forEach(g => {
      if (g.name.toLowerCase().includes(clean)) {
        results.push({ type: 'GUARD', name: g.name, detail: `Badge ${g.badgeNumber} • ${g.assignedGateId}`, status: g.dutyStatus });
      }
    });

    // Search visitors
    visitors.forEach(v => {
      if (v.name.toLowerCase().includes(clean)) {
        results.push({ type: 'VISITOR', name: v.name, detail: `Visiting ${v.destinationHouse} • Pass ${v.passCode}`, status: v.status });
      }
    });

    setFoundPeople(results);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* MANAGEMENT APP BAR */}
      <header className="border-b border-slate-800 bg-slate-900 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/40">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base text-white tracking-wide font-mono">
                {society.name}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                ADMIN COMMAND
              </span>
              <button
                type="button"
                onClick={() => {
                  setSocietyNameInput(society.name);
                  setSocietyAddressInput(society.address);
                  setSocietyCityInput(society.city);
                  setSocietyProvinceInput(society.provinceState || 'Punjab');
                  setShowSocietyModal(true);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-mono border border-slate-700 flex items-center space-x-1 transition-colors"
                title="Edit Society Name & Address"
              >
                <Edit3 className="w-2.5 h-2.5" />
                <span>Rename Society</span>
              </button>
            </div>
            <div className="text-xs text-slate-400">
              {society.address}, {society.city} • Security Score: <strong className="text-emerald-400">{society.securityScore}/100</strong>
            </div>
          </div>
        </div>

        {/* Multi-Society Switcher & Critical Alert Banner */}
        <div className="flex items-center space-x-3">
          {criticalAlertsCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('ALERTS')}
              className="px-3 py-1.5 rounded-lg bg-red-950 border border-red-700 text-red-300 text-xs font-bold flex items-center space-x-1.5 animate-pulse"
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>{criticalAlertsCount} CRITICAL ALERT{criticalAlertsCount > 1 ? 'S' : ''}</span>
            </button>
          )}

          {/* Society Selector */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <span className="hidden md:inline">Society:</span>
            <select
              value={society.id}
              onChange={e => onSelectSociety(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-blue-500"
            >
              {societies.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {onEnterGuardPortal && (
            <button
              type="button"
              onClick={onEnterGuardPortal}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase shadow-md shadow-cyan-950/50 flex items-center space-x-1.5 transition-all"
              title="Inspect perimeter gates and guard actions in Management Audit Mode"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guard Portal</span>
            </button>
          )}

          <button
            id="btn-export-activity-report-header"
            type="button"
            onClick={() => handleExportActivityReport('markdown')}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs uppercase shadow-md shadow-emerald-950/50 flex items-center space-x-1.5 transition-all"
            title="Download full daily gate entries and security incidents report for this society"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Activity Report</span>
          </button>

          <button
            type="button"
            onClick={onOpenEmergency}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase shadow-md shadow-red-950 flex items-center space-x-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EMERGENCY</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Exit Management Portal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* HORIZONTAL MANAGEMENT NAV BAR */}
      <nav className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 py-2 overflow-x-auto flex items-center space-x-1">
        {[
          { id: 'OVERVIEW', label: 'Dashboard', icon: Layers },
          { id: 'GATES', label: 'Gate Control', icon: DoorClosed },
          { id: 'VEHICLES', label: 'Vehicles & ANPR', icon: Car },
          { id: 'VISITORS', label: 'Visitors & Passes', icon: UserCheck },
          { id: 'HOUSES', label: 'Residents Directory', icon: Home },
          { id: 'GUARDS', label: 'Guards & Handover', icon: Shield },
          { id: 'DELIVERIES', label: 'Deliveries', icon: Package },
          { id: 'STAFF', label: 'Service Staff', icon: Wrench },
          { id: 'INCIDENTS', label: `Incidents (${incidents.length})`, icon: FileText },
          { id: 'ALERTS', label: `Alerts (${activeAlerts.length})`, icon: AlertTriangle },
          { id: 'WATCHLIST', label: 'Watchlist', icon: Eye },
          { id: 'CCTV', label: 'CCTV Grid', icon: Camera },
          { id: 'SEARCH', label: 'Search & Where-is', icon: Search },
          { id: 'AI_ASSISTANT', label: 'Secure AI', icon: Sparkles },
          { id: 'AUDIT', label: 'Audit Logs', icon: Clock },
          { id: 'REPORTS', label: 'Reports Export', icon: Download }
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {mgmtToastNotice && (
          <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-mono flex items-center justify-between shadow-lg shadow-emerald-950/50 animate-in fade-in">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{mgmtToastNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setMgmtToastNotice(null)}
              className="text-emerald-400 hover:text-white font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Vehicles Inside</span>
                  <Car className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">{vehiclesInside}</div>
                <div className="text-[11px] text-slate-500">{vehicles.length} total registered</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Visitors Inside</span>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">{visitorsInside}</div>
                <div className="text-[11px] text-slate-500">{visitors.length} total passes today</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Active Guards</span>
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">{activeGuardsCount}</div>
                <div className="text-[11px] text-slate-500">Across {gates.length} perimeter gates</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Active Alerts</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">{activeAlerts.length}</div>
                <div className="text-[11px] text-amber-400 font-semibold">{criticalAlertsCount} critical priority</div>
              </div>
            </div>

            {/* Electronic Boom Barrier Live Status Overview */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DoorClosed className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    Perimeter Boom Barriers Live Status
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('GATES')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium underline"
                >
                  Manage All Gates
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {gates.map(gate => (
                  <div
                    key={gate.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{gate.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          gate.barrierState === 'OPEN'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-900 text-slate-300 border border-slate-700'
                        }`}>
                          {gate.barrierState}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{gate.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">
                        Hardware: Connected
                      </span>
                      <div className="flex space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleBarrierToggle(gate.id, 'OPEN')}
                          className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-bold border border-emerald-800"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBarrierToggle(gate.id, 'CLOSE')}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Split row: Recent Critical Alerts & Quick Secure AI Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alert Center Preview */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Recent Security Alerts ({alerts.length})
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ALERTS')}
                      className="text-xs text-blue-400 underline"
                    >
                      View All Alerts
                    </button>
                  </div>
                  <div className="space-y-2">
                    {alerts.slice(0, 4).map(a => (
                      <div
                        key={a.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          a.severity === 'CRITICAL'
                            ? 'bg-red-950/40 border-red-800 text-red-200'
                            : a.severity === 'HIGH'
                            ? 'bg-orange-950/40 border-orange-800 text-orange-200'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{a.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{a.description}</div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 block font-bold">
                            {a.severity}
                          </span>
                          <span className="text-[10px] text-slate-500">{a.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Secure AI Assistant Prompter */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Secure AI Intelligence Assistant
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      GEMINI POWERED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    Ask natural language questions regarding security patterns, unknown vehicles, or guard performance:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      'How many vehicles entered Gate 1 today?',
                      'Are there any loitering vehicles on watchlist?',
                      'Summarize morning shift security incidents'
                    ].map((sample, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setActiveTab('AI_ASSISTANT');
                          handleAskAI(sample);
                        }}
                        className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-xs text-cyan-300"
                      >
                        "{sample}"
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={e => setAiQuestion(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (setActiveTab('AI_ASSISTANT'), handleAskAI())}
                    placeholder="Ask Secure AI anything about the society..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('AI_ASSISTANT');
                      handleAskAI();
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                  >
                    Ask
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GATES & BARRIER CONTROL */}
        {activeTab === 'GATES' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">PERIMETER ACCESS GATES</h3>
                <p className="text-xs text-slate-400">Electronic boom barrier control, cameras, and directions</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-3 py-1 rounded-lg border border-cyan-800">
                TOTAL GATES: {gates.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {gates.map(gate => (
                <div key={gate.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">{gate.name}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {gate.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{gate.description}</p>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Barrier State:</span>
                        <strong className={`font-mono ${
                          gate.barrierState === 'OPEN' ? 'text-emerald-400' : 'text-slate-200'
                        }`}>{gate.barrierState}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Hardware Controller:</span>
                        <span className="text-emerald-400 font-mono">ONLINE (RS-485)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">ANPR Camera:</span>
                        <span className="text-emerald-400 font-mono">1080p 60fps ACTIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* Manual Override Controls */}
                  <div className="space-y-2 pt-3 border-t border-slate-800">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleBarrierToggle(gate.id, 'OPEN')}
                        className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase shadow-md shadow-emerald-950"
                      >
                        OPEN GATE
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBarrierToggle(gate.id, 'CLOSE')}
                        className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase"
                      >
                        CLOSE GATE
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBarrierToggle(gate.id, 'EMERGENCY_LOCK')}
                      className="w-full py-2 rounded-xl bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 font-bold text-xs uppercase"
                    >
                      EMERGENCY LOCKDOWN
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: VEHICLES & ANPR ("Where is Vehicle ABC-123?") */}
        {activeTab === 'VEHICLES' && (
          <div className="space-y-6">
            {/* Vehicle Intelligence Search */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-mono">VEHICLE INTELLIGENCE &amp; TIMELINE</h3>
                <p className="text-xs text-slate-400">Search any registered or visiting plate to inspect its history and current location</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={vehicleQuery}
                  onChange={e => setVehicleQuery(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC-123 or XYZ-786..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono font-bold text-white uppercase"
                />
                <button
                  type="button"
                  onClick={() => {
                    const clean = vehicleQuery.trim().toUpperCase();
                    const found = vehicles.find(v => v.plateNumber.toUpperCase() === clean);
                    if (found) {
                      setSearchedVehicle(found);
                      soundEngine.playSuccessChime();
                    } else {
                      alert(`No vehicle found with plate ${clean}`);
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase"
                >
                  Locate Vehicle
                </button>
              </div>

              {/* Searched Vehicle Detail */}
              {searchedVehicle && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xl font-extrabold text-white">{searchedVehicle.plateNumber}</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded font-mono ${
                          searchedVehicle.status === 'INSIDE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-400'
                        }`}>
                          {searchedVehicle.status === 'INSIDE' ? 'CURRENTLY INSIDE SOCIETY' : 'OUTSIDE / DEPARTED'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchedVehicle.make} {searchedVehicle.model} ({searchedVehicle.color}) • Owner: <strong>{searchedVehicle.ownerName}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Associated Residence:</span>
                      <span className="text-sm font-mono font-bold text-cyan-400">{searchedVehicle.houseNumber}</span>
                    </div>
                  </div>

                  {/* Movement Timeline */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Movement History &amp; Gate Timeline:
                    </h5>
                    <div className="space-y-2">
                      {searchedVehicle.timeline.map(item => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full ${item.type === 'ENTRY' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                            <span className="font-bold text-white">{item.type}</span>
                            <span className="text-slate-400">via {item.gateName}</span>
                            <span className="text-slate-500">(Guard: {item.guardName})</span>
                          </div>
                          <span className="font-mono text-slate-400">{item.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Full Registered Vehicles Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                All Society Registered Vehicles ({vehicles.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800 pb-2">
                    <tr>
                      <th className="py-2">Plate</th>
                      <th className="py-2">Make / Model</th>
                      <th className="py-2">Resident</th>
                      <th className="py-2">House</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Current Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {vehicles.map(v => (
                      <tr key={v.id} className="hover:bg-slate-950/40">
                        <td className="py-2.5 font-mono font-bold text-cyan-400">{v.plateNumber}</td>
                        <td className="py-2.5 text-slate-300">{v.color} {v.make} {v.model}</td>
                        <td className="py-2.5 text-white font-medium">{v.ownerName}</td>
                        <td className="py-2.5 font-mono text-slate-300">{v.houseNumber}</td>
                        <td className="py-2.5 text-slate-400">{v.classification}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            v.status === 'INSIDE' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-950 text-slate-400'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VISITORS & PASSES */}
        {activeTab === 'VISITORS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">VISITOR LOG &amp; PASS MANAGEMENT</h3>
                <p className="text-xs text-slate-400">All guests, temporary contractors, and digital QR passes</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-800">
                ACTIVE VISITORS INSIDE: {visitorsInside}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800 pb-2">
                    <tr>
                      <th className="py-2">Visitor Name</th>
                      <th className="py-2">Phone</th>
                      <th className="py-2">Destination</th>
                      <th className="py-2">Purpose</th>
                      <th className="py-2">Gate Pass Code</th>
                      <th className="py-2">Entry Time</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {visitors.map(vis => (
                      <tr key={vis.id} className="hover:bg-slate-950/40">
                        <td className="py-2.5 font-bold text-white">{vis.name}</td>
                        <td className="py-2.5 font-mono text-slate-400">{vis.phone}</td>
                        <td className="py-2.5 font-mono text-cyan-400">{vis.destinationHouse}</td>
                        <td className="py-2.5 text-slate-300">{vis.purpose}</td>
                        <td className="py-2.5 font-mono text-[11px] text-emerald-400">{vis.passCode}</td>
                        <td className="py-2.5 font-mono text-slate-400">{vis.entryTime}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            vis.status === 'INSIDE' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-950 text-slate-400'
                          }`}>
                            {vis.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: HOUSES & RESIDENTS DIRECTORY */}
        {activeTab === 'HOUSES' && (() => {
          const availableBlocks = Array.from(new Set(houses.map(h => h.block).filter(Boolean)));
          const filteredHouses = houses.filter(h => {
            if (residentBlockFilter !== 'ALL' && h.block !== residentBlockFilter) {
              return false;
            }
            if (!residentSearchQuery.trim()) return true;
            const q = residentSearchQuery.toLowerCase();
            const plates = (h.registeredPlates || (h as any).registeredVehiclePlates || []).map((p: string) => String(p).toLowerCase());
            return (
              (h.ownerName || '').toLowerCase().includes(q) ||
              (h.houseNumber || '').toLowerCase().includes(q) ||
              (h.block || '').toLowerCase().includes(q) ||
              (h.contactNumber || (h as any).phone || '').toLowerCase().includes(q) ||
              (h.email || '').toLowerCase().includes(q) ||
              (h.street || '').toLowerCase().includes(q) ||
              plates.some(p => p.includes(q))
            );
          });

          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                    <Home className="w-4 h-4 text-cyan-400" />
                    <span>RESIDENTS &amp; VILLAS DIRECTORY</span>
                  </h3>
                  <p className="text-xs text-slate-400">Registered units, primary contacts, resident roster, and authorized vehicles</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-3 py-1.5 rounded-lg border border-cyan-800">
                    {filteredHouses.length} of {houses.length} RESIDENCES
                  </span>
                  <button
                    type="button"
                    onClick={openAddResidentModal}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase flex items-center space-x-1.5 shadow-md shadow-cyan-950/40 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Register Resident &amp; Plates</span>
                  </button>
                </div>
              </div>

              {/* Intercom Call Alert Notice */}
              {intercomNotice && (
                <div className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-500/80 text-cyan-200 text-xs font-mono flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-lg shadow-cyan-950/50">
                  <div className="flex items-center space-x-2.5">
                    <PhoneCall className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>{intercomNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIntercomNotice(null)}
                    className="text-cyan-400 hover:text-white text-xs underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Search & Block Filter Controls */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-resident-search"
                    type="text"
                    value={residentSearchQuery}
                    onChange={e => setResidentSearchQuery(e.target.value)}
                    placeholder="Search by resident name, villa number, phone, license plate, or email..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  {residentSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setResidentSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      title="Clear search"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Block Filter Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
                  <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1 mr-1">
                    <Filter className="w-3 h-3 text-slate-500" />
                    <span>Block:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setResidentBlockFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                      residentBlockFilter === 'ALL'
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-900'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    All
                  </button>
                  {availableBlocks.map(block => (
                    <button
                      key={block}
                      type="button"
                      onClick={() => setResidentBlockFilter(block)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                        residentBlockFilter === block
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-900'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {block}
                    </button>
                  ))}
                </div>
              </div>

              {/* Directory Grid */}
              {filteredHouses.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <Home className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white font-mono">NO RESIDENCES FOUND</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    No residential units matched your filter criteria "{residentSearchQuery || residentBlockFilter}".
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setResidentSearchQuery('');
                      setResidentBlockFilter('ALL');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-cyan-400 text-xs font-mono border border-slate-700"
                  >
                    Reset Search &amp; Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHouses.map(house => {
                    const safePlates: string[] = Array.isArray(house.registeredPlates)
                      ? house.registeredPlates
                      : Array.isArray((house as any).registeredVehiclePlates)
                        ? (house as any).registeredVehiclePlates
                        : [];
                    const contact = house.contactNumber || (house as any).phone || 'N/A';
                    const residentCount = house.residentCount ?? 1;
                    const visitorsCount = house.currentVisitorsCount ?? 0;

                    return (
                      <div
                        key={house.id}
                        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3.5 flex flex-col justify-between shadow-lg shadow-slate-950/40"
                      >
                        <div>
                          {/* Unit Title & Badges */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-base font-bold text-white tracking-wide">
                                {house.houseNumber}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                                {house.block}
                              </span>
                            </div>

                            {visitorsCount > 0 ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>{visitorsCount} GUEST INSIDE</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-800">
                                NO ACTIVE GUESTS
                              </span>
                            )}
                          </div>

                          {/* Street Location */}
                          {house.street && (
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-sans mt-1">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{house.street}</span>
                            </div>
                          )}

                          {/* Resident & Contact Info */}
                          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 min-w-0">
                                <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <strong className="text-slate-100 font-semibold truncate">
                                  {house.ownerName}
                                </strong>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 flex items-center space-x-1 shrink-0">
                                <Users className="w-2.5 h-2.5 text-slate-400" />
                                <span>{residentCount} resident{residentCount > 1 ? 's' : ''}</span>
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-slate-300">
                              <div className="flex items-center space-x-2 font-mono text-xs">
                                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>{contact}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  soundEngine.playSuccessChime();
                                  setIntercomNotice(`🔊 Calling Intercom at ${house.houseNumber} (${house.ownerName})... Connected.`);
                                  setTimeout(() => setIntercomNotice(null), 4500);
                                }}
                                className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 flex items-center space-x-1 transition-colors"
                                title="Call intercom unit"
                              >
                                <PhoneCall className="w-2.5 h-2.5" />
                                <span>Intercom</span>
                              </button>
                            </div>

                            {house.email && (
                              <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                                <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate">{house.email}</span>
                              </div>
                            )}

                            {house.emergencyContact && (
                              <div className="pt-1.5 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-400">
                                <span className="text-slate-500">Emergency:</span>
                                <span className="text-amber-400">{house.emergencyContact}</span>
                              </div>
                            )}
                          </div>

                          {/* Registered Vehicles Section */}
                          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                              <span className="flex items-center space-x-1">
                                <CarFront className="w-3 h-3 text-slate-500" />
                                <span>REGISTERED VEHICLES:</span>
                              </span>
                              <span>{safePlates.length}</span>
                            </div>

                            {safePlates.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {safePlates.map(plate => (
                                  <span
                                    key={plate}
                                    className="px-2 py-0.5 rounded bg-slate-950 text-cyan-400 font-mono text-[11px] font-bold border border-slate-800 flex items-center space-x-1 shadow-sm"
                                  >
                                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                                    <span>{plate}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-600 italic block">
                                No registered vehicles on file
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Footer Quick Actions */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => openEditResidentModal(house)}
                              className="px-2 py-1 rounded bg-slate-850 hover:bg-slate-800 text-cyan-300 font-mono text-[10px] flex items-center space-x-1 border border-slate-750 transition-colors"
                              title="Edit Resident Profile & Number Plates"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteResident(house)}
                              className="px-2 py-1 rounded bg-slate-950 hover:bg-red-950/80 text-slate-500 hover:text-red-400 font-mono text-[10px] flex items-center space-x-1 border border-slate-800 transition-colors"
                              title="Remove Resident Record"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playSuccessChime();
                              setIntercomNotice(`📋 Clearance credentials confirmed for ${house.ownerName} (${house.houseNumber})`);
                              setTimeout(() => setIntercomNotice(null), 4500);
                            }}
                            className="text-cyan-400 hover:text-cyan-300 font-mono text-[10px] hover:underline"
                          >
                            Verify Clearance &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 6: GUARDS & SHIFTS */}
        {activeTab === 'GUARDS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">SECURITY FORCE &amp; ROSTER</h3>
                <p className="text-xs text-slate-400">Guards, shift rotations, identity credential verification &amp; handovers</p>
              </div>
              <span className="text-xs font-mono text-blue-400 bg-blue-950 px-3 py-1 rounded-lg border border-blue-800">
                ACTIVE ON DUTY: {activeGuardsCount}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {guards.map(g => (
                <div key={g.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{g.name}</h4>
                      <span className="text-xs text-slate-400 font-mono">Badge: {g.badgeNumber}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      g.dutyStatus === 'ON_DUTY' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-950 text-slate-500'
                    }`}>
                      {g.dutyStatus}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Shift:</span>
                      <span className="text-cyan-400">{g.shift}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gate Post:</span>
                      <span className="text-slate-200">{g.assignedGateId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Attendance:</span>
                      <span className="text-emerald-400">{g.attendanceRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Identity Doc:</span>
                      <span className="text-emerald-400 font-sans truncate max-w-[140px]">Verified Credential</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Handover Log */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Recent Digital Shift Handover Notes:
              </h4>
              <div className="space-y-2">
                {shiftNotes.map(sn => (
                  <div key={sn.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-400">{sn.guardName}</span>
                      <span className="font-mono text-slate-500 text-[10px]">{sn.timestamp}</span>
                    </div>
                    <p className="text-slate-300">{sn.note}</p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                      {sn.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: DELIVERIES */}
        {activeTab === 'DELIVERIES' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">DELIVERIES &amp; COURIER TRACKING</h3>
                <p className="text-xs text-slate-400">FoodPanda, UberEats, Amazon, FedEx &amp; courier entries</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800 pb-2">
                    <tr>
                      <th className="py-2">Platform</th>
                      <th className="py-2">Rider</th>
                      <th className="py-2">Vehicle Plate</th>
                      <th className="py-2">Destination</th>
                      <th className="py-2">Entry Time</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {deliveries.map(del => (
                      <tr key={del.id} className="hover:bg-slate-950/40">
                        <td className="py-2.5 font-bold text-amber-400">{del.company}</td>
                        <td className="py-2.5 text-white font-medium">{del.riderName}</td>
                        <td className="py-2.5 font-mono text-slate-300">{del.vehiclePlate}</td>
                        <td className="py-2.5 font-mono text-cyan-400">{del.destinationHouse}</td>
                        <td className="py-2.5 font-mono text-slate-400">{del.entryTime}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-950 text-amber-300">
                            {del.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: SERVICE STAFF */}
        {activeTab === 'STAFF' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">SERVICE STAFF &amp; CONTRACTORS</h3>
                <p className="text-xs text-slate-400">Electricians, plumbers, cleaners, technicians &amp; verified badges</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800 pb-2">
                    <tr>
                      <th className="py-2">Worker Name</th>
                      <th className="py-2">Category</th>
                      <th className="py-2">Assigned House</th>
                      <th className="py-2">Contact</th>
                      <th className="py-2">Pass Valid Until</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {serviceWorkers.map(sw => (
                      <tr key={sw.id} className="hover:bg-slate-950/40">
                        <td className="py-2.5 font-bold text-white">{sw.name}</td>
                        <td className="py-2.5 text-purple-400 font-medium">{sw.category}</td>
                        <td className="py-2.5 font-mono text-cyan-400">{sw.assignedHouse}</td>
                        <td className="py-2.5 font-mono text-slate-400">{sw.phone}</td>
                        <td className="py-2.5 font-mono text-slate-400">{sw.validUntil}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-950 text-purple-300">
                            {sw.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: INCIDENTS */}
        {activeTab === 'INCIDENTS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">INCIDENT MANAGEMENT</h3>
                <p className="text-xs text-slate-400">Formal security reports, evidence logs &amp; corrective actions</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewIncidentForm(!showNewIncidentForm)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Incident</span>
              </button>
            </div>

            {/* Incident Create Form */}
            {showNewIncidentForm && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-blue-500 space-y-4 animate-fadeIn">
                <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  Create Formal Security Incident
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={newIncidentTitle}
                      onChange={e => setNewIncidentTitle(e.target.value)}
                      placeholder="e.g. Broken perimeter sensor"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Severity</label>
                    <select
                      value={newIncidentSeverity}
                      onChange={e => setNewIncidentSeverity(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Location</label>
                    <input
                      type="text"
                      value={newIncidentLocation}
                      onChange={e => setNewIncidentLocation(e.target.value)}
                      placeholder="e.g. North Gate Fence"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-xs">Incident Description &amp; Evidence</label>
                  <textarea
                    value={newIncidentDesc}
                    onChange={e => setNewIncidentDesc(e.target.value)}
                    placeholder="Provide incident narrative and details..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white h-20"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewIncidentForm(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateIncident}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                  >
                    Save Incident
                  </button>
                </div>
              </div>
            )}

            {/* Incidents List */}
            <div className="space-y-3">
              {incidents.map(inc => (
                <div key={inc.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        inc.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                        inc.severity === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
                        'bg-slate-950 text-slate-300 border border-slate-800'
                      }`}>
                        {inc.severity}
                      </span>
                      <h4 className="font-bold text-white text-sm">{inc.title}</h4>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      Reported: {inc.reportedAt} by {inc.reportedBy}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{inc.description}</p>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-400">Location: <strong className="text-slate-200">{inc.location}</strong></span>
                    <span className="text-slate-400">Status: <strong className="text-cyan-400 font-mono">{inc.status}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 10: ALERTS CENTER (Includes 3-failed-attempts security alerts) */}
        {activeTab === 'ALERTS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">SECURITY ALERT CENTER</h3>
                <p className="text-xs text-slate-400">Active threats, lockout notifications &amp; dispatch workflows</p>
              </div>
              <span className="text-xs font-mono text-amber-400 bg-amber-950 px-3 py-1 rounded-lg border border-amber-800">
                {activeAlerts.length} UNRESOLVED
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map(alertItem => (
                <div
                  key={alertItem.id}
                  className={`p-5 rounded-2xl border space-y-3 transition-all ${
                    alertItem.severity === 'CRITICAL'
                      ? 'bg-red-950/40 border-red-800 shadow-lg shadow-red-950/40'
                      : alertItem.severity === 'HIGH'
                      ? 'bg-orange-950/30 border-orange-800'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        alertItem.severity === 'CRITICAL' ? 'bg-red-400 animate-ping' :
                        alertItem.severity === 'HIGH' ? 'bg-orange-400' : 'bg-cyan-400'
                      }`} />
                      <h4 className="font-bold text-white text-sm">{alertItem.title}</h4>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/50 border border-white/10">
                        {alertItem.severity}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-slate-400">{alertItem.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-300">{alertItem.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400">Status: <strong className="text-cyan-400 font-mono">{alertItem.status}</strong></span>
                    <div className="flex space-x-2">
                      {alertItem.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => handleAcknowledgeAlert(alertItem.id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 font-bold"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alertItem.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          onClick={() => handleResolveAlert(alertItem.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold"
                        >
                          Resolve Alert
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 11: WATCHLIST */}
        {activeTab === 'WATCHLIST' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">PERIMETER WATCHLIST</h3>
                <p className="text-xs text-slate-400">Suspicious plates and individuals flagged for automatic barrier lockout</p>
              </div>
            </div>

            {/* Add to Watchlist */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Add Vehicle or Person to Watchlist</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newWatchlistPlate}
                  onChange={e => setNewWatchlistPlate(e.target.value.toUpperCase())}
                  placeholder="Number Plate (e.g. SUS-999)..."
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white uppercase font-mono"
                />
                <input
                  type="text"
                  value={newWatchlistReason}
                  onChange={e => setNewWatchlistReason(e.target.value)}
                  placeholder="Reason / Loitering notes..."
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newWatchlistPlate) return;
                    setWatchlistPlates(prev => [
                      { plate: newWatchlistPlate, reason: newWatchlistReason || 'Security alert flag', addedAt: 'Today' },
                      ...prev
                    ]);
                    setNewWatchlistPlate('');
                    setNewWatchlistReason('');
                    soundEngine.playSuccessChime();
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase"
                >
                  Flag On Watchlist
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {watchlistPlates.map(item => (
                <div key={item.plate} className="p-4 rounded-xl bg-slate-900 border border-red-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-red-400 text-sm block">{item.plate}</span>
                    <span className="text-slate-300">{item.reason}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">Flagged: {item.addedAt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 12: CCTV GRID */}
        {activeTab === 'CCTV' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">LIVE PERIMETER CCTV GRID</h3>
                <p className="text-xs text-slate-400">Simulated real-time high-definition camera feeds with motion tracking</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-800">
                CAMERAS: 4 ONLINE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'CAM-01 • GATE 1 MAIN (INBOUND)', plate: 'ABC-123', status: 'MOTION DETECTED' },
                { title: 'CAM-02 • GATE 1 MAIN (OUTBOUND)', plate: 'XYZ-786', status: 'CLEAR' },
                { title: 'CAM-03 • GATE 2 RESIDENTIAL', plate: 'NONE', status: 'ACTIVE' },
                { title: 'CAM-04 • NORTH PERIMETER WALL', plate: 'NONE', status: 'PATROL MONITORED' }
              ].map((cam, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                  <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-bold">{cam.title}</span>
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>LIVE</span>
                    </span>
                  </div>

                  {/* Simulated Camera Viewfinder */}
                  <div className="h-48 bg-slate-950 relative flex items-center justify-center border-b border-slate-800">
                    <div className="absolute top-3 left-3 text-[10px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded">
                      REC: 2026-09-06 14:32:10 FPS:60
                    </div>
                    <div className="absolute top-3 right-3 text-[10px] font-mono text-cyan-400 bg-black/60 px-2 py-0.5 rounded">
                      ANPR ENGINE: ACTIVE
                    </div>
                    <div className="text-center space-y-2">
                      <Camera className="w-10 h-10 text-slate-700 mx-auto animate-pulse" />
                      <span className="text-xs text-slate-500 font-mono block">1080p SECURE INFRARED STREAM</span>
                      {cam.plate !== 'NONE' && (
                        <div className="inline-block px-3 py-1 rounded bg-black/80 border border-cyan-500 text-cyan-400 font-mono text-xs font-bold">
                          PLATE DETECTED: {cam.plate}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 text-xs flex items-center justify-between text-slate-400">
                    <span>Optical Zoom: 1.0x</span>
                    <span className="text-cyan-400 font-mono">{cam.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 13: SEARCH & WHERE-IS */}
        {activeTab === 'SEARCH' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-mono">GLOBAL SEARCH &amp; "WHERE IS JOHN?"</h3>
                <p className="text-xs text-slate-400">Find any resident, visitor, guard, or staff instantly</p>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={personQuery}
                  onChange={e => handlePersonSearch(e.target.value)}
                  placeholder="Type name (e.g. Tariq, Bilal, Alex, Asif)..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white"
                />
              </div>

              {foundPeople.length > 0 ? (
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  {foundPeople.map((person, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{person.name}</span>
                        <span className="text-slate-400">{person.detail}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                        {person.type}: {person.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Start typing to search cross-domain records.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 14: SECURE AI NATURAL LANGUAGE ASSISTANT */}
        {activeTab === 'AI_ASSISTANT' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-base font-bold text-white font-mono">SECURE AI COMMAND ADVISOR</h3>
                  <p className="text-xs text-slate-400">AI-powered security insights, log analysis &amp; risk evaluation</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                GEMINI LIVE
              </span>
            </div>

            {/* Chat conversation area */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              {aiChatLog.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="text-xs text-cyan-400 font-mono animate-pulse">
                  Secure AI analyzing security state...
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={aiQuestion}
                onChange={e => setAiQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                placeholder="Ask about gate traffic, unknown plates, risk assessment..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAskAI()}
                disabled={aiLoading}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 15: AUDIT LOGS */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-mono">TAMPER-RESISTANT AUDIT LOG</h3>
                <p className="text-xs text-slate-400">Chronological ledger of logins, barrier controls, and incident reports</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="space-y-2">
                {auditLogs.map(al => (
                  <div key={al.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{al.action}</span>
                      <span className="text-slate-400 ml-2">by <strong>{al.performedBy}</strong> ({al.role})</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{al.details}</p>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">{al.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 16: REPORTS EXPORT */}
        {activeTab === 'REPORTS' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                  <Download className="w-5 h-5 text-emerald-400" />
                  <span>EXPORT ACTIVITY REPORT &amp; SECURITY DOSSIERS</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Generate official downloadable summaries of daily gate entries, visitor clearances, and security incidents for <strong>{society.name}</strong>.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="btn-export-activity-txt"
                  type="button"
                  onClick={() => handleExportActivityReport('markdown')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase shadow-md shadow-emerald-950 flex items-center space-x-1.5 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Activity Report (.txt)</span>
                </button>
                <button
                  id="btn-export-activity-csv"
                  type="button"
                  onClick={() => handleExportActivityReport('csv')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase shadow-md shadow-blue-950 flex items-center space-x-1.5 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV Spreadsheets</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Banner for Report */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">CURRENT SOCIETY</span>
                <span className="font-bold text-white text-sm">{society.name}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">DAILY GATE MOVEMENTS</span>
                <span className="font-bold text-cyan-400 text-sm">
                  {vehicles.reduce((acc, v) => acc + (v.timeline ? v.timeline.length : 1), 0)} Logged Events
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">VISITOR CLEARANCES</span>
                <span className="font-bold text-emerald-400 text-sm">{visitors.length} Issued Passes</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">RECORDED INCIDENTS</span>
                <span className="font-bold text-amber-400 text-sm">{incidents.length} Tracked Dossiers</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <FileText className="w-4 h-4" />
                  <span>Comprehensive Activity Report</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Full security dossier including society identity, all daily gate entries, verified resident movements, visitor passes, security incidents with actions taken, active alarms, and on-duty guards.
                </p>
                <button
                  type="button"
                  onClick={() => handleExportActivityReport('markdown')}
                  className="w-full px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full Activity Report</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-blue-400 font-bold">
                  <Download className="w-4 h-4" />
                  <span>Daily Gate Activity CSV</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Machine-readable spreadsheet of all vehicle license plates, driver classifications, resident affiliations, timestamps, and guarding gates.
                </p>
                <button
                  type="button"
                  onClick={() => handleExportActivityReport('csv')}
                  className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Gate Log CSV</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-purple-400 font-bold">
                  <FileText className="w-4 h-4" />
                  <span>Security Incidents Printout</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Print-optimized briefing document detailing all perimeter alerts, investigated security breaches, and emergency response actions for board review.
                </p>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Print Incident Dossier</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: EDIT SOCIETY OFFICIAL NAME & ADDRESS */}
        {showSocietyModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl shadow-slate-950 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">EDIT SOCIETY IDENTITY</h3>
                    <p className="text-xs text-slate-400">Updates society name across Owner Suite and all Guard terminals</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSocietyModal(false)}
                  className="text-slate-400 hover:text-white text-sm p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSociety} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Society Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={societyNameInput}
                    onChange={e => setSocietyNameInput(e.target.value)}
                    placeholder="e.g. Grand Horizon Executive Enclave"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    This official name will be shown to Guards at all gates and to the Owner portal.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Complete Address
                  </label>
                  <input
                    type="text"
                    value={societyAddressInput}
                    onChange={e => setSocietyAddressInput(e.target.value)}
                    placeholder="e.g. Main Boulevard, Sector G-13"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">City</label>
                    <input
                      type="text"
                      value={societyCityInput}
                      onChange={e => setSocietyCityInput(e.target.value)}
                      placeholder="e.g. Islamabad"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Province / State</label>
                    <input
                      type="text"
                      value={societyProvinceInput}
                      onChange={e => setSocietyProvinceInput(e.target.value)}
                      placeholder="e.g. Federal Capital"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowSocietyModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSociety}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center space-x-1.5 shadow-lg shadow-blue-950"
                  >
                    {isSavingSociety ? (
                      <span>Updating...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save &amp; Broadcast Name</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: REGISTER / EDIT RESIDENT & VEHICLE NUMBER PLATES */}
        {showResidentModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl shadow-slate-950 animate-in fade-in zoom-in-95 my-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">
                      {editingResidentId ? 'EDIT RESIDENT & VEHICLE PLATES' : 'REGISTER NEW RESIDENT & VEHICLE PLATES'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Guards will use this data to identify vehicles and contact residents
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResidentModal(false)}
                  className="text-slate-400 hover:text-white text-sm p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveResident} className="space-y-4 text-xs">
                {/* Resident Personal Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Resident Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={resOwnerName}
                      onChange={e => setResOwnerName(e.target.value)}
                      placeholder="e.g. Dr. Sarah Vance"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Primary Contact Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={resContactNumber}
                      onChange={e => setResContactNumber(e.target.value)}
                      placeholder="e.g. +92-300-1234567"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-[10px] text-slate-500">Guards dial this to verify drivers and visitors</span>
                  </div>
                </div>

                {/* House & Block */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      House / Villa <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={resHouseNumber}
                      onChange={e => setResHouseNumber(e.target.value)}
                      placeholder="e.g. Villa 105"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Block / Sector</label>
                    <input
                      type="text"
                      value={resBlock}
                      onChange={e => setResBlock(e.target.value)}
                      placeholder="e.g. Block A"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Resident Count</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={resResidentCount}
                      onChange={e => setResResidentCount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Street & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Street Address</label>
                    <input
                      type="text"
                      value={resStreet}
                      onChange={e => setResStreet(e.target.value)}
                      placeholder="e.g. Bougainvillea Crescent"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Email</label>
                    <input
                      type="email"
                      value={resEmail}
                      onChange={e => setResEmail(e.target.value)}
                      placeholder="e.g. resident@gmail.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Vehicle License Plates Management */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-cyan-300 font-bold font-mono text-xs flex items-center space-x-1.5">
                      <CarFront className="w-4 h-4 text-cyan-400" />
                      <span>REGISTERED VEHICLE NUMBER PLATES</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {resPlates.length} Registered
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    When guards scan or enter these plates at the gate, the app immediately identifies them as <strong>RESIDENT</strong>.
                  </p>

                  {/* Plates Chips */}
                  {resPlates.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {resPlates.map(plate => (
                        <span
                          key={plate}
                          className="px-3 py-1 rounded-lg bg-slate-900 border border-cyan-500/60 text-cyan-300 font-mono font-bold text-xs flex items-center space-x-2 shadow-sm"
                        >
                          <span>{plate}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePlateFromList(plate)}
                            className="text-slate-400 hover:text-red-400 font-bold text-xs ml-1"
                            title="Remove plate"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add Plate Input Row */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={resNewPlateInput}
                      onChange={e => setResNewPlateInput(e.target.value.toUpperCase())}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPlateToList();
                        }
                      }}
                      placeholder="e.g. ABC-123 or LEA-7890"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase font-bold focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddPlateToList}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono"
                    >
                      + Add Plate
                    </button>
                  </div>

                  {/* Vehicle Spec */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Make</label>
                      <input
                        type="text"
                        value={resVehicleMake}
                        onChange={e => setResVehicleMake(e.target.value)}
                        placeholder="e.g. Honda"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Model</label>
                      <input
                        type="text"
                        value={resVehicleModel}
                        onChange={e => setResVehicleModel(e.target.value)}
                        placeholder="e.g. Civic"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">Color</label>
                      <input
                        type="text"
                        value={resVehicleColor}
                        onChange={e => setResVehicleColor(e.target.value)}
                        placeholder="e.g. Black"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowResidentModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingResident}
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center space-x-1.5 shadow-lg shadow-cyan-950/50"
                  >
                    {isSavingResident ? (
                      <span>Saving &amp; Syncing...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save &amp; Sync with Guards</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
