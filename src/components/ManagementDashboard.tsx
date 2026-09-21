import React, { useState, useEffect } from 'react';
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
  EyeOff,
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
  Trash2,
  KeyRound,
  Key,
  Copy,
  Check,
  Printer,
  LayoutGrid,
  Table,
  BadgeCheck,
  Smartphone,
  X,
  Lock,
  ArrowRight,
  MessageSquare,
  MessageCircle,
  PhoneForwarded,
  QrCode,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  UserPlus,
  Share2
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
  AuditLog,
  LivingResident,
  QRPass
} from '../types';
import { api } from '../services/api';
import { soundEngine } from '../services/audio';
import { getClientSocietyPasscode, getClientSocietyResidentCode } from '../data/mockData';
import { ResidentContactModal, ContactContextType, ContactLineType } from './ResidentContactModal';

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
  onAddGuard?: (guard: Guard) => void;
  onUpdateGuard?: (guard: Guard) => void;
  onUpdateGate?: (gate: Gate) => void;
  onSaveHouse?: (house: House) => void;
  onDeleteHouse?: (houseId: string) => void;
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
  onRefresh,
  onAddGuard,
  onUpdateGuard,
  onUpdateGate,
  onSaveHouse,
  onDeleteHouse
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

  // Cross-society passcode verification modal states
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [pendingSwitchSociety, setPendingSwitchSociety] = useState<Society | null>(null);
  const [switchPasscode, setSwitchPasscode] = useState('');
  const [showSwitchPasscode, setShowSwitchPasscode] = useState(false);
  const [switchError, setSwitchError] = useState('');
  const [isSwitchVerifying, setIsSwitchVerifying] = useState(false);
  const [switchFailedCount, setSwitchFailedCount] = useState(0);

  const handleSocietySelectChange = (targetSocId: string) => {
    if (targetSocId === society.id) return;
    const targetSoc = societies.find(s => s.id === targetSocId);
    if (!targetSoc) return;
    setPendingSwitchSociety(targetSoc);
    setSwitchPasscode('');
    setSwitchError('');
    setShowSwitchPasscode(false);
    setIsSwitchModalOpen(true);
  };

  const handleVerifySwitchPasscode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pendingSwitchSociety) return;
    const cleanPass = switchPasscode.trim();
    if (!cleanPass) {
      setSwitchError('Passcode is required to enter this society portal.');
      return;
    }

    setIsSwitchVerifying(true);
    setSwitchError('');

    try {
      const res = await api.verifySocietyPasscode(pendingSwitchSociety.id, cleanPass, society.id);
      if (res.success) {
        soundEngine.playSuccessChime();
        setIsSwitchModalOpen(false);
        setSwitchFailedCount(0);
        onSelectSociety(pendingSwitchSociety.id);
      } else {
        soundEngine.playWarningSound();
        const nextFailed = switchFailedCount + 1;
        setSwitchFailedCount(nextFailed);
        setSwitchError(res.error || 'Access Denied: Incorrect passcode for this society management portal.');
      }
    } catch {
      // Client-side validation fallback
      const expected = getClientSocietyPasscode(pendingSwitchSociety.id);
      if (cleanPass === expected) {
        soundEngine.playSuccessChime();
        setIsSwitchModalOpen(false);
        setSwitchFailedCount(0);
        onSelectSociety(pendingSwitchSociety.id);
      } else {
        soundEngine.playWarningSound();
        setSwitchFailedCount(prev => prev + 1);
        setSwitchError('Access Denied: Incorrect passcode for this society management portal.');
      }
    } finally {
      setIsSwitchVerifying(false);
    }
  };

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
  const [residentDirectoryView, setResidentDirectoryView] = useState<'CARDS' | 'ROSTER'>('CARDS');
  const [intercomNotice, setIntercomNotice] = useState<string | null>(null);
  const [mgmtToastNotice, setMgmtToastNotice] = useState<string | null>(null);

  // Multi-Channel Contact Modal for Management (Primary, Alternate, Emergency lines)
  const [residentContactModal, setResidentContactModal] = useState<{
    isOpen: boolean;
    resident: House;
    contextType: ContactContextType;
    visitorName?: string;
    vehiclePlate?: string;
    initialSelectedLine?: ContactLineType;
  } | null>(null);

  const openContactModal = (
    resident: House,
    contextType: ContactContextType = 'GENERAL',
    visitorName: string = '',
    vehiclePlate: string = '',
    initialLine: ContactLineType = 'PRIMARY'
  ) => {
    soundEngine.playSuccessChime();
    setResidentContactModal({
      isOpen: true,
      resident,
      contextType,
      visitorName,
      vehiclePlate,
      initialSelectedLine: initialLine
    });
  };

  // Society Name and Identity Modal State
  const [showSocietyModal, setShowSocietyModal] = useState(false);
  const [societyNameInput, setSocietyNameInput] = useState(society.name);
  const [societyAddressInput, setSocietyAddressInput] = useState(society.address);
  const [societyCityInput, setSocietyCityInput] = useState(society.city);
  const [societyProvinceInput, setSocietyProvinceInput] = useState(society.provinceState || 'Punjab');
  const [societyPasscodeInput, setSocietyPasscodeInput] = useState(getClientSocietyPasscode(society.id) || 'Jamali000117');
  const [showSocietyPasscode, setShowSocietyPasscode] = useState(false);
  const [isSavingSociety, setIsSavingSociety] = useState(false);

  // Resident & Vehicle Plates Modal State
  const [showResidentModal, setShowResidentModal] = useState(false);
  const [editingResidentId, setEditingResidentId] = useState<string | null>(null);
  const [resHouseNumber, setResHouseNumber] = useState('');
  const [resBlock, setResBlock] = useState('Block A');
  const [resStreet, setResStreet] = useState('');
  const [resOwnerName, setResOwnerName] = useState('');
  const [resContactNumber, setResContactNumber] = useState('');
  const [resAlternateContactNumber, setResAlternateContactNumber] = useState('');
  const [resEmail, setResEmail] = useState('');
  const [resEmergencyContact, setResEmergencyContact] = useState('');
  const [resResidentCount, setResResidentCount] = useState(2);
  const [resPlates, setResPlates] = useState<string[]>([]);
  const [resNewPlateInput, setResNewPlateInput] = useState('');
  const [resVehicleMake, setResVehicleMake] = useState('Toyota');
  const [resVehicleModel, setResVehicleModel] = useState('Corolla');
  const [resVehicleColor, setResVehicleColor] = useState('White');
  const [resRmpCode, setResRmpCode] = useState('');
  const [resRmpStatus, setResRmpStatus] = useState<'ACTIVE' | 'DEACTIVATED'>('ACTIVE');
  const [resSocietyResidentCode, setResSocietyResidentCode] = useState('');
  const [resUpdateSocietyDefaultCode, setResUpdateSocietyDefaultCode] = useState(false);
  const [resCnic, setResCnic] = useState('');
  const [resLivingResidents, setResLivingResidents] = useState<any[]>([]);
  // Inline co-resident input state inside the resident registration modal
  const [resNewLivingName, setResNewLivingName] = useState('');
  const [resNewLivingRel, setResNewLivingRel] = useState('Son');
  const [resNewLivingAge, setResNewLivingAge] = useState<number | string>('');
  const [resNewLivingGender, setResNewLivingGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [resNewLivingCnic, setResNewLivingCnic] = useState('');
  const [resNewLivingCode, setResNewLivingCode] = useState('');
  const [resNewLivingPhone, setResNewLivingPhone] = useState('');
  const [isSavingResident, setIsSavingResident] = useState(false);

  const handleAddLivingToResidentModal = () => {
    if (!resNewLivingName.trim()) {
      alert('Please enter the name of the resident living with the primary resident.');
      return;
    }
    const numAge = Number(resNewLivingAge) || 0;
    const isMinor = numAge > 0 ? numAge < 18 : false;

    if (!isMinor && numAge >= 18 && !resNewLivingCnic.trim()) {
      alert('CNIC number is required for adult residents (age 18 or older).');
      return;
    }

    let codeToUse = resNewLivingCode.trim();
    if (isMinor && !codeToUse) {
      const init = resNewLivingName.trim().slice(0, 3).toUpperCase();
      const rand = Math.floor(10000 + Math.random() * 90000);
      codeToUse = `${init}-${rand}`;
    }

    const codeHash = codeToUse ? codeToUse.replace(/[^A-Z0-9]/gi, '').toUpperCase() : Math.random().toString(36).substring(2, 7).toUpperCase();
    const qrPassId = `SEC247-RES-${codeHash}`;

    const newCo = {
      id: `lr_temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fullName: resNewLivingName.trim(),
      relationship: resNewLivingRel,
      age: numAge,
      isUnder18: isMinor,
      gender: resNewLivingGender,
      cnic: isMinor ? undefined : resNewLivingCnic.trim(),
      residentCode: isMinor ? codeToUse : undefined,
      phone: resNewLivingPhone.trim() || resContactNumber.trim(),
      qrPassId,
      qrStatus: 'ACTIVE',
      status: 'ACTIVE'
    };

    setResLivingResidents(prev => [...prev, newCo]);
    setResNewLivingName('');
    setResNewLivingAge('');
    setResNewLivingCnic('');
    setResNewLivingCode('');
    setResNewLivingPhone('');
    soundEngine.playSuccessChime();
  };

  const handleRemoveLivingFromResidentModal = (idOrName: string) => {
    setResLivingResidents(prev => prev.filter(l => l.id !== idOrName && l.fullName !== idOrName));
  };

  const handleSaveSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!societyNameInput.trim()) return;
    setIsSavingSociety(true);
    try {
      await api.updateSociety({
        id: society.id,
        name: societyNameInput.trim(),
        completeAddress: societyAddressInput.trim(),
        city: societyCityInput.trim(),
        provinceState: societyProvinceInput.trim(),
        managementPasscode: societyPasscodeInput.trim() || undefined
      });
      soundEngine.playSuccessChime();
      setShowSocietyModal(false);
      setMgmtToastNotice(`Society settings & management passcode updated for "${societyNameInput.trim()}". Synchronized with Guards & Owner.`);
      setTimeout(() => setMgmtToastNotice(null), 5000);
      onRefresh();
    } catch {
      alert('Failed to update society details');
    } finally {
      setIsSavingSociety(false);
    }
  };

  const generateResidentRMPCode = (nameToUse?: string) => {
    const raw = (nameToUse || resOwnerName || 'Resident').trim().split(' ').filter(Boolean);
    const initials = raw.length > 1 ? (raw[0][0] + raw[raw.length - 1][0]).toUpperCase() : (raw[0]?.slice(0, 2).toUpperCase() || 'RS');
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${initials}-${num}`;
  };

  const handleQuickResetRmpCode = async (house: House) => {
    const newCode = generateResidentRMPCode(house.ownerName);
    try {
      const res = await api.updateResidentRMPCode(house.id, { rmpCode: newCode, rmpStatus: house.rmpStatus || 'ACTIVE' });
      const updatedHouse: House = (res && res.house) ? res.house : { ...house, rmpCode: newCode };
      if (onSaveHouse) onSaveHouse(updatedHouse);
      soundEngine.playSuccessChime();
      setMgmtToastNotice(`RMP Portal code reset for ${house.ownerName}: New Code [${newCode}]`);
      setTimeout(() => setMgmtToastNotice(null), 5000);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to reset RMP code');
    }
  };

  const handleQuickToggleRmpStatus = async (house: House) => {
    const newStatus = house.rmpStatus === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED';
    try {
      const res = await api.updateResidentRMPCode(house.id, {
        rmpCode: house.rmpCode || generateResidentRMPCode(house.ownerName),
        rmpStatus: newStatus
      });
      const updatedHouse: House = (res && res.house) ? res.house : { ...house, rmpStatus: newStatus };
      if (onSaveHouse) onSaveHouse(updatedHouse);
      soundEngine.playSuccessChime();
      setMgmtToastNotice(`RMP Portal access for ${house.ownerName} set to: [${newStatus}]`);
      setTimeout(() => setMgmtToastNotice(null), 4000);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to toggle RMP status');
    }
  };

  const handleCopyResidentRmpCredentials = (house: House) => {
    const socCode = house.societyResidentAccessCode || society.residentAccessCode || getClientSocietyResidentCode(society.id) || (society.id.includes('aeechs') ? 'aeechsRsdnt10000' : society.id.includes('horizon') ? 'grnresedent6776767' : 'gvle454545');
    const text = [
      `=== RESIDENT MESSAGES PORTAL (RMP) CREDENTIALS ===`,
      `Resident: ${house.ownerName}`,
      `House / Unit: ${house.houseNumber} (${house.block})`,
      `Society: ${society.name}`,
      `1. Society Resident Access Code: ${socCode}`,
      `2. Personal Resident Access Code: ${house.rmpCode || 'NOT_ASSIGNED'}`,
      `Portal Status: ${house.rmpStatus || 'ACTIVE'}`,
      `Instructions: Open "RMP — Resident Messages Portal", select "${society.name}", enter the Society Resident Access Code [${socCode}], then enter your Personal Resident Access Code [${house.rmpCode || 'NOT_ASSIGNED'}] to connect and pre-authorize guests, deliveries, and service staff.`
    ].join('\n');

    navigator.clipboard.writeText(text);
    soundEngine.playSuccessChime();
    setMgmtToastNotice(`Copied RMP credentials for ${house.ownerName} to clipboard!`);
    setTimeout(() => setMgmtToastNotice(null), 4500);
  };

  const handleCopyAllResidentsRmpCodes = () => {
    const socCode = society.residentAccessCode || getClientSocietyResidentCode(society.id) || (society.id.includes('aeechs') ? 'aeechsRsdnt10000' : society.id.includes('horizon') ? 'grnresedent6776767' : 'gvle454545');
    const lines = [
      `=== ${society.name.toUpperCase()}: OFFICIAL RMP RESIDENT ACCESS ROSTER ===`,
      `Society Resident Access Code: ${socCode}`,
      `Total Registered Residences: ${houses.length} | Date: ${new Date().toLocaleDateString()}`,
      `Format: [Unit] — [Resident Name] — [Society Resident Code] — [Personal RMP Code] — [Status]`,
      '----------------------------------------------------------------------',
      ...houses.map((h, idx) => {
        const unitSocCode = h.societyResidentAccessCode || socCode;
        return `${idx + 1}. Unit ${h.houseNumber} (${h.block}) — ${h.ownerName} — Society Code: [${unitSocCode}] — Personal Code: [${h.rmpCode || 'PENDING'}] — Status: ${h.rmpStatus || 'ACTIVE'}`;
      }),
      '----------------------------------------------------------------------',
      'Confidential Resident Roster • Secure 24 by 7 Security System'
    ].join('\n');

    navigator.clipboard.writeText(lines);
    soundEngine.playSuccessChime();
    setMgmtToastNotice(`Copied RMP roster of all ${houses.length} residents to clipboard!`);
    setTimeout(() => setMgmtToastNotice(null), 5000);
  };

  const openAddResidentModal = () => {
    setEditingLivingIndex(null);
    const defaultSocCode = society.residentAccessCode || getClientSocietyResidentCode(society.id) || (society.id.includes('aeechs') ? 'aeechsRsdnt10000' : `${(society.name || 'soc').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}Rsdnt10000`);
    setEditingResidentId(null);
    setResHouseNumber('');
    setResBlock('Block A');
    setResStreet('');
    setResOwnerName('');
    setResCnic('');
    setResContactNumber('');
    setResAlternateContactNumber('');
    setResEmail('');
    setResEmergencyContact('');
    setResResidentCount(2);
    setResPlates([]);
    setResNewPlateInput('');
    setResVehicleMake('Honda');
    setResVehicleModel('Civic');
    setResVehicleColor('Silver');
    setResRmpCode(generateResidentRMPCode('Resident'));
    setResRmpStatus('ACTIVE');
    setResSocietyResidentCode(defaultSocCode);
    setResUpdateSocietyDefaultCode(false);
    setResLivingResidents([]);
    setResNewLivingName('');
    setResNewLivingRel('Son');
    setResNewLivingAge('');
    setResNewLivingGender('MALE');
    setResNewLivingCnic('');
    setResNewLivingCode('');
    setResNewLivingPhone('');
    setShowResidentModal(true);
  };

  // Dedicated Resident Profile Dossier Modal State
  const [viewingResidentProfile, setViewingResidentProfile] = useState<House | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key?: string) => {
    navigator.clipboard.writeText(text);
    soundEngine.playSuccessChime();
    if (key) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const openResidentProfileModal = (h: House) => {
    soundEngine.playSuccessChime();
    setViewingResidentProfile(h);
  };

  // ----------------------------------------------------
  // LIVING RESIDENTS MANAGEMENT STATE (FEATURE 3, 4, 5, 13)
  // ----------------------------------------------------
  const [livingResidentsList, setLivingResidentsList] = useState<LivingResident[]>([]);
  const [expandedLivingHouses, setExpandedLivingHouses] = useState<Record<string, boolean>>({
    'house_88c': true,
    'house_babar': true
  });
  const [showAddLivingModal, setShowAddLivingModal] = useState(false);
  const [targetHouseForLiving, setTargetHouseForLiving] = useState<House | null>(null);
  const [livingFullName, setLivingFullName] = useState('');
  const [livingRelationship, setLivingRelationship] = useState('Wife');
  const [livingDob, setLivingDob] = useState('2000-01-01');
  const [livingAge, setLivingAge] = useState(24);
  const [livingIsUnder18, setLivingIsUnder18] = useState(false);
  const [livingGender, setLivingGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
  const [livingCnic, setLivingCnic] = useState('');
  const [livingResidentCode, setLivingResidentCode] = useState('');
  const [livingPhone, setLivingPhone] = useState('');
  const [livingEmergencyContact, setLivingEmergencyContact] = useState('');
  const [isSavingLiving, setIsSavingLiving] = useState(false);
  const [editingLivingIndex, setEditingLivingIndex] = useState<number | null>(null);

  // QR Pass & Profile Modal for Living Resident
  const [generatedPassModal, setGeneratedPassModal] = useState<QRPass | null>(null);
  const [viewingLivingProfile, setViewingLivingProfile] = useState<LivingResident | null>(null);
  const [residentCategoryFilter, setResidentCategoryFilter] = useState<'ALL' | 'MAIN' | 'LIVING' | 'ADULT' | 'UNDER18' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Load living residents for society
  useEffect(() => {
    let isMounted = true;
    api.getLivingResidents({ societyId: society.id })
      .then(data => {
        if (isMounted && Array.isArray(data)) {
          setLivingResidentsList(data);
        }
      })
      .catch(err => console.warn('Could not fetch living residents:', err));
    return () => {
      isMounted = false;
    };
  }, [society.id]);

  const toggleExpandLivingHouse = (houseId: string) => {
    setExpandedLivingHouses(prev => ({
      ...prev,
      [houseId]: !prev[houseId]
    }));
  };

  const openAddLivingResidentModal = (h: House) => {
    soundEngine.playSuccessChime();
    setTargetHouseForLiving(h);
    setLivingFullName('');
    setLivingRelationship('Wife');
    setLivingDob('2000-01-01');
    setLivingAge(24);
    setLivingIsUnder18(false);
    setLivingGender('FEMALE');
    setLivingCnic('');
    setLivingResidentCode('');
    setLivingPhone('');
    setLivingEmergencyContact(h.contactNumber || '');
    setShowAddLivingModal(true);
  };

  const handleSaveLivingResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHouseForLiving || !livingFullName.trim()) {
      alert('Please enter resident full name.');
      return;
    }
    setIsSavingLiving(true);
    try {
      const generatedCode = livingIsUnder18
        ? (livingResidentCode.trim() || `ZYG-${Math.floor(10000 + Math.random() * 90000)}`)
        : undefined;

      const payload: Partial<LivingResident> = {
        societyId: society.id,
        houseId: targetHouseForLiving.id,
        houseNumber: targetHouseForLiving.houseNumber,
        mainResidentId: targetHouseForLiving.id,
        mainResidentName: targetHouseForLiving.ownerName,
        fullName: livingFullName.trim(),
        relationship: livingRelationship,
        dateOfBirth: livingDob,
        age: Number(livingAge) || 18,
        isUnder18: livingIsUnder18,
        gender: livingGender,
        phone: livingPhone.trim() || undefined,
        emergencyContact: livingEmergencyContact.trim() || targetHouseForLiving.contactNumber,
        cnic: !livingIsUnder18 ? livingCnic.trim() : undefined,
        residentCode: generatedCode,
        status: 'ACTIVE'
      };

      const result = await api.createLivingResident(payload);
      if (result && result.livingResident) {
        setLivingResidentsList(prev => [...prev.filter(x => x.id !== result.livingResident.id), result.livingResident]);
        soundEngine.playSuccessChime();
        setMgmtToastNotice(`Living Resident ${livingFullName.trim()} added to ${targetHouseForLiving.houseNumber}!`);
        setTimeout(() => setMgmtToastNotice(null), 4000);
        setShowAddLivingModal(false);
        setExpandedLivingHouses(prev => ({ ...prev, [targetHouseForLiving.id]: true }));
      }
    } catch (err) {
      alert('Failed to save living resident');
    } finally {
      setIsSavingLiving(false);
    }
  };

  const handleGenerateLivingQRPass = async (lr: LivingResident) => {
    try {
      const passId = `SEC247-PASS-LR${Math.floor(100000 + Math.random() * 900000)}`;
      const token = `SEC247-LVTKN-${lr.id}-${Date.now()}`;
      const now = new Date();
      const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const res = await api.createQRPass({
        id: passId,
        secureToken: token,
        societyId: society.id,
        passType: 'LIVING_RESIDENT',
        entityType: 'LIVING_RESIDENT',
        entityId: lr.id,
        holderName: lr.fullName,
        holderPhone: lr.phone,
        hostResidentName: lr.mainResidentName,
        houseNumber: lr.houseNumber,
        purpose: `Resident Verification Pass (${lr.relationship})`,
        validFrom: now.toISOString().split('T')[0],
        validUntil,
        status: 'ACTIVE',
        isSingleUse: false,
        scanCount: 0,
        createdBy: 'MANAGEMENT_OFFICE'
      });

      if (res && res.qrPass) {
        setLivingResidentsList(prev => prev.map(item => item.id === lr.id ? { ...item, qrPassId: passId, qrStatus: 'ACTIVE' } : item));
        setGeneratedPassModal(res.qrPass);
        soundEngine.playSuccessChime();
        setMgmtToastNotice(`Generated QR Pass for ${lr.fullName} (${lr.relationship})!`);
        setTimeout(() => setMgmtToastNotice(null), 4000);
      }
    } catch (err) {
      alert('Failed to generate QR Pass for living resident');
    }
  };

  const downloadQrCodeImage = async (pass: any) => {
    try {
      const passHolder = (pass.holderName || pass.visitorName || 'Pass').replace(/[^a-zA-Z0-9]/g, '_');
      const token = pass.secureToken || pass.id;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(token)}`;
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_PASS_${pass.id}_${passHolder}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      soundEngine.playSuccessChime();
      setMgmtToastNotice(`QR code image saved for ${pass.holderName || pass.visitorName || 'pass'}!`);
      setTimeout(() => setMgmtToastNotice(null), 3500);
    } catch {
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(pass.secureToken || pass.id)}`, '_blank');
      setMgmtToastNotice('Opened QR image in new tab to save.');
      setTimeout(() => setMgmtToastNotice(null), 3500);
    }
  };

  const openEditResidentModal = (h: House) => {
    setEditingLivingIndex(null);
    const defaultSocCode = h.societyResidentAccessCode || society.residentAccessCode || getClientSocietyResidentCode(society.id) || (society.id.includes('aeechs') ? 'aeechsRsdnt10000' : `${(society.name || 'soc').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}Rsdnt10000`);
    setEditingResidentId(h.id);
    setResHouseNumber(h.houseNumber);
    setResBlock(h.block);
    setResStreet(h.street || '');
    setResOwnerName(h.ownerName);
    setResCnic(h.cnic || '');
    setResContactNumber(h.contactNumber || (h as any).phone || '');
    setResAlternateContactNumber(h.alternateContactNumber || '');
    setResEmail(h.email || '');
    setResEmergencyContact(h.emergencyContact || '');
    setResResidentCount(h.residentCount || 2);
    setResPlates(h.registeredPlates ? [...h.registeredPlates] : []);
    setResNewPlateInput('');
    setResVehicleMake(h.vehicleMake || 'Toyota');
    setResVehicleModel(h.vehicleModel || 'Fortuner');
    setResVehicleColor(h.vehicleColor || 'Black');
    setResRmpCode(h.rmpCode || generateResidentRMPCode(h.ownerName));
    setResRmpStatus(h.rmpStatus || 'ACTIVE');
    setResSocietyResidentCode(defaultSocCode);
    setResUpdateSocietyDefaultCode(false);

    // Populate co-residents living with this primary resident
    const matchedLiving = livingResidentsList.filter(
      l => l.houseId === h.id || l.houseNumber === h.houseNumber || (h.ownerName && l.mainResidentName === h.ownerName)
    );
    setResLivingResidents(matchedLiving.map(l => ({
      id: l.id,
      fullName: l.fullName,
      relationship: l.relationship,
      age: l.age || '',
      isUnder18: l.isUnder18 !== undefined ? l.isUnder18 : ((l.age || 0) < 18),
      gender: l.gender || 'OTHER',
      cnic: l.cnic || '',
      residentCode: l.residentCode || '',
      phone: l.phone || '',
      qrPassId: l.qrPassId,
      qrStatus: l.qrStatus || 'ACTIVE',
      status: l.status || 'ACTIVE'
    })));
    setResNewLivingName('');
    setResNewLivingRel('Son');
    setResNewLivingAge('');
    setResNewLivingGender('MALE');
    setResNewLivingCnic('');
    setResNewLivingCode('');
    setResNewLivingPhone('');
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

    const effectiveSocCode = resSocietyResidentCode.trim() || society.residentAccessCode || getClientSocietyResidentCode(society.id);

    setIsSavingResident(true);
    try {
      const res = await api.manageResident({
        id: editingResidentId || undefined,
        societyId: society.id,
        societyName: society.name,
        houseNumber: resHouseNumber.trim(),
        block: resBlock.trim(),
        street: resStreet.trim(),
        ownerName: resOwnerName.trim(),
        contactNumber: resContactNumber.trim(),
        alternateContactNumber: resAlternateContactNumber.trim(),
        email: resEmail.trim(),
        registeredPlates: finalPlates,
        emergencyContact: resEmergencyContact.trim(),
        residentCount: Number(resResidentCount) || 1,
        vehicleMake: resVehicleMake.trim(),
        vehicleModel: resVehicleModel.trim(),
        vehicleColor: resVehicleColor.trim(),
        rmpCode: resRmpCode ? resRmpCode.trim().toUpperCase() : generateResidentRMPCode(resOwnerName),
        rmpStatus: resRmpStatus,
        societyResidentAccessCode: effectiveSocCode,
        updateSocietyDefaultCode: resUpdateSocietyDefaultCode,
        cnic: resCnic.trim() || undefined,
        livingResidents: resLivingResidents
      });

      // Construct saved house object for instant directory synchronization
      const savedHouse: House = res?.house || {
        id: editingResidentId || `house_${society.id}_${Date.now()}`,
        societyId: society.id,
        houseNumber: resHouseNumber.trim(),
        block: resBlock.trim() || 'Sector A',
        street: resStreet.trim() || 'Main Boulevard',
        ownerName: resOwnerName.trim(),
        cnic: resCnic.trim(),
        residentCount: Number(resResidentCount) || 1,
        contactNumber: resContactNumber.trim(),
        alternateContactNumber: resAlternateContactNumber.trim(),
        email: resEmail.trim(),
        registeredPlates: finalPlates,
        emergencyContact: resEmergencyContact.trim(),
        currentVisitorsCount: 0,
        rmpCode: res?.house?.rmpCode || (resRmpCode ? resRmpCode.trim().toUpperCase() : generateResidentRMPCode(resOwnerName)),
        rmpStatus: res?.house?.rmpStatus || resRmpStatus || 'ACTIVE',
        societyResidentAccessCode: res?.house?.societyResidentAccessCode || effectiveSocCode
      };

      if (resUpdateSocietyDefaultCode && effectiveSocCode) {
        society.residentAccessCode = effectiveSocCode;
      }

      if (onSaveHouse) {
        onSaveHouse(savedHouse);
      }

      if (res?.livingResidents && Array.isArray(res.livingResidents)) {
        setLivingResidentsList(res.livingResidents);
      }

      // Reset filters so the newly registered resident is immediately shown
      setResidentSearchQuery('');
      setResidentBlockFilter('ALL');

      soundEngine.playSuccessChime();
      setShowResidentModal(false);
      const coCount = resLivingResidents.length;
      setMgmtToastNotice(
        `Resident ${resOwnerName.trim()} (${resHouseNumber.trim()}) registered with ${coCount} co-resident(s)! Gate QR passes automatically generated. Synchronized with Security Guards!`
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
      if (onDeleteHouse) {
        onDeleteHouse(h.id);
      }
      soundEngine.playSuccessChime();
      setMgmtToastNotice(`Resident ${h.ownerName} removed. Sync updated.`);
      setTimeout(() => setMgmtToastNotice(null), 4000);
      onRefresh();
    } catch {
      alert('Failed to remove resident');
    }
  };

  // Guard Management State & Code Assignment
  const [localGuards, setLocalGuards] = useState<Guard[]>(guards);
  useEffect(() => {
    setLocalGuards(guards);
  }, [guards]);

  const [showAddGuardModal, setShowAddGuardModal] = useState(false);
  const [editingGuardId, setEditingGuardId] = useState<string | null>(null);
  const [guardNameInput, setGuardNameInput] = useState('');
  const [guardBadgeInput, setGuardBadgeInput] = useState('');
  // Ensure reliable gate options are always populated for deployment assignment
  const fallbackGates: Gate[] = [
    {
      id: `gate_${society.id}_1`,
      societyId: society.id,
      name: 'Main Gate (North Boulevard)',
      gateNumber: 1,
      location: `${society.name} Main Access`,
      type: 'MAIN',
      assignedGuardIds: [],
      status: 'ONLINE',
      barrierState: 'CLOSED',
      barrierMode: 'SIMULATION',
      cameraOnline: true,
      direction: 'TWO_WAY',
      vehiclesEnteredToday: 15,
      vehiclesExitedToday: 10
    },
    {
      id: `gate_${society.id}_2`,
      societyId: society.id,
      name: 'Gate 2 (South Perimeter)',
      gateNumber: 2,
      location: `${society.name} Secondary Boundary`,
      type: 'SECONDARY',
      assignedGuardIds: [],
      status: 'ONLINE',
      barrierState: 'CLOSED',
      barrierMode: 'SIMULATION',
      cameraOnline: true,
      direction: 'TWO_WAY',
      vehiclesEnteredToday: 8,
      vehiclesExitedToday: 5
    },
    {
      id: `gate_${society.id}_3`,
      societyId: society.id,
      name: 'Service Gate 3 (Commercial / Deliveries)',
      gateNumber: 3,
      location: `${society.name} Service Lane`,
      type: 'SERVICE',
      assignedGuardIds: [],
      status: 'ONLINE',
      barrierState: 'CLOSED',
      barrierMode: 'SIMULATION',
      cameraOnline: true,
      direction: 'TWO_WAY',
      vehiclesEnteredToday: 12,
      vehiclesExitedToday: 12
    }
  ];

  const effectiveGates: Gate[] = gates && gates.length > 0 ? gates : fallbackGates;

  const [guardContactInput, setGuardContactInput] = useState('');
  const [guardCnicInput, setGuardCnicInput] = useState('');
  const [guardGateIdInput, setGuardGateIdInput] = useState(effectiveGates[0]?.id || 'gate_1');
  const [guardShiftInput, setGuardShiftInput] = useState<'MORNING' | 'EVENING' | 'NIGHT'>('MORNING');
  const [guardAccessCodeInput, setGuardAccessCodeInput] = useState('');
  const [showAccessCodeInModal, setShowAccessCodeInModal] = useState(true);
  const [isSavingGuard, setIsSavingGuard] = useState(false);
  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>({});
  const [copiedGuardCodeId, setCopiedGuardCodeId] = useState<string | null>(null);
  const [assignedGuardAnnouncement, setAssignedGuardAnnouncement] = useState<{
    guard: Guard;
    code: string;
  } | null>(null);

  const generateRandomDutyCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGuardAccessCodeInput(code);
  };

  const openAddGuardModal = () => {
    setEditingGuardId(null);
    setGuardNameInput('');
    setGuardBadgeInput(`SEC-${Math.floor(100 + Math.random() * 900)}`);
    setGuardContactInput('+92-300-');
    setGuardCnicInput('');
    setGuardGateIdInput(effectiveGates[0]?.id || 'gate_1');
    setGuardShiftInput('MORNING');
    setGuardAccessCodeInput(Math.floor(1000 + Math.random() * 9000).toString());
    setShowAccessCodeInModal(true);
    setShowAddGuardModal(true);
  };

  const openEditGuardDutiesModal = (g: Guard) => {
    setEditingGuardId(g.id);
    setGuardNameInput(g.name);
    setGuardBadgeInput(g.badgeNumber);
    setGuardContactInput(g.contactNumber || '');
    setGuardCnicInput(g.cnic || '');
    setGuardGateIdInput(g.assignedGateId);
    setGuardShiftInput(g.shift as any);
    setGuardAccessCodeInput(g.accessCode || '1234');
    setShowAccessCodeInModal(true);
    setShowAddGuardModal(true);
  };

  const handleSaveGuard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardNameInput.trim()) {
      alert('Please enter security guard full name.');
      return;
    }
    if (!guardAccessCodeInput.trim()) {
      alert('Please provide or generate a Duty Access Code for the guard.');
      return;
    }

    setIsSavingGuard(true);
    try {
      if (editingGuardId) {
        const payload = {
          name: guardNameInput.trim(),
          badgeNumber: guardBadgeInput.trim() || `SEC-${Math.floor(100 + Math.random() * 900)}`,
          accessCode: guardAccessCodeInput.trim(),
          assignedGateId: guardGateIdInput,
          shift: guardShiftInput,
          contactNumber: guardContactInput.trim(),
          cnic: guardCnicInput.trim(),
          societyId: society.id
        };

        let res: any;
        try {
          res = await api.updateGuard(editingGuardId, payload);
        } catch (apiErr) {
          console.warn('API updateGuard failed, applying local update:', apiErr);
        }

        const existing = localGuards.find(g => g.id === editingGuardId);
        const updatedGuard: Guard = (res && res.guard) ? res.guard : {
          id: editingGuardId,
          societyId: society.id,
          dutyStatus: existing?.dutyStatus || 'ON_DUTY',
          identityVerified: true,
          attendanceRate: existing?.attendanceRate || 100,
          incidentsReported: existing?.incidentsReported || 0,
          shiftStartTime: existing?.shiftStartTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ...payload
        };

        const updated = localGuards.map(g => g.id === editingGuardId ? updatedGuard : g);
        setLocalGuards(updated);
        if (onUpdateGuard) onUpdateGuard(updatedGuard);

        // Sync gate assignedGuardIds
        const newlyAssignedGate = gates.find(gt => gt.id === guardGateIdInput);
        if (newlyAssignedGate && onUpdateGate) {
          const updatedGate: Gate = {
            ...newlyAssignedGate,
            assignedGuardIds: newlyAssignedGate.assignedGuardIds.includes(editingGuardId)
              ? newlyAssignedGate.assignedGuardIds
              : [...newlyAssignedGate.assignedGuardIds, editingGuardId]
          };
          onUpdateGate(updatedGate);
        }

        soundEngine.playSuccessChime();
        setMgmtToastNotice(`Gate Post & Duty Code updated for Guard ${guardNameInput.trim()}! Assigned to: ${newlyAssignedGate?.name || guardGateIdInput}`);
        setTimeout(() => setMgmtToastNotice(null), 5000);
      } else {
        const res = await api.addGuard({
          societyId: society.id,
          name: guardNameInput.trim(),
          badgeNumber: guardBadgeInput.trim() || `SEC-${Math.floor(100 + Math.random() * 900)}`,
          contactNumber: guardContactInput.trim(),
          cnic: guardCnicInput.trim(),
          assignedGateId: guardGateIdInput,
          shift: guardShiftInput,
          accessCode: guardAccessCodeInput.trim()
        });

        const newGuard: Guard = (res && res.guard) ? res.guard : {
          id: `guard_${Date.now()}`,
          societyId: society.id,
          name: guardNameInput.trim(),
          badgeNumber: guardBadgeInput.trim() || `SEC-${Math.floor(100 + Math.random() * 900)}`,
          contactNumber: guardContactInput.trim(),
          cnic: guardCnicInput.trim(),
          assignedGateId: guardGateIdInput,
          shift: guardShiftInput,
          dutyStatus: 'ON_DUTY',
          identityVerified: true,
          attendanceRate: 100,
          incidentsReported: 0,
          shiftStartTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          accessCode: guardAccessCodeInput.trim()
        };

        const updated = [newGuard, ...localGuards];
        setLocalGuards(updated);
        if (onAddGuard) onAddGuard(newGuard);
        setAssignedGuardAnnouncement({
          guard: newGuard,
          code: newGuard.accessCode
        });

        soundEngine.playSuccessChime();
        setMgmtToastNotice(`Guard ${guardNameInput.trim()} registered! Duty Access Code: [${guardAccessCodeInput.trim()}] assigned.`);
        setTimeout(() => setMgmtToastNotice(null), 6000);
      }
      setShowAddGuardModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to register guard. Please try again.');
    } finally {
      setIsSavingGuard(false);
    }
  };

  // Instant 1-Click Gate Duty Allotment
  const handleQuickAllotGuardGate = async (guardId: string, newGateId: string, newShift?: string) => {
    try {
      const targetGuard = localGuards.find(g => g.id === guardId);
      if (!targetGuard) return;
      const targetGate = gates.find(gt => gt.id === newGateId);

      const updatedGuard: Guard = {
        ...targetGuard,
        assignedGateId: newGateId,
        shift: (newShift as any) || targetGuard.shift
      };

      // Optimistic update
      setLocalGuards(prev => prev.map(g => g.id === guardId ? updatedGuard : g));
      if (onUpdateGuard) onUpdateGuard(updatedGuard);

      if (targetGate && onUpdateGate) {
        onUpdateGate({
          ...targetGate,
          assignedGuardIds: targetGate.assignedGuardIds.includes(guardId)
            ? targetGate.assignedGuardIds
            : [...targetGate.assignedGuardIds, guardId]
        });
      }

      soundEngine.playSuccessChime();
      setMgmtToastNotice(`Duty Allotted: Officer ${targetGuard.name} assigned to ${targetGate?.name || newGateId} (${updatedGuard.shift} Shift)`);
      setTimeout(() => setMgmtToastNotice(null), 5000);

      const res = await api.allotGuardToGate(guardId, newGateId, newShift || targetGuard.shift);
      if (res && res.guard) {
        setLocalGuards(prev => prev.map(g => g.id === guardId ? res.guard : g));
        if (onUpdateGuard) onUpdateGuard(res.guard);
      }
      if (res && res.gate && onUpdateGate) {
        onUpdateGate(res.gate);
      }
    } catch (err) {
      console.error('Failed to quick allot guard to gate:', err);
    }
  };

  // Gate Card Level Allotment State
  const [gateAllotGuardSelection, setGateAllotGuardSelection] = useState<Record<string, string>>({});
  const [gateAllotShiftSelection, setGateAllotShiftSelection] = useState<Record<string, string>>({});

  const handleAllotGuardFromGateCard = async (gateId: string) => {
    const chosenGuardId = gateAllotGuardSelection[gateId];
    if (!chosenGuardId) {
      alert('Please select a security guard from the dropdown list to allot them to this gate.');
      return;
    }
    const chosenShift = gateAllotShiftSelection[gateId] || 'MORNING';
    await handleQuickAllotGuardGate(chosenGuardId, gateId, chosenShift);
    setGateAllotGuardSelection(prev => ({ ...prev, [gateId]: '' }));
  };

  const handleCopyCode = (guardId: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedGuardCodeId(guardId);
    setTimeout(() => setCopiedGuardCodeId(null), 2500);
  };

  const toggleRevealCode = (guardId: string) => {
    setRevealedCodes(prev => ({
      ...prev,
      [guardId]: !prev[guardId]
    }));
  };

  // Guard Name - Code Record Management
  const [guardSearchQuery, setGuardSearchQuery] = useState('');
  const [guardRecordViewMode, setGuardRecordViewMode] = useState<'REGISTER' | 'CARDS'>('REGISTER');
  const [copiedRecordGuardId, setCopiedRecordGuardId] = useState<string | null>(null);
  const [copiedAllRecords, setCopiedAllRecords] = useState(false);
  const [showPrintSlipsModal, setShowPrintSlipsModal] = useState(false);

  const handleCopyGuardNameAndCode = (g: Guard) => {
    const text = `${g.name} — ${g.accessCode || '1234'}`;
    navigator.clipboard.writeText(text);
    setCopiedRecordGuardId(g.id);
    setMgmtToastNotice(`Copied record: "${text}"`);
    setTimeout(() => {
      setCopiedRecordGuardId(null);
      setMgmtToastNotice(null);
    }, 2500);
  };

  const handleCopyAllGuardsNameAndCode = () => {
    const lines = [
      `=== ${society.name.toUpperCase()}: OFFICIAL GUARD DUTY CODE REGISTER ===`,
      `Total Guards: ${localGuards.length} | Date: ${new Date().toLocaleDateString()}`,
      `Format: [Guard Name] — [His Duty Access Code]`,
      '------------------------------------------------------------',
      ...localGuards.map((g, idx) => {
        const gate = gates.find(gt => gt.id === g.assignedGateId);
        return `${idx + 1}. ${g.name} — ${g.accessCode || '1234'} (Badge: ${g.badgeNumber} | Gate: ${gate?.name || g.assignedGateId} | Shift: ${g.shift})`;
      }),
      '------------------------------------------------------------',
      'Confidential Security Dossier • Property of Society Management'
    ].join('\n');

    navigator.clipboard.writeText(lines);
    setCopiedAllRecords(true);
    soundEngine.playSuccessChime();
    setMgmtToastNotice(`Copied complete register of all ${localGuards.length} guards (Name — Code) to clipboard!`);
    setTimeout(() => {
      setCopiedAllRecords(false);
      setMgmtToastNotice(null);
    }, 3500);
  };

  const handleDownloadGuardRecords = () => {
    const headers = ['Guard Name', 'Duty Access Code', 'Badge Number', 'Gate Post', 'Shift', 'Duty Status', 'Contact', 'CNIC'];
    const rows = localGuards.map(g => {
      const gate = gates.find(gt => gt.id === g.assignedGateId);
      return [
        `"${g.name}"`,
        `"${g.accessCode || '1234'}"`,
        `"${g.badgeNumber}"`,
        `"${gate?.name || g.assignedGateId}"`,
        `"${g.shift}"`,
        `"${g.dutyStatus}"`,
        `"${g.contactNumber || ''}"`,
        `"${g.cnic || ''}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Guards_Duty_Code_Register_${society.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMgmtToastNotice('Guard Duty Codes ledger downloaded as CSV.');
    setTimeout(() => setMgmtToastNotice(null), 3500);
  };

  // Stats calculation
  const vehiclesInside = vehicles.filter(v => v.status === 'INSIDE').length;
  const visitorsInside = visitors.filter(v => v.status === 'INSIDE').length;
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const criticalAlertsCount = activeAlerts.filter(a => a.severity === 'CRITICAL').length;
  const activeGuardsCount = localGuards.filter(g => g.dutyStatus === 'ON_DUTY').length;

  // Handle AI Query
  const handleAskAI = async (promptToSend?: string) => {
    const q = promptToSend || aiQuestion;
    if (!q.trim()) return;

    const userEntry = { role: 'user' as const, text: q };
    setAiChatLog(prev => [...prev, userEntry]);
    setAiQuestion('');
    setAiLoading(true);

    try {
      const res = await api.askAI(q, society.id, {
        clientSociety: society,
        clientHouses: houses,
        clientVehicles: vehicles
      });
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
                  setSocietyPasscodeInput(getClientSocietyPasscode(society.id) || 'Jamali000117');
                  setShowSocietyModal(true);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-mono border border-slate-700 flex items-center space-x-1 transition-colors"
                title="Edit Society Name, Address & Passcode"
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
              id="select-mgmt-active-society"
              value={society.id}
              onChange={e => handleSocietySelectChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {societies.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Security Guard Quick Header Action */}
          <button
            id="btn-mgmt-top-add-guard"
            type="button"
            onClick={openAddGuardModal}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase shadow-md shadow-cyan-950/50 flex items-center space-x-1.5 transition-all border border-cyan-400/50 active:scale-95 cursor-pointer"
            title="Register a new security guard and assign secret duty code"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Security Guard</span>
          </button>

          {onEnterGuardPortal && (
            <button
              type="button"
              onClick={onEnterGuardPortal}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs uppercase border border-slate-700 flex items-center space-x-1.5 transition-all"
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
          { id: 'GUARDS', label: `Guards & Duty Codes (${localGuards.length})`, icon: Shield },
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
            {/* PROMINENT MANAGEMENT QUICK ACTIONS BANNER */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-cyan-950/40">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/50">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-bold text-white font-mono">
                      SECURITY FORCE &amp; DUTY ROSTER
                    </h4>
                    <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800">
                      MANAGEMENT PORTAL
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Register new security guards, assign secret Duty Access Codes for portal entry, gate posts, and operational shifts.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  id="btn-overview-banner-add-guard"
                  type="button"
                  onClick={openAddGuardModal}
                  className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-cyan-950/70 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>ADD SECURITY GUARD &amp; ASSIGN CODE</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('GUARDS')}
                  className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
                >
                  View All Guards ({localGuards.length}) &rarr;
                </button>
              </div>
            </div>

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

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Active Guards</span>
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-extrabold text-white font-mono">{activeGuardsCount}</div>
                  <span className="text-[11px] font-mono text-cyan-400">{localGuards.length} registered</span>
                </div>
                <div className="pt-1 flex items-center justify-between gap-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={openAddGuardModal}
                    className="text-[11px] font-bold text-cyan-300 hover:text-white bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/80 px-2 py-1 rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Guard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('GUARDS')}
                    className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                  >
                    View Roster &rarr;
                  </button>
                </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <span>PERIMETER ACCESS GATES &amp; GUARD POSTS</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Directly allot security guards to gate duty posts, manage electronic boom barriers, and inspect ANPR cameras.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-3 py-1.5 rounded-lg border border-cyan-800">
                  TOTAL GATES: {gates.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('GUARDS')}
                  className="px-3 py-1.5 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Guard Codes Register</span>
                </button>
                <button
                  type="button"
                  onClick={openAddGuardModal}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-md shadow-cyan-950 border border-cyan-400/40 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Guard</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {gates.map(gate => {
                // Find all guards currently allotted to this gate
                const deployedGuards = localGuards.filter(
                  g => g.assignedGateId === gate.id || (gate.assignedGuardIds && gate.assignedGuardIds.includes(g.id))
                );

                return (
                  <div key={gate.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-white flex items-center space-x-2">
                            <span>{gate.name}</span>
                          </span>
                          <span className="text-[11px] text-slate-400 block">{gate.location || gate.description}</span>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 text-cyan-300 border border-slate-800">
                          {gate.type}
                        </span>
                      </div>

                      {/* Gate Hardware & Barrier Metrics */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Barrier Boom:</span>
                          <strong className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                            gate.barrierState === 'OPEN'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-900 text-slate-200 border border-slate-800'
                          }`}>
                            {gate.barrierState}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">ANPR Vision Camera:</span>
                          <span className="text-emerald-400 font-mono text-[11px]">ACTIVE 60FPS</span>
                        </div>
                      </div>

                      {/* ALLOTTED GUARDS LIST AT THIS GATE */}
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-cyan-300 flex items-center space-x-1.5">
                            <Shield className="w-3.5 h-3.5 text-cyan-400" />
                            <span>ALLOTTED GUARDS ({deployedGuards.length})</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {deployedGuards.filter(g => g.dutyStatus === 'ON_DUTY').length} On Duty Now
                          </span>
                        </div>

                        {deployedGuards.length === 0 ? (
                          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-300 text-xs space-y-1">
                            <div className="font-semibold flex items-center space-x-1">
                              <span>⚠️ No Guard Currently Allotted</span>
                            </div>
                            <p className="text-[11px] text-amber-300/80">
                              Use the allotment selector below to assign an on-duty security guard to this gate.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {deployedGuards.map(guard => {
                              const isCodeRevealed = revealedCodes[guard.id];
                              const isCopied = copiedGuardCodeId === guard.id;

                              return (
                                <div
                                  key={guard.id}
                                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-bold text-white text-xs flex items-center space-x-1.5">
                                        <span>{guard.name}</span>
                                        <span className="text-[10px] text-slate-400 font-mono">({guard.badgeNumber})</span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-mono">
                                        Shift: <span className="text-amber-300">{guard.shift}</span> • {guard.contactNumber || 'No phone'}
                                      </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                      guard.dutyStatus === 'ON_DUTY'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                        : 'bg-slate-900 text-slate-500'
                                    }`}>
                                      {guard.dutyStatus}
                                    </span>
                                  </div>

                                  {/* Secret Duty Code & Quick Reassign */}
                                  <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[10px] text-slate-400 font-mono">Code:</span>
                                      <span className="font-mono text-cyan-300 font-bold">
                                        {isCodeRevealed ? (guard.accessCode || '1234') : '••••'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => toggleRevealCode(guard.id)}
                                        className="text-slate-500 hover:text-cyan-300"
                                      >
                                        {isCodeRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyCode(guard.id, guard.accessCode || '1234')}
                                        className="text-[10px] text-cyan-400 hover:text-cyan-300"
                                      >
                                        {isCopied ? 'Copied' : 'Copy'}
                                      </button>
                                    </div>

                                    {/* Reassign Gate Dropdown */}
                                    <div className="flex items-center space-x-1">
                                      <span className="text-[10px] text-slate-500">Move:</span>
                                      <select
                                        value={guard.assignedGateId}
                                        onChange={e => handleQuickAllotGuardGate(guard.id, e.target.value)}
                                        className="bg-slate-950 border border-slate-700 text-cyan-300 rounded px-1.5 py-0.5 text-[10px] font-mono focus:outline-none"
                                        title="Move guard to another gate post"
                                      >
                                        {gates.map(gt => (
                                          <option key={gt.id} value={gt.id}>
                                            {gt.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* ALLOT GUARD TO THIS GATE FORM */}
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-900/60 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300 font-mono flex items-center space-x-1.5">
                            <Plus className="w-3.5 h-3.5 text-cyan-400" />
                            <span>ALLOT GUARD TO {gate.name.toUpperCase()}</span>
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                              Select Security Guard:
                            </label>
                            <select
                              value={gateAllotGuardSelection[gate.id] || ''}
                              onChange={e => setGateAllotGuardSelection(prev => ({ ...prev, [gate.id]: e.target.value }))}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                            >
                              <option value="">-- Choose Guard to Allot --</option>
                              {localGuards.map(g => {
                                const currentGate = gates.find(gt => gt.id === g.assignedGateId);
                                const isCurrent = g.assignedGateId === gate.id;
                                return (
                                  <option key={g.id} value={g.id}>
                                    {g.name} ({g.badgeNumber}) — {isCurrent ? 'Currently Here' : `At ${currentGate?.name || 'Unassigned'}`} ({g.shift})
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                              Designated Duty Shift:
                            </label>
                            <select
                              value={gateAllotShiftSelection[gate.id] || 'MORNING'}
                              onChange={e => setGateAllotShiftSelection(prev => ({ ...prev, [gate.id]: e.target.value }))}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                            >
                              <option value="MORNING">Morning Shift (06:00 - 14:00)</option>
                              <option value="EVENING">Evening Shift (14:00 - 22:00)</option>
                              <option value="NIGHT">Night Shift (22:00 - 06:00)</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAllotGuardFromGateCard(gate.id)}
                            className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase shadow-md shadow-cyan-950 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm Duty Allotment</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Manual Override Barrier Controls */}
                    <div className="space-y-2 pt-3 border-t border-slate-800">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Barrier Override Controls</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleBarrierToggle(gate.id, 'OPEN')}
                          className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase shadow-md shadow-emerald-950"
                        >
                          OPEN BARRIER
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBarrierToggle(gate.id, 'CLOSE')}
                          className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase"
                        >
                          CLOSE BARRIER
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
                );
              })}
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
          // Deduplicate houses by ID, (societyId + houseNumber), and (societyId + ownerName) to ensure no resident details repeat twice
          const seenHouseIds = new Set<string>();
          const seenHouseNumbers = new Set<string>();
          const seenHouseOwners = new Set<string>();
          const dedupedHouses = houses.filter(h => {
            const numKey = `${h.societyId || ''}::${(h.houseNumber || '').trim().toLowerCase()}`;
            const ownerKey = `${h.societyId || ''}::${(h.ownerName || '').trim().toLowerCase()}`;
            if (seenHouseIds.has(h.id) || seenHouseNumbers.has(numKey) || (h.ownerName && seenHouseOwners.has(ownerKey))) {
              return false;
            }
            seenHouseIds.add(h.id);
            seenHouseNumbers.add(numKey);
            if (h.ownerName) seenHouseOwners.add(ownerKey);
            return true;
          });
          const availableBlocks = Array.from(new Set(dedupedHouses.map(h => h.block).filter(Boolean)));
          const filteredHouses = dedupedHouses.filter(h => {
            if (residentBlockFilter !== 'ALL' && h.block !== residentBlockFilter) {
              return false;
            }

            const houseLiving = livingResidentsList.filter(l => l.houseNumber === h.houseNumber || l.houseId === h.id || l.mainResidentName === h.ownerName);

            // Category filter (Feature 14)
            if (residentCategoryFilter === 'LIVING' && houseLiving.length === 0) {
              return false;
            }
            if (residentCategoryFilter === 'MAIN' && (h.rmpStatus === 'INACTIVE')) {
              return false;
            }
            if (residentCategoryFilter === 'UNDER18' && !houseLiving.some(l => l.isUnder18 || (l.age && l.age < 18))) {
              return false;
            }
            if (residentCategoryFilter === 'ADULT' && !houseLiving.some(l => !l.isUnder18 && (l.age && l.age >= 18))) {
              return false;
            }
            if (residentCategoryFilter === 'ACTIVE' && (h.rmpStatus === 'INACTIVE' && !houseLiving.some(l => l.status === 'ACTIVE'))) {
              return false;
            }
            if (residentCategoryFilter === 'INACTIVE' && (h.rmpStatus !== 'INACTIVE' && !houseLiving.some(l => l.status === 'INACTIVE'))) {
              return false;
            }

            if (!residentSearchQuery.trim()) return true;
            const q = residentSearchQuery.toLowerCase();
            const plates = (h.registeredPlates || (h as any).registeredVehiclePlates || []).map((p: string) => String(p).toLowerCase());
            const matchesLiving = houseLiving.some(l =>
              (l.fullName || '').toLowerCase().includes(q) ||
              (l.cnic || '').toLowerCase().includes(q) ||
              (l.residentCode || '').toLowerCase().includes(q) ||
              (l.qrPassId || '').toLowerCase().includes(q) ||
              (l.phone || '').toLowerCase().includes(q) ||
              (l.relationship || '').toLowerCase().includes(q)
            );

            return (
              (h.ownerName || '').toLowerCase().includes(q) ||
              (h.houseNumber || '').toLowerCase().includes(q) ||
              (h.block || '').toLowerCase().includes(q) ||
              (h.contactNumber || (h as any).phone || '').toLowerCase().includes(q) ||
              (h.email || '').toLowerCase().includes(q) ||
              (h.street || '').toLowerCase().includes(q) ||
              (h.rmpCode || '').toLowerCase().includes(q) ||
              (h.societyResidentAccessCode || '').toLowerCase().includes(q) ||
              plates.some(p => p.includes(q)) ||
              matchesLiving
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
                    {filteredHouses.length} of {dedupedHouses.length} RESIDENCES
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAllResidentsRmpCodes}
                    className="px-3 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 font-mono text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Copy entire resident RMP credentials roster for distribution"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy RMP Roster</span>
                  </button>
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

              {/* Management Toast Notice */}
              {mgmtToastNotice && (
                <div className="p-3.5 rounded-xl bg-purple-950/90 border border-purple-500/80 text-purple-200 text-xs font-mono flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-lg shadow-purple-950/50">
                  <div className="flex items-center space-x-2.5">
                    <MessageSquare className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span>{mgmtToastNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMgmtToastNotice(null)}
                    className="text-purple-400 hover:text-white text-xs underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

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
                    placeholder="Search by resident name, living co-residents, villa #, CNIC, resident code, QR pass ID, phone, or plate..."
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

                {/* Block Filter Pills & View Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
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

                  {/* View Mode Toggle: Cards vs Roster Table */}
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setResidentDirectoryView('CARDS')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
                        residentDirectoryView === 'CARDS'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Arranged Cards View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Cards View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResidentDirectoryView('ROSTER')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
                        residentDirectoryView === 'ROSTER'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Structured Roster Table View (Ordered Columns)"
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>Roster Table</span>
                    </button>
                  </div>
                </div>

                {/* Category Filter Pills (Feature 14) */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pt-3 border-t border-slate-800/80 w-full">
                  <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1 mr-1 shrink-0">
                    <Users className="w-3 h-3 text-cyan-400" />
                    <span>Filter:</span>
                  </span>
                  {[
                    { id: 'ALL', label: 'All Residents' },
                    { id: 'MAIN', label: 'Main Residents' },
                    { id: 'LIVING', label: 'Living Residents' },
                    { id: 'ADULT', label: 'Adult (18+)' },
                    { id: 'UNDER18', label: 'Under 18 (Minors)' },
                    { id: 'ACTIVE', label: 'Active Status' },
                    { id: 'INACTIVE', label: 'Inactive' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setResidentCategoryFilter(cat.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap cursor-pointer ${
                        residentCategoryFilter === cat.id
                          ? 'bg-purple-600 text-white font-bold shadow-sm shadow-purple-950'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Directory Content: Empty State, Cards View, or Table View */}
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
              ) : residentDirectoryView === 'ROSTER' ? (
                /* STRUCTURED ROSTER TABLE VIEW (Columns strictly arranged in order) */
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
                  <table className="w-full text-left text-xs text-slate-300 font-mono">
                    <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 whitespace-nowrap">1. Resident</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">2. Primary Phone</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">3. Alternate (Guards)</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Unit / Block</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Society Code</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">PIN</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Vehicles</th>
                        <th className="py-2.5 px-3 whitespace-nowrap">Emergency / Email</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredHouses.map(house => {
                        const safePlates: string[] = Array.isArray(house.registeredPlates)
                          ? house.registeredPlates
                          : Array.isArray((house as any).registeredVehiclePlates)
                            ? (house as any).registeredVehiclePlates
                            : [];
                        const contact = house.contactNumber || (house as any).phone || 'N/A';
                        const socCode = house.societyResidentAccessCode || society.residentAccessCode || getClientSocietyResidentCode(society.id) || 'aeechsRsdnt10000';

                        return (
                          <tr key={house.id} className="hover:bg-slate-850/50 transition-colors">
                            {/* 1. RESIDENT NAME */}
                            <td className="py-2.5 px-3 font-sans whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => openResidentProfileModal(house)}
                                  className="w-7 h-7 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0 cursor-pointer transition-colors"
                                  title="View Resident Profile"
                                >
                                  <User className="w-4 h-4" />
                                </button>
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => openResidentProfileModal(house)}
                                    className="text-left group cursor-pointer"
                                    title="View Resident Profile Dossier"
                                  >
                                    <span className="font-bold text-white text-xs block group-hover:text-cyan-300 transition-colors">
                                      {house.ownerName}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                                      <span>{house.residentCount ?? 1} res</span>
                                      <span>•</span>
                                      <span className="text-cyan-400 group-hover:underline">Profile</span>
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* 2. PRIMARY NUMBER (SHRUNK & CRISP) */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1.5">
                                  <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="font-bold text-white text-xs select-all">
                                    {contact}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => openContactModal(house, 'GENERAL', '', '', 'PRIMARY')}
                                    className="px-1.5 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[9px] font-mono flex items-center space-x-1 cursor-pointer transition-colors"
                                    title="Contact Primary Number"
                                  >
                                    <PhoneForwarded className="w-2.5 h-2.5" />
                                    <span>Contact</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      soundEngine.playSuccessChime();
                                      setIntercomNotice(`🔊 Calling Intercom at ${house.houseNumber} (${house.ownerName})... Connected.`);
                                      setTimeout(() => setIntercomNotice(null), 4500);
                                    }}
                                    className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[9px] font-mono flex items-center space-x-1 cursor-pointer transition-colors"
                                    title="Call intercom"
                                  >
                                    <PhoneCall className="w-2.5 h-2.5" />
                                    <span>Intercom</span>
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* 3. ALTERNATE NUMBER (SHRUNK & CRISP) */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {house.alternateContactNumber ? (
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-1.5">
                                    <Smartphone className="w-3 h-3 text-cyan-400 shrink-0" />
                                    <span className="font-bold text-cyan-200 text-xs select-all">
                                      {house.alternateContactNumber}
                                    </span>
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono">
                                      Guards
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => openContactModal(house, 'GENERAL', '', '', 'ALTERNATE')}
                                    className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-[9px] font-mono flex items-center space-x-1 cursor-pointer transition-colors"
                                    title="Direct line to Alternate Number"
                                  >
                                    <MessageSquare className="w-2.5 h-2.5" />
                                    <span>Alt Line</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openEditResidentModal(house)}
                                  className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 border border-dashed border-cyan-800/80 px-2 py-0.5 rounded-md hover:bg-cyan-950/40 cursor-pointer whitespace-nowrap"
                                >
                                  + Add for Guards
                                </button>
                              )}
                            </td>

                            {/* HOUSE & BLOCK */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="space-y-0.5">
                                <span className="font-bold text-white text-xs block">
                                  {house.houseNumber}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800 font-mono">
                                  {house.block}
                                </span>
                              </div>
                            </td>

                            {/* SOCIETY RESIDENT ACCESS CODE */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-cyan-300 text-xs select-all">
                                  {socCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(socCode);
                                    soundEngine.playSuccessChime();
                                    setMgmtToastNotice(`Copied Society Code: ${socCode}`);
                                    setTimeout(() => setMgmtToastNotice(null), 3000);
                                  }}
                                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
                                  title="Copy Society Resident Code"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* PERSONAL RESIDENT CODE */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-extrabold text-purple-200 text-xs select-all">
                                  {house.rmpCode || 'PENDING'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (house.rmpCode) {
                                      navigator.clipboard.writeText(house.rmpCode);
                                      soundEngine.playSuccessChime();
                                      setMgmtToastNotice(`Copied Personal Code: ${house.rmpCode}`);
                                      setTimeout(() => setMgmtToastNotice(null), 3000);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
                                  title="Copy Personal Resident Code"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* VEHICLES */}
                            <td className="py-2.5 px-3">
                              {safePlates.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-[160px]">
                                  {safePlates.map(plate => (
                                    <span
                                      key={plate}
                                      className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 font-mono text-[10px] font-bold"
                                    >
                                      {plate}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-500 text-[10px] italic">None</span>
                              )}
                            </td>

                            {/* EMERGENCY & EMAIL */}
                            <td className="py-2.5 px-3 text-[10px] whitespace-nowrap">
                              <div className="space-y-0.5">
                                {house.emergencyContact && (
                                  <span className="text-amber-400 font-semibold block select-all">
                                    Emg: {house.emergencyContact}
                                  </span>
                                )}
                                {house.email && (
                                  <span className="text-slate-400 block truncate max-w-[140px] select-all">
                                    {house.email}
                                  </span>
                                )}
                                {!house.emergencyContact && !house.email && (
                                  <span className="text-slate-500 italic">None</span>
                                )}
                              </div>
                            </td>

                            {/* ACTIONS */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => openResidentProfileModal(house)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 cursor-pointer transition-colors"
                                  title="View Resident Profile Dossier"
                                >
                                  <User className="w-3.5 h-3.5 text-cyan-400" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditResidentModal(house)}
                                  className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-cyan-300 border border-slate-700 cursor-pointer transition-colors"
                                  title="Edit Resident Profile, Name & Contact Numbers"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteResident(house)}
                                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-950 text-slate-500 hover:text-red-400 border border-slate-800 cursor-pointer transition-colors"
                                  title="Delete Resident Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* CARDS VIEW (Clean, ordered, spacious cards) */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {filteredHouses.map(house => {
                    const safePlates: string[] = Array.isArray(house.registeredPlates)
                      ? house.registeredPlates
                      : Array.isArray((house as any).registeredVehiclePlates)
                        ? (house as any).registeredVehiclePlates
                        : [];
                    const contact = house.contactNumber || (house as any).phone || 'N/A';
                    const residentCount = house.residentCount ?? 1;
                    const visitorsCount = house.currentVisitorsCount ?? 0;
                    const socCode = house.societyResidentAccessCode || society.residentAccessCode || getClientSocietyResidentCode(society.id) || 'aeechsRsdnt10000';

                    return (
                      <div
                        key={house.id}
                        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg shadow-slate-950/40 flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          {/* 1. RESIDENT NAME & RESIDENTIAL UNIT HEADER */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
                            <div className="flex items-start space-x-3">
                              <button
                                type="button"
                                onClick={() => openResidentProfileModal(house)}
                                className="w-10 h-10 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 shadow-sm cursor-pointer transition-colors"
                                title="View Resident Profile Dossier"
                              >
                                <User className="w-5 h-5" />
                              </button>
                              <div>
                                <div className="flex items-center space-x-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => openResidentProfileModal(house)}
                                    className="text-left group cursor-pointer"
                                    title="View Resident Profile Dossier"
                                  >
                                    <h4 className="text-base font-bold text-white tracking-wide font-sans group-hover:text-cyan-300 transition-colors">
                                      {house.ownerName}
                                    </h4>
                                  </button>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                                    {house.houseNumber}
                                  </span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                                    {house.block}
                                  </span>
                                </div>
                                {house.street && (
                                  <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-1">
                                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                    <span>{house.street}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
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
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                {residentCount} resident{residentCount > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          {/* 2 & 3. SHRUNK UNIFIED DUAL CONTACT PANEL (PRIMARY & ALTERNATE SIDE-BY-SIDE) */}
                          <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90 shadow-inner">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {/* PRIMARY NUMBER (SHRUNK) */}
                              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-emerald-900/70 flex flex-col justify-between space-y-1.5">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center space-x-1">
                                      <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                                      <span>Primary Phone</span>
                                    </span>
                                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                                      INTERCOM
                                    </span>
                                  </div>
                                  <div className="font-mono text-xs font-bold text-white select-all mt-1 truncate">
                                    {contact}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => openContactModal(house, 'GENERAL', '', '', 'PRIMARY')}
                                    className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 flex items-center space-x-1 transition-colors cursor-pointer"
                                    title="Multi-channel Contact (Call, WhatsApp, SMS)"
                                  >
                                    <PhoneForwarded className="w-2.5 h-2.5" />
                                    <span>Contact</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      soundEngine.playSuccessChime();
                                      setIntercomNotice(`🔊 Calling Intercom at ${house.houseNumber} (${house.ownerName})... Connected.`);
                                      setTimeout(() => setIntercomNotice(null), 4500);
                                    }}
                                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 flex items-center space-x-1 transition-colors cursor-pointer"
                                    title="Call intercom unit"
                                  >
                                    <PhoneCall className="w-2.5 h-2.5" />
                                    <span>Intercom</span>
                                  </button>
                                </div>
                              </div>

                              {/* ALTERNATE NUMBER (SHRUNK) */}
                              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-cyan-900/70 flex flex-col justify-between space-y-1.5">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 flex items-center space-x-1">
                                      <Smartphone className="w-3 h-3 text-cyan-400 shrink-0" />
                                      <span>Alternate Line</span>
                                    </span>
                                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                                      GUARDS
                                    </span>
                                  </div>
                                  <div className="font-mono text-xs font-bold text-cyan-200 select-all mt-1 truncate">
                                    {house.alternateContactNumber || (
                                      <span className="text-slate-500 font-normal italic text-[11px]">Not configured</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 pt-0.5">
                                  {house.alternateContactNumber ? (
                                    <button
                                      type="button"
                                      onClick={() => openContactModal(house, 'GENERAL', '', '', 'ALTERNATE')}
                                      className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 flex items-center space-x-1 transition-colors cursor-pointer"
                                      title="Direct line to Alternate Number"
                                    >
                                      <MessageSquare className="w-2.5 h-2.5" />
                                      <span>Alt Line Hub</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => openEditResidentModal(house)}
                                      className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 border border-dashed border-cyan-800 px-2 py-0.5 rounded hover:bg-cyan-950/50 cursor-pointer"
                                    >
                                      + Add for Guards
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 4. REGISTERED VEHICLES */}
                          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                              <span className="flex items-center space-x-1.5 text-slate-300 font-bold">
                                <CarFront className="w-3.5 h-3.5 text-cyan-400" />
                                <span>REGISTERED VEHICLES ({safePlates.length}):</span>
                              </span>
                              {house.vehicleMake && (
                                <span className="text-slate-400">
                                  {house.vehicleMake} {house.vehicleModel} {house.vehicleColor ? `(${house.vehicleColor})` : ''}
                                </span>
                              )}
                            </div>
                            {safePlates.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {safePlates.map(plate => (
                                  <span
                                    key={plate}
                                    className="px-2.5 py-1 rounded-lg bg-slate-900 text-cyan-300 font-mono text-xs font-bold border border-cyan-800/60 flex items-center space-x-1.5 shadow-sm"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                    <span className="select-all">{plate}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic block">
                                No registered vehicles on file
                              </span>
                            )}
                          </div>

                          {/* CO-RESIDENTS LIVING WITH PRIMARY RESIDENT */}
                          {(() => {
                            const coRes = livingResidentsList.filter(
                              lr => lr.houseId === house.id || lr.houseNumber === house.houseNumber || (house.ownerName && lr.mainResidentName === house.ownerName)
                            );
                            return (
                              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                  <span className="flex items-center space-x-1.5 text-slate-300 font-bold">
                                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>CO-RESIDENTS LIVING HERE ({coRes.length}):</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openEditResidentModal(house)}
                                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                                  >
                                    + Add / Manage
                                  </button>
                                </div>
                                {coRes.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {coRes.map((cr, idx) => {
                                      const isMinor = cr.isUnder18 || (Number(cr.age) > 0 && Number(cr.age) < 18);
                                      return (
                                        <div
                                          key={cr.id || idx}
                                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono"
                                        >
                                          <div className="space-y-0.5">
                                            <div className="flex items-center space-x-1.5">
                                              <span className="font-bold text-white text-xs">{cr.fullName}</span>
                                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                                {cr.relationship}
                                              </span>
                                              {isMinor ? (
                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                                                  Minor (&lt;18)
                                                </span>
                                              ) : (
                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                                                  Adult (18+)
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                                              {isMinor ? (
                                                <span className="text-cyan-300 font-bold">Code: {cr.residentCode || 'N/A'}</span>
                                              ) : (
                                                <span className="text-slate-300">CNIC: {cr.cnic || 'N/A'}</span>
                                              )}
                                              {cr.qrPassId && (
                                                <span className="text-emerald-400">QR: {cr.qrPassId}</span>
                                              )}
                                            </div>
                                          </div>
                                          {cr.qrPassId && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setGeneratedPassModal({
                                                  id: cr.qrPassId,
                                                  type: 'RESIDENT',
                                                  visitorName: cr.fullName,
                                                  hostResident: house.ownerName,
                                                  houseNumber: house.houseNumber,
                                                  purpose: `Resident Family Member (${cr.relationship})`,
                                                  validUntil: 'PERMANENT / RESIDENT ACCESS',
                                                  status: 'ACTIVE',
                                                  gatePermissions: 'All Society Gates & Boom Barriers'
                                                });
                                              }}
                                              className="p-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[10px] cursor-pointer"
                                              title="View Gate QR Pass"
                                            >
                                              <QrCode className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-slate-500 italic">
                                    No co-residents listed. Click "+ Add / Manage" to register members living with {house.ownerName}.
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* 5. RMP (RESIDENT MESSAGES PORTAL) ACCESS CODES */}
                          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-900/60 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1.5 text-[11px] font-mono text-purple-300">
                                <Key className="w-3.5 h-3.5 text-purple-400" />
                                <span className="font-bold">RMP PORTAL ACCESS CODES:</span>
                              </div>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                (house.rmpStatus || 'ACTIVE') === 'ACTIVE'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  : 'bg-red-950 text-red-300 border-red-800'
                              }`}>
                                {house.rmpStatus || 'ACTIVE'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                              {/* Society Resident Code */}
                              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-purple-950">
                                <span className="text-[10px] text-slate-400">Society Code:</span>
                                <span className="font-bold text-cyan-300 select-all truncate ml-2" title="Society Resident Access Code">
                                  {socCode}
                                </span>
                              </div>

                              {/* Personal Resident Code */}
                              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-purple-950">
                                <span className="text-[10px] text-slate-400">Personal Code:</span>
                                <span className="font-extrabold text-purple-200 select-all ml-2">
                                  {house.rmpCode || 'PENDING'}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-purple-900/40">
                              <span className="text-[10px] text-slate-400 font-mono">
                                RMP Multi-Tier Auth
                              </span>
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopyResidentRmpCredentials(house)}
                                  className="px-2.5 py-1 rounded bg-purple-900/80 hover:bg-purple-800 text-purple-200 font-mono text-[10px] border border-purple-700 flex items-center space-x-1 cursor-pointer"
                                  title="Copy RMP connection credentials for WhatsApp/SMS"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Codes</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickResetRmpCode(house)}
                                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700 cursor-pointer"
                                  title="Reset personal RMP code"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickToggleRmpStatus(house)}
                                  className={`px-2 py-1 rounded font-mono text-[10px] border cursor-pointer ${
                                    house.rmpStatus === 'DEACTIVATED'
                                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                      : 'bg-slate-900 text-slate-400 hover:text-amber-300 border-slate-700'
                                  }`}
                                  title={house.rmpStatus === 'DEACTIVATED' ? 'Activate access' : 'Suspend access'}
                                >
                                  {house.rmpStatus === 'DEACTIVATED' ? 'Unblock' : 'Suspend'}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 6. EMERGENCY CONTACT & EMAIL */}
                          {(house.emergencyContact || house.email) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-0.5">
                              {house.emergencyContact && (
                                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/20 border border-amber-900/40">
                                  <div className="flex items-center space-x-1 text-[10px]">
                                    <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span className="text-slate-400">Emergency:</span>
                                    <span className="text-amber-300 font-bold select-all">{house.emergencyContact}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => openContactModal(house, 'EMERGENCY', '', '', 'EMERGENCY')}
                                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 cursor-pointer"
                                  >
                                    Alert
                                  </button>
                                </div>
                              )}
                              {house.email && (
                                <div className="flex items-center space-x-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 truncate">
                                  <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span className="truncate select-all">{house.email}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 7. CARD FOOTER ACTIONS */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => openResidentProfileModal(house)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono text-xs flex items-center space-x-1.5 border border-slate-700 transition-colors cursor-pointer"
                              title="View Resident Profile Dossier"
                            >
                              <User className="w-3.5 h-3.5 text-cyan-400" />
                              <span>View Profile</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditResidentModal(house)}
                              className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-cyan-300 font-mono text-xs flex items-center space-x-1.5 border border-slate-700 transition-colors cursor-pointer"
                              title="Edit Resident Profile, Name & Contact Numbers"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit Profile</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteResident(house)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-red-950/80 text-slate-500 hover:text-red-400 font-mono text-xs flex items-center space-x-1 border border-slate-800 transition-colors cursor-pointer"
                              title="Remove Resident Record"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => openContactModal(house, 'GENERAL', '', '', 'PRIMARY')}
                            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <PhoneForwarded className="w-3 h-3" />
                            <span>Quick Call</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span>SECURITY FORCE &amp; DUTY CODE MANAGEMENT</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Add security guards, assign secret Duty Access Codes, designated gate posts, and operational shifts.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-blue-400 bg-blue-950 px-3 py-1.5 rounded-lg border border-blue-800">
                  ON DUTY: {activeGuardsCount} / {localGuards.length}
                </span>
                <button
                  id="btn-mgmt-add-guard"
                  type="button"
                  onClick={openAddGuardModal}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-950/60 border border-cyan-400/40 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Security Guard</span>
                </button>
              </div>
            </div>

            {/* Newly Assigned Guard Announcement / Handover Slip */}
            {assignedGuardAnnouncement && (
              <div className="p-4 rounded-2xl bg-cyan-950/40 border-2 border-cyan-500/80 text-cyan-200 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-sm text-white">
                      Security Guard Registered &amp; Duties Assigned!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssignedGuardAnnouncement(null)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-cyan-900/60 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Guard Name</span>
                    <span className="font-bold text-white text-sm">{assignedGuardAnnouncement.guard.name}</span>
                    <span className="text-slate-400 text-[10px] block font-mono">{assignedGuardAnnouncement.guard.badgeNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Assigned Gate Post</span>
                    <span className="font-semibold text-cyan-300">
                      {gates.find(gt => gt.id === assignedGuardAnnouncement.guard.assignedGateId)?.name || assignedGuardAnnouncement.guard.assignedGateId}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Duty Shift</span>
                    <span className="font-semibold text-amber-300">{assignedGuardAnnouncement.guard.shift}</span>
                  </div>
                  <div className="bg-cyan-950/90 p-2.5 rounded-lg border border-cyan-500 text-center space-y-1">
                    <span className="text-[10px] text-cyan-300 font-bold block uppercase tracking-wider">
                      Secret Duty Access Code
                    </span>
                    <div className="font-mono text-base font-black text-white tracking-widest">
                      {assignedGuardAnnouncement.code}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(assignedGuardAnnouncement.guard.id, assignedGuardAnnouncement.code)}
                      className="text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-0.5 rounded font-semibold transition-colors"
                    >
                      {copiedGuardCodeId === assignedGuardAnnouncement.guard.id ? 'Copied Code!' : 'Copy Code for Guard'}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-cyan-300/80">
                  Notice: Give this secret Duty Code to the security guard. When the guard enters the Guard Portal, they will enter this code to authenticate, deploy to their gate post, and unlock barrier controls.
                </p>
              </div>
            )}

            {/* Toolbar: Guard Name - Code Record Registry */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shadow">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                      <span>GUARD RECORDS &amp; DUTY CODES REGISTER</span>
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-mono">
                        {localGuards.length} RECORDED
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Official society management record matching each security guard's name with their assigned Duty Code.
                    </p>
                  </div>
                </div>

                {/* Quick Actions: Copy All Records, Download CSV, Print Slips */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAllGuardsNameAndCode}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Copy full roster in 'Guard Name — His Code' format"
                  >
                    {copiedAllRecords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAllRecords ? 'Copied Full Register!' : '📋 Copy All (Name — Code)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadGuardRecords}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Download guard records spreadsheet"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPrintSlipsModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Print duty handover slips"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Print Handover Slips</span>
                  </button>
                </div>
              </div>

              {/* Search & View Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={guardSearchQuery}
                    onChange={e => setGuardSearchQuery(e.target.value)}
                    placeholder="Filter by guard name, duty code, or badge..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  {guardSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setGuardSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setGuardRecordViewMode('REGISTER')}
                    className={`px-3 py-1 rounded-lg font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
                      guardRecordViewMode === 'REGISTER'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Record Ledger (Name — Code)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuardRecordViewMode('CARDS')}
                    className={`px-3 py-1 rounded-lg font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
                      guardRecordViewMode === 'CARDS'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Profile Cards</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filtered Guards list */}
            {(() => {
              const query = guardSearchQuery.trim().toLowerCase();
              const filtered = localGuards.filter(g => {
                if (!query) return true;
                const gate = gates.find(gt => gt.id === g.assignedGateId);
                return (
                  g.name.toLowerCase().includes(query) ||
                  (g.accessCode && g.accessCode.toLowerCase().includes(query)) ||
                  g.badgeNumber.toLowerCase().includes(query) ||
                  (gate && gate.name.toLowerCase().includes(query)) ||
                  g.shift.toLowerCase().includes(query)
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
                    <Shield className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-semibold text-slate-300">No security guards match "{guardSearchQuery}"</p>
                    <button
                      type="button"
                      onClick={() => setGuardSearchQuery('')}
                      className="text-cyan-400 hover:underline cursor-pointer"
                    >
                      Clear search filter
                    </button>
                  </div>
                );
              }

              {/* MODE 1: OFFICIAL REGISTER TABLE (Name — Code) */}
              if (guardRecordViewMode === 'REGISTER') {
                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 font-mono text-cyan-300">
                        <BadgeCheck className="w-4 h-4 text-cyan-400" />
                        <span>OFFICIAL SOCIETY MASTER RECORD: GUARD NAME — HIS CODE</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Showing {filtered.length} of {localGuards.length} guards
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider">
                            <th className="py-3 px-4">#</th>
                            <th className="py-3 px-4">Guard Full Name</th>
                            <th className="py-3 px-4">Official Duty Access Code</th>
                            <th className="py-3 px-4">Assigned Gate Post</th>
                            <th className="py-3 px-4">Shift Hours</th>
                            <th className="py-3 px-4">Duty Status</th>
                            <th className="py-3 px-4 text-right">Actions &amp; Copy Record</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {filtered.map((g, idx) => {
                            const assignedGate = gates.find(gt => gt.id === g.assignedGateId);
                            const isRevealed = revealedCodes[g.id];
                            const isCopiedRecord = copiedRecordGuardId === g.id;
                            const isCopiedCode = copiedGuardCodeId === g.id;

                            return (
                              <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-3.5 px-4 font-mono text-slate-500">{idx + 1}</td>
                                
                                {/* Guard Name */}
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-white text-sm flex items-center space-x-2">
                                    <span>{g.name}</span>
                                    <span className="text-[10px] text-slate-400 font-mono font-normal">
                                      ({g.badgeNumber})
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {g.contactNumber || 'No phone recorded'} {g.cnic ? `• CNIC: ${g.cnic}` : ''}
                                  </div>
                                </td>

                                {/* Official Duty Access Code (His Code) */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center space-x-2">
                                    <div className="px-3 py-1 rounded-lg bg-slate-950 border border-cyan-800 font-mono font-bold text-sm tracking-widest text-cyan-300">
                                      {isRevealed ? (g.accessCode || '1234') : '••••'}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => toggleRevealCode(g.id)}
                                      className="text-slate-400 hover:text-cyan-300 p-1"
                                      title={isRevealed ? 'Hide Code' : 'Reveal Code'}
                                    >
                                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </td>

                                {/* Gate Post with Quick Duty Allotment */}
                                <td className="py-3.5 px-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="font-semibold text-white">
                                        {assignedGate?.name || g.assignedGateId}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <span className="text-[10px] text-cyan-400 font-mono">Allot:</span>
                                      <select
                                        value={g.assignedGateId}
                                        onChange={e => handleQuickAllotGuardGate(g.id, e.target.value)}
                                        className="bg-slate-950 border border-slate-700 hover:border-cyan-500 rounded px-1.5 py-0.5 text-[10px] text-cyan-300 font-mono focus:outline-none transition-colors"
                                        title="Change this guard's allotted gate duty post"
                                      >
                                        {gates.map(gt => (
                                          <option key={gt.id} value={gt.id}>
                                            {gt.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                                      {assignedGate?.location || 'Designated Gate'}
                                    </div>
                                  </div>
                                </td>

                                {/* Shift with Quick Shift Switcher */}
                                <td className="py-3.5 px-4 font-mono">
                                  <div className="space-y-1">
                                    <select
                                      value={g.shift}
                                      onChange={e => handleQuickAllotGuardGate(g.id, g.assignedGateId, e.target.value)}
                                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800 hover:border-amber-600 focus:outline-none cursor-pointer"
                                      title="Change duty shift hours"
                                    >
                                      <option value="MORNING">MORNING (06-14)</option>
                                      <option value="EVENING">EVENING (14-22)</option>
                                      <option value="NIGHT">NIGHT (22-06)</option>
                                    </select>
                                  </div>
                                </td>

                                {/* Duty Status */}
                                <td className="py-3.5 px-4 font-mono">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    g.dutyStatus === 'ON_DUTY'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : 'bg-slate-950 text-slate-500'
                                  }`}>
                                    {g.dutyStatus}
                                  </span>
                                </td>

                                {/* Action: Copy Record (Guard Name - His Code) */}
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => handleCopyGuardNameAndCode(g)}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                                        isCopiedRecord
                                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                          : 'bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800'
                                      }`}
                                      title="Copy record in 'Name — Code' format"
                                    >
                                      {isCopiedRecord ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>{isCopiedRecord ? 'Copied Record!' : 'Copy Name — Code'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openEditGuardDutiesModal(g)}
                                      className="p-1 text-slate-400 hover:text-blue-300 rounded hover:bg-slate-800 cursor-pointer"
                                      title="Edit Guard Duties & Reassign Code"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              {/* MODE 2: PROFILE CARDS */}
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filtered.map(g => {
                    const assignedGate = gates.find(gt => gt.id === g.assignedGateId);
                    const isRevealed = revealedCodes[g.id];
                    const isCopiedCode = copiedGuardCodeId === g.id;
                    const isCopiedRecord = copiedRecordGuardId === g.id;

                    return (
                      <div key={g.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5 hover:border-slate-700 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-white text-sm">{g.name}</h4>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-xs text-slate-400 font-mono">Badge: {g.badgeNumber}</span>
                              {g.cnic && (
                                <span className="text-[10px] text-slate-400 font-mono">| {g.cnic}</span>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            g.dutyStatus === 'ON_DUTY' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-950 text-slate-500'
                          }`}>
                            {g.dutyStatus}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 font-mono">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Gate Post:</span>
                            <select
                              value={g.assignedGateId}
                              onChange={e => handleQuickAllotGuardGate(g.id, e.target.value)}
                              className="bg-slate-900 border border-slate-700 hover:border-cyan-500 rounded px-2 py-0.5 text-xs text-cyan-300 font-mono focus:outline-none max-w-[140px]"
                              title="Allot to another gate post"
                            >
                              {gates.map(gt => (
                                <option key={gt.id} value={gt.id}>
                                  {gt.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Shift:</span>
                            <select
                              value={g.shift}
                              onChange={e => handleQuickAllotGuardGate(g.id, g.assignedGateId, e.target.value)}
                              className="bg-slate-900 border border-slate-700 hover:border-amber-500 rounded px-2 py-0.5 text-xs text-amber-300 font-mono focus:outline-none"
                              title="Change duty shift hours"
                            >
                              <option value="MORNING">Morning (06-14)</option>
                              <option value="EVENING">Evening (14-22)</option>
                              <option value="NIGHT">Night (22-06)</option>
                            </select>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Contact:</span>
                            <span className="text-slate-300">{g.contactNumber || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Attendance:</span>
                            <span className="text-emerald-400 font-bold">{g.attendanceRate}%</span>
                          </div>
                        </div>

                        {/* Secret Duty Access Code Card */}
                        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-900/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-cyan-300 flex items-center space-x-1">
                              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Guard Duty Access Code:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleRevealCode(g.id)}
                              className="text-[10px] text-slate-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
                            >
                              {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                            <span className="font-mono text-sm tracking-wider font-bold text-white">
                              {isRevealed ? (g.accessCode || '1234') : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(g.id, g.accessCode || '1234')}
                              className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                            >
                              {isCopiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{isCopiedCode ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Record Copy & Edit */}
                        <div className="pt-1 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleCopyGuardNameAndCode(g)}
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 py-1 px-2 rounded-lg bg-cyan-950/50 border border-cyan-900/60 hover:bg-cyan-950 transition-colors"
                          >
                            {isCopiedRecord ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopiedRecord ? 'Copied!' : 'Copy Name — Code'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditGuardDutiesModal(g)}
                            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1 py-1 px-2 rounded-lg hover:bg-slate-800/80 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Duties &amp; Code</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

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

                {/* Management Portal Access Passcode */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-amber-300 font-bold flex items-center space-x-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Management Access Passcode</span>
                    </label>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80">
                      Owner &amp; Admin Secret
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSocietyPasscode ? 'text' : 'password'}
                      value={societyPasscodeInput}
                      onChange={e => setSocietyPasscodeInput(e.target.value)}
                      placeholder="e.g. Jamali000117"
                      className="w-full bg-slate-950 border border-amber-800/80 rounded-xl px-3.5 py-2.5 text-xs text-amber-200 font-mono focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSocietyPasscode(!showSocietyPasscode)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-amber-300 cursor-pointer"
                    >
                      {showSocietyPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Passcode required by Society Management and President to access this Administration Command Center.
                  </p>
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
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-5 space-y-3.5 shadow-2xl shadow-slate-950 animate-in fade-in zoom-in-95 my-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-mono flex items-center space-x-2">
                      <span>{editingResidentId ? 'EDIT RESIDENT PROFILE & CONTACT NUMBERS' : 'REGISTER NEW RESIDENT PROFILE'}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {editingResidentId
                        ? `Update resident name, intercom phone, alternate number, and vehicles for ${resOwnerName || 'Resident'}`
                        : 'Register resident full name, primary intercom number, alternate number, and vehicles'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResidentModal(false)}
                  className="text-slate-400 hover:text-white text-sm p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveResident} className="space-y-3.5 text-xs">
                {/* 1. RESIDENT IDENTITY & CONTACT NUMBERS (SHRUNK COMPACT PANEL) */}
                <div className="p-3 rounded-xl bg-slate-950 border border-cyan-800/80 shadow-md space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <div className="flex items-center space-x-1.5 text-cyan-300">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[11px] font-mono uppercase font-bold tracking-wider">
                        1. Resident Full Name &amp; Contact Numbers
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-800 font-semibold flex items-center space-x-1">
                      <PhoneCall className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Direct Guard Intercom Sync</span>
                    </span>
                  </div>

                  {/* 1A. RESIDENT FULL NAME */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-200 font-bold text-[11px] flex items-center space-x-1">
                        <User className="w-3 h-3 text-cyan-400" />
                        <span>Resident Full Name</span>
                        <span className="text-red-400 font-bold">*</span>
                      </label>
                      <span className="text-[9px] text-slate-400 font-mono">Owner / Primary Resident</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={resOwnerName}
                      onChange={e => setResOwnerName(e.target.value)}
                      placeholder="e.g. Babar Gauri / Dr. Sarah Vance"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-none transition-colors shadow-inner"
                    />
                  </div>

                  {/* 1B. PRIMARY & ALTERNATE CONTACT NUMBERS (SHRUNK & FULLY VISIBLE) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                    {/* Primary Contact Number (Shrunk) */}
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-emerald-900/80 space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <label className="block text-emerald-300 font-bold text-[11px] flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>Primary Phone</span>
                          <span className="text-red-400 font-bold">*</span>
                        </label>
                        <span className="text-[8px] font-mono text-emerald-300 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800 font-bold">
                          INTERCOM
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        value={resContactNumber}
                        onChange={e => setResContactNumber(e.target.value)}
                        placeholder="e.g. +92-300-7766554"
                        className="w-full bg-slate-950 border border-emerald-800 focus:border-emerald-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none transition-colors shadow-inner"
                      />
                      <p className="text-[9px] text-emerald-400/80 leading-tight">
                        Guards dial this primary line to verify visitors and cabs.
                      </p>
                    </div>

                    {/* Alternate Contact Number (Shrunk) */}
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-cyan-900/80 space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <label className="block text-cyan-300 font-bold text-[11px] flex items-center space-x-1">
                          <Smartphone className="w-3 h-3 text-cyan-400" />
                          <span>Alternate Phone</span>
                        </label>
                        <span className="text-[8px] font-mono text-cyan-300 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800 font-bold">
                          GUARDS
                        </span>
                      </div>
                      <input
                        type="text"
                        value={resAlternateContactNumber}
                        onChange={e => setResAlternateContactNumber(e.target.value)}
                        placeholder="e.g. +92-321-9988776 (WhatsApp)"
                        className="w-full bg-slate-950 border border-cyan-800 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none transition-colors shadow-inner"
                      />
                      <p className="text-[9px] text-cyan-400/80 leading-tight">
                        Secondary / WhatsApp line dialed if primary line is busy.
                      </p>
                    </div>
                  </div>

                  {/* 1C. PRIMARY RESIDENT CNIC (NATIONAL IDENTITY) & AUTO QR PASS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-900">
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-slate-200 font-bold text-[11px] flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3 text-cyan-400" />
                          <span>Primary Resident CNIC</span>
                        </label>
                        <span className="text-[8px] font-mono text-cyan-300 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800 font-bold">
                          ADULT 18+
                        </span>
                      </div>
                      <input
                        type="text"
                        value={resCnic}
                        onChange={e => setResCnic(e.target.value)}
                        placeholder="e.g. 37405-1234567-1"
                        className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none transition-colors shadow-inner"
                      />
                      <p className="text-[9px] text-slate-400 leading-tight">
                        Society adds CNIC for adult primary resident. Guards can verify residency via CNIC at the gate.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/80 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center space-x-1">
                          <QrCode className="w-3 h-3 text-emerald-400" />
                          <span>Gate Clearance QR Pass</span>
                        </span>
                        <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                          AUTO-ISSUED
                        </span>
                      </div>
                      <div className="text-[11px] font-mono font-bold text-white pt-1">
                        {editingResidentId
                          ? `SEC247-PASS-${(resOwnerName || 'RES').toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 14)}`
                          : 'Auto-issued upon save'}
                      </div>
                      <p className="text-[9px] text-emerald-300/80 leading-tight pt-0.5">
                        Guards scan this digital QR pass to grant swift entry at society boom barriers.
                      </p>
                    </div>
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

                {/* Street, Email & Emergency Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={resEmergencyContact}
                      onChange={e => setResEmergencyContact(e.target.value)}
                      placeholder="e.g. +92-333-1122334"
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

                {/* 3. RESIDENTS LIVING WITH PRIMARY RESIDENT (CO-RESIDENTS & MINORS) */}
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/70 space-y-3.5 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <label className="text-cyan-300 font-bold font-mono text-xs block">
                          3. RESIDENTS LIVING WITH PRIMARY RESIDENT (CO-RESIDENTS &amp; MINORS)
                        </label>
                        <p className="text-[10px] text-slate-400">
                          Register family members, children, and dependents living with {resOwnerName || 'Primary Resident'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
                      {resLivingResidents.length} Co-Resident(s)
                    </span>
                  </div>

                  {/* Operational Rule Callout */}
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] space-y-1.5 leading-relaxed text-slate-300">
                    <div className="font-bold text-cyan-300 flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Society Verification &amp; Pass Issuance Rules:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 text-[10px]">
                      <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
                        <span className="font-bold text-amber-300 block mb-0.5">Under 18 (Minors / Children):</span>
                        <span>Society assigns a <strong>Resident Code</strong>. When a minor (e.g. 14 years old) arrives, guards ask their age and enter this code to verify residency.</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
                        <span className="font-bold text-emerald-300 block mb-0.5">18 or Older (Adults):</span>
                        <span>Society enters their <strong>CNIC Number</strong>. Guards verify adult residents directly against their National ID.</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 font-mono pt-1">
                      <QrCode className="w-3 h-3 text-emerald-400" />
                      <span>Gate QR Passes are automatically generated by the app for all registered co-residents.</span>
                    </div>
                  </div>

                  {/* List of Added Co-Residents */}
                  {resLivingResidents.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                          Currently Registered Household Co-Residents ({resLivingResidents.length}):
                        </div>
                        {resOwnerName.trim().split(' ').length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const parts = resOwnerName.trim().split(' ');
                              const familySurname = parts[parts.length - 1];
                              if (!familySurname) return;
                              setResLivingResidents(prev => prev.map(lr => {
                                const lrParts = lr.fullName.trim().split(' ');
                                if (lrParts.length > 1) {
                                  lrParts[lrParts.length - 1] = familySurname;
                                  return { ...lr, fullName: lrParts.join(' ') };
                                } else if (lrParts.length === 1 && lrParts[0]) {
                                  return { ...lr, fullName: `${lrParts[0]} ${familySurname}` };
                                }
                                return lr;
                              }));
                              soundEngine.playSuccessChime();
                              setMgmtToastNotice(`Synced all co-resident surnames to "${familySurname}"!`);
                              setTimeout(() => setMgmtToastNotice(null), 3000);
                            }}
                            className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline flex items-center space-x-1 cursor-pointer"
                            title="Update co-resident surnames to match primary resident's surname"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>Sync Surnames ({resOwnerName.trim().split(' ').slice(-1)[0]})</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {resLivingResidents.map((lr, idx) => {
                          const isMinor = lr.isUnder18 || (Number(lr.age) > 0 && Number(lr.age) < 18);
                          const isEditingThis = editingLivingIndex === idx;

                          if (isEditingThis) {
                            return (
                              <div
                                key={lr.id || `lr_${idx}`}
                                className="p-3 rounded-xl bg-slate-900 border-2 border-cyan-500/70 space-y-2.5 shadow-lg"
                              >
                                <div className="flex items-center justify-between text-xs font-mono text-cyan-300 font-bold border-b border-slate-800 pb-1.5">
                                  <span>Edit Co-Resident Details</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingLivingIndex(null)}
                                    className="text-slate-400 hover:text-white text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Full Name &amp; Surname</label>
                                    <input
                                      type="text"
                                      value={lr.fullName}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setResLivingResidents(prev => prev.map((item, i) => i === idx ? { ...item, fullName: val } : item));
                                      }}
                                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-2 py-1 text-xs text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Relationship</label>
                                    <select
                                      value={lr.relationship}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setResLivingResidents(prev => prev.map((item, i) => i === idx ? { ...item, relationship: val } : item));
                                      }}
                                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-2 py-1 text-xs text-white"
                                    >
                                      <option value="Son">Son</option>
                                      <option value="Daughter">Daughter</option>
                                      <option value="Wife">Wife</option>
                                      <option value="Husband">Husband</option>
                                      <option value="Father">Father</option>
                                      <option value="Mother">Mother</option>
                                      <option value="Brother">Brother</option>
                                      <option value="Sister">Sister</option>
                                      <option value="Dependent">Dependent</option>
                                      <option value="House Help">House Help</option>
                                      <option value="Driver">Driver</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Age</label>
                                    <input
                                      type="number"
                                      min={1}
                                      max={110}
                                      value={lr.age || ''}
                                      onChange={e => {
                                        const num = Number(e.target.value);
                                        const under18 = num > 0 ? num < 18 : lr.isUnder18;
                                        setResLivingResidents(prev => prev.map((item, i) => i === idx ? { ...item, age: num, isUnder18: under18 } : item));
                                      }}
                                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-2 py-1 text-xs text-white"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingLivingIndex(null);
                                      soundEngine.playSuccessChime();
                                    }}
                                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold font-mono flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Done Editing</span>
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={lr.id || `lr_${idx}`}
                              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-800/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-white text-xs">{lr.fullName}</span>
                                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    {lr.relationship}
                                  </span>
                                  {isMinor ? (
                                    <span className="text-[9px] font-mono px-2 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold flex items-center space-x-1">
                                      <Lock className="w-2.5 h-2.5" />
                                      <span>Age {lr.age || '<18'} • Minor (Code Required)</span>
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-mono px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                                      Age {lr.age || '18+'} • Adult (CNIC)
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono pt-0.5">
                                  {isMinor ? (
                                    <span className="text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                                      Resident Code: <strong className="text-white tracking-wider">{lr.residentCode || 'PENDING'}</strong>
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                      CNIC: <strong className="text-white font-mono">{lr.cnic || 'Pending Registration'}</strong>
                                    </span>
                                  )}
                                  <span className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80 flex items-center space-x-1">
                                    <QrCode className="w-3 h-3 text-emerald-400" />
                                    <span>QR Pass: {lr.qrPassId || 'Auto-generated on save'}</span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => setEditingLivingIndex(idx)}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center space-x-1 border border-slate-700 cursor-pointer"
                                  title="Edit Co-Resident Name / Details"
                                >
                                  <Edit3 className="w-3 h-3 text-cyan-400" />
                                  <span>Edit</span>
                                </button>
                                {lr.qrPassId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGeneratedPassModal({
                                        id: lr.qrPassId,
                                        passType: 'LIVING_RESIDENT',
                                        holderName: lr.fullName,
                                        hostResidentName: resOwnerName || 'Household',
                                        houseNumber: resHouseNumber || 'Villa',
                                        purpose: `Resident Family Member (${lr.relationship})`,
                                        validUntil: 'PERMANENT / RESIDENT ACCESS',
                                        status: 'ACTIVE',
                                        secureToken: lr.qrPassId
                                      } as any);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-[10px] font-mono flex items-center space-x-1 transition-colors cursor-pointer"
                                  >
                                    <QrCode className="w-3 h-3" />
                                    <span>View QR Pass</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLivingFromResidentModal(lr.id || lr.fullName)}
                                  className="p-1 rounded-lg bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-400 border border-slate-700 hover:border-red-800 text-xs transition-colors cursor-pointer"
                                  title="Remove Co-Resident"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-900/50 border border-dashed border-slate-800 text-center text-[11px] text-slate-400">
                      No co-residents currently listed. Use the subform below to add children, spouses, or dependents living with {resOwnerName || 'this resident'}.
                    </div>
                  )}

                  {/* Add Co-Resident Subform */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white flex items-center space-x-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                        <span>+ Add Resident Living With Primary Resident</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">Auto-generates Gate QR Pass</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-slate-300 text-[10px] font-bold mb-1">
                          Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={resNewLivingName}
                          onChange={e => setResNewLivingName(e.target.value)}
                          placeholder="Enter co-resident full name..."
                          className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 text-[10px] font-bold mb-1">Relationship</label>
                        <select
                          value={resNewLivingRel}
                          onChange={e => setResNewLivingRel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="Son">Son</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Wife">Wife</option>
                          <option value="Husband">Husband</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                          <option value="Dependent">Dependent</option>
                          <option value="House Help">House Help</option>
                          <option value="Driver">Driver</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-300 text-[10px] font-bold">
                            Age <span className="text-red-400">*</span>
                          </label>
                          {resNewLivingAge !== '' && (
                            <span className={`text-[8px] font-mono px-1 rounded font-bold ${
                              Number(resNewLivingAge) < 18 ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                            }`}>
                              {Number(resNewLivingAge) < 18 ? 'MINOR (<18)' : 'ADULT (18+)'}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={110}
                          value={resNewLivingAge}
                          onChange={e => {
                            const val = e.target.value;
                            setResNewLivingAge(val);
                            if (Number(val) < 18 && val !== '' && !resNewLivingCode) {
                              const init = resNewLivingName.trim().slice(0, 3).toUpperCase() || 'RES';
                              const rand = Math.floor(10000 + Math.random() * 90000);
                              setResNewLivingCode(`${init}-${rand}`);
                            }
                          }}
                          placeholder="e.g. 14"
                          className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* DYNAMIC AGE-BASED FIELD: RESIDENT CODE vs CNIC */}
                    {resNewLivingAge !== '' && Number(resNewLivingAge) < 18 ? (
                      /* MINOR UNDER 18: CODE FIELD */
                      <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/70 space-y-1.5 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <label className="text-amber-300 font-bold text-[10px] font-mono flex items-center space-x-1">
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>Minor Under 18: Resident Verification Code</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const init = resNewLivingName.trim().slice(0, 3).toUpperCase() || 'RES';
                              const rand = Math.floor(10000 + Math.random() * 90000);
                              setResNewLivingCode(`${init}-${rand}`);
                            }}
                            className="text-[9px] font-mono text-amber-400 hover:text-amber-200 underline"
                          >
                            Regenerate Code
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={resNewLivingCode}
                            onChange={e => setResNewLivingCode(e.target.value.toUpperCase())}
                            placeholder="e.g. ZYG-48291"
                            className="flex-1 bg-slate-950 border border-amber-800 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-amber-200 font-mono font-bold focus:outline-none uppercase"
                          />
                        </div>
                        <p className="text-[9px] text-amber-300/80 leading-tight">
                          When this minor arrives at the gate and states they are {resNewLivingAge || '14'} years old living with {resOwnerName || 'the resident'}, guard enters this code to instantly verify them.
                        </p>
                      </div>
                    ) : (
                      /* ADULT 18+: CNIC FIELD */
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-200 font-bold text-[10px] font-mono flex items-center space-x-1">
                            <ShieldCheck className="w-3 h-3 text-cyan-400" />
                            <span>Adult 18 or Older: CNIC / National ID</span>
                            {Number(resNewLivingAge) >= 18 && <span className="text-red-400">*</span>}
                          </label>
                          <span className="text-[8px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                            NATIONAL ID
                          </span>
                        </div>
                        <input
                          type="text"
                          value={resNewLivingCnic}
                          onChange={e => setResNewLivingCnic(e.target.value)}
                          placeholder="e.g. 37405-1829301-1"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                        />
                        <p className="text-[9px] text-slate-400 leading-tight">
                          Guards enter this CNIC at the gate to verify adult identity and residency.
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[10px] text-slate-400 flex items-center space-x-1 font-mono">
                        <QrCode className="w-3 h-3 text-emerald-400" />
                        <span>QR Pass generated automatically</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddLivingToResidentModal}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono flex items-center space-x-1 transition-colors shadow-sm cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Co-Resident</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RMP (Resident Messages Portal) Access Credentials */}
                <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-purple-300 font-bold font-mono text-xs flex items-center space-x-1.5">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      <span>RMP (RESIDENT MESSAGES PORTAL) ACCESS CODES</span>
                    </label>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      resRmpStatus === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : 'bg-red-950 text-red-300 border border-red-700'
                    }`}>
                      {resRmpStatus}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Configure the access codes that this resident will enter when connecting to the <strong>Resident Messages Portal (RMP)</strong> to pre-authorize visitors, deliveries, and ride-hails.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option 1: Society Resident Access Code */}
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-900/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-cyan-300 text-[10px] font-mono font-bold tracking-wide uppercase flex items-center space-x-1">
                          <Building2 className="w-3 h-3 text-cyan-400" />
                          <span>1. Society Resident Access Code</span>
                        </label>
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                          RMP Step 2
                        </span>
                      </div>

                      <div className="flex gap-1.5">
                        <input
                          id="input-res-society-code"
                          type="text"
                          required
                          value={resSocietyResidentCode}
                          onChange={e => setResSocietyResidentCode(e.target.value.trim())}
                          placeholder="e.g. aeechsRsdnt10000"
                          className="flex-1 bg-slate-900 border border-cyan-800 rounded-xl px-3 py-1.5 text-xs text-cyan-200 font-mono font-bold focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const defCode = society.residentAccessCode || getClientSocietyResidentCode(society.id) || (society.id.includes('aeechs') ? 'aeechsRsdnt10000' : `${(society.name || 'soc').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}Rsdnt10000`);
                            setResSocietyResidentCode(defCode);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px] cursor-pointer"
                          title="Reset to society default code"
                        >
                          Default
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-normal">
                        Code entered by the resident to connect their household to {society.name}.
                      </p>

                      <label className="flex items-center space-x-2 pt-1.5 border-t border-slate-900 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={resUpdateSocietyDefaultCode}
                          onChange={e => setResUpdateSocietyDefaultCode(e.target.checked)}
                          className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-300 font-medium">
                          Update as society default code for all units
                        </span>
                      </label>
                    </div>

                    {/* Option 2: Personal Resident Access Code */}
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-900/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-purple-300 text-[10px] font-mono font-bold tracking-wide uppercase flex items-center space-x-1">
                          <Key className="w-3 h-3 text-purple-400" />
                          <span>2. Personal Resident Access Code</span>
                        </label>
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                          RMP Step 3
                        </span>
                      </div>

                      <div className="flex gap-1.5">
                        <input
                          id="input-res-personal-rmp-code"
                          type="text"
                          required
                          value={resRmpCode}
                          onChange={e => setResRmpCode(e.target.value.toUpperCase())}
                          placeholder="e.g. TA-4819"
                          className="flex-1 bg-slate-900 border border-purple-700 rounded-xl px-3 py-1.5 text-xs text-purple-200 font-mono font-extrabold focus:outline-none focus:border-purple-400 uppercase tracking-wider"
                        />
                        <button
                          type="button"
                          onClick={() => setResRmpCode(generateResidentRMPCode(resOwnerName || 'Resident'))}
                          className="px-2.5 py-1 rounded-xl bg-purple-800 hover:bg-purple-700 text-white font-mono text-[10px] font-bold cursor-pointer"
                          title="Auto-generate a new code based on resident name"
                        >
                          Generate
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-normal">
                        Unique personal security PIN assigned strictly to this household unit.
                      </p>

                      <div className="pt-1.5 border-t border-slate-900">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">Portal Status:</span>
                          <select
                            value={resRmpStatus}
                            onChange={e => setResRmpStatus(e.target.value as 'ACTIVE' | 'DEACTIVATED')}
                            className="bg-slate-900 border border-purple-800 rounded-lg px-2 py-0.5 text-[11px] text-white font-mono focus:outline-none"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="DEACTIVATED">DEACTIVATED</option>
                          </select>
                        </div>
                      </div>
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

        {/* MODAL 2B: DEDICATED RESIDENT PROFILE DOSSIER (VIEW PROFILE) */}
        {viewingResidentProfile && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-5 space-y-3.5 shadow-2xl shadow-slate-950 animate-in fade-in zoom-in-95 my-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-mono flex items-center space-x-2">
                      <span>RESIDENT PROFILE DOSSIER</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Official records for {viewingResidentProfile.ownerName} ({viewingResidentProfile.houseNumber})
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const h = viewingResidentProfile;
                      setViewingResidentProfile(null);
                      openEditResidentModal(h);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
                    title="Edit Name, Numbers & Vehicles"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingResidentProfile(null)}
                    className="text-slate-400 hover:text-white text-sm p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Profile Card Banner */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300 font-bold text-base font-mono shrink-0">
                    {viewingResidentProfile.ownerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'RS'}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white font-sans">
                      {viewingResidentProfile.ownerName}
                    </h4>
                    <div className="flex items-center space-x-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                        {viewingResidentProfile.houseNumber}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                        {viewingResidentProfile.block}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {viewingResidentProfile.residentCount ?? 1} Res
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>GATE VERIFIED</span>
                  </span>
                </div>
              </div>

              {/* Contact Lines Grid (Shrunk & Crisp) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Primary Number (Shrunk) */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-900/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span className="uppercase">Primary Intercom</span>
                    </span>
                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                      MAIN LINE
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white select-all truncate">
                    {viewingResidentProfile.contactNumber || 'Not Configured'}
                  </div>
                  <p className="text-[9px] text-emerald-400/80 leading-tight">
                    Guards use this line to announce visitors and get clearances.
                  </p>
                  <div className="flex items-center space-x-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const h = viewingResidentProfile;
                        setViewingResidentProfile(null);
                        openContactModal(h, 'GENERAL', '', '', 'PRIMARY');
                      }}
                      className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <PhoneForwarded className="w-2.5 h-2.5" />
                      <span>Contact</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playSuccessChime();
                        setIntercomNotice(`🔊 Calling Intercom at ${viewingResidentProfile.houseNumber} (${viewingResidentProfile.ownerName})... Connected.`);
                        setTimeout(() => setIntercomNotice(null), 4500);
                      }}
                      className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[10px] font-mono flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <PhoneCall className="w-2.5 h-2.5" />
                      <span>Intercom</span>
                    </button>
                    {viewingResidentProfile.contactNumber && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(viewingResidentProfile.contactNumber, `primary-${viewingResidentProfile.id}`)}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[10px] cursor-pointer"
                        title="Copy number"
                      >
                        {copiedKey === `primary-${viewingResidentProfile.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Alternate Number (Shrunk) */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-900/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 flex items-center space-x-1">
                      <Smartphone className="w-3 h-3" />
                      <span className="uppercase">Alternate Line</span>
                    </span>
                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                      GUARDS
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-cyan-200 select-all truncate">
                    {viewingResidentProfile.alternateContactNumber || (
                      <span className="text-slate-500 font-normal italic">None configured</span>
                    )}
                  </div>
                  <p className="text-[9px] text-cyan-400/80 leading-tight">
                    Secondary or WhatsApp line dialed if primary is busy.
                  </p>
                  <div className="flex items-center space-x-1.5 pt-0.5">
                    {viewingResidentProfile.alternateContactNumber ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const h = viewingResidentProfile;
                            setViewingResidentProfile(null);
                            openContactModal(h, 'GENERAL', '', '', 'ALTERNATE');
                          }}
                          className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>Alt Line</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(viewingResidentProfile.alternateContactNumber!, `alt-${viewingResidentProfile.id}`)}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[10px] cursor-pointer"
                          title="Copy alternate number"
                        >
                          {copiedKey === `alt-${viewingResidentProfile.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const h = viewingResidentProfile;
                          setViewingResidentProfile(null);
                          openEditResidentModal(h);
                        }}
                        className="px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-dashed border-cyan-700 text-[10px] font-mono cursor-pointer"
                      >
                        + Add Alternate Number
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Household Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Address & Street */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>STREET &amp; SECTOR</span>
                  </span>
                  <div className="font-semibold text-white">
                    {viewingResidentProfile.street || 'Main Boulevard'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {viewingResidentProfile.block} • {society.name}
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-amber-400 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>EMERGENCY LINE</span>
                  </span>
                  <div className="font-mono font-bold text-amber-300 select-all">
                    {viewingResidentProfile.emergencyContact || 'None listed'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Dialed during gate emergency
                  </div>
                </div>

                {/* Email */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-purple-400" />
                    <span>EMAIL NOTICE</span>
                  </span>
                  <div className="text-white truncate select-all">
                    {viewingResidentProfile.email || 'No email registered'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Official digital circulars
                  </div>
                </div>
              </div>

              {/* Registered Vehicles */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center space-x-1.5">
                    <Car className="w-3.5 h-3.5 text-cyan-400" />
                    <span>REGISTERED VEHICLES &amp; NUMBER PLATES</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    RFID &amp; ANPR Gate Sync
                  </span>
                </div>
                {viewingResidentProfile.registeredPlates && viewingResidentProfile.registeredPlates.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {viewingResidentProfile.registeredPlates.map((plate, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs border border-cyan-800 flex items-center space-x-1.5 shadow-sm"
                      >
                        <CarFront className="w-3 h-3 text-cyan-400" />
                        <span>{plate}</span>
                      </span>
                    ))}
                    {(viewingResidentProfile.vehicleMake || viewingResidentProfile.vehicleModel) && (
                      <span className="text-[11px] text-slate-400 font-mono pl-1">
                        ({viewingResidentProfile.vehicleMake} {viewingResidentProfile.vehicleModel} - {viewingResidentProfile.vehicleColor || 'White'})
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 italic">No vehicles registered yet.</span>
                )}
              </div>

              {/* RMP Portal & Society Resident Access Credentials */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-300 flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    <span>RMP PORTAL ACCESS CODES (FOR THIS RESIDENT)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    {viewingResidentProfile.rmpStatus || 'ACTIVE'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-mono">Society Resident Code:</span>
                      <span className="font-mono font-bold text-xs text-white select-all">
                        {viewingResidentProfile.societyResidentAccessCode || society.residentAccessCode || getClientSocietyResidentCode(society.id) || 'aeechsRsdnt10000'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(viewingResidentProfile.societyResidentAccessCode || society.residentAccessCode || getClientSocietyResidentCode(society.id) || 'aeechsRsdnt10000', `soc-${viewingResidentProfile.id}`)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs cursor-pointer"
                      title="Copy Society Code"
                    >
                      {copiedKey === `soc-${viewingResidentProfile.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-purple-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-purple-300 block font-mono">Personal Household RMP PIN:</span>
                      <span className="font-mono font-extrabold text-xs text-purple-200 tracking-wider select-all">
                        {viewingResidentProfile.rmpCode || 'RS-1001'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(viewingResidentProfile.rmpCode || 'RS-1001', `rmp-${viewingResidentProfile.id}`)}
                      className="p-1 rounded bg-purple-950 hover:bg-purple-900 text-purple-300 text-xs cursor-pointer"
                      title="Copy Household PIN"
                    >
                      {copiedKey === `rmp-${viewingResidentProfile.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* FEATURE 3 & 13: RESIDENTS LIVING WITH MAIN RESIDENT TABLE */}
              {(() => {
                const currentLiving = livingResidentsList.filter(
                  lr => lr.houseNumber === viewingResidentProfile.houseNumber || lr.houseId === viewingResidentProfile.id || lr.mainResidentName === viewingResidentProfile.ownerName
                );

                return (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-800/60 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                            Residents Living With Main Resident
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800">
                            {currentLiving.length} Co-residents
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Registered household members, individual verification credentials, and automatic gate QR clearance.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openAddLivingResidentModal(viewingResidentProfile)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-cyan-950/40 cursor-pointer shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Add Living Resident</span>
                      </button>
                    </div>

                    {currentLiving.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase">
                              <th className="py-2 pr-3">Resident Name</th>
                              <th className="py-2 px-3">Age Category</th>
                              <th className="py-2 px-3">Verification ID</th>
                              <th className="py-2 px-3">Resident Code</th>
                              <th className="py-2 px-3">Gate QR Pass</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 pl-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono">
                            {currentLiving.map((lr) => {
                              const isMinor = lr.isUnder18 || (lr.age && lr.age < 18);
                              const maskedCnic = lr.cnic ? (lr.cnic.length >= 13 ? `${lr.cnic.slice(0, 5)}-*******-${lr.cnic.slice(-1)}` : `*****${lr.cnic.slice(-4)}`) : 'None';
                              return (
                                <tr key={lr.id} className="hover:bg-slate-900/60 transition-colors">
                                  <td className="py-2.5 pr-3">
                                    <div className="font-sans font-bold text-white flex items-center space-x-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setViewingLivingProfile(lr)}
                                        className="text-cyan-300 hover:underline hover:text-cyan-200 text-left cursor-pointer"
                                      >
                                        {lr.fullName}
                                      </button>
                                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 text-slate-300 border border-slate-800">
                                        {lr.relationship}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-sans">
                                      {lr.gender} • {lr.age} yrs
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {isMinor ? (
                                      <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold flex items-center space-x-1 w-fit">
                                        <Shield className="w-2.5 h-2.5" />
                                        <span>Under 18 (Minor)</span>
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold w-fit">
                                        Adult (18+)
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {isMinor ? (
                                      <span className="text-[10px] text-purple-300">Protected Minor Code</span>
                                    ) : (
                                      <span className="text-[10px] text-amber-300">{maskedCnic}</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="text-xs font-bold text-cyan-400">
                                      {lr.residentCode || (isMinor ? 'PENDING' : 'N/A')}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {lr.qrPassId ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const pass: any = {
                                            id: lr.qrPassId,
                                            secureToken: `SEC247-TOKEN-${lr.id}`,
                                            holderName: lr.fullName,
                                            hostResidentName: lr.mainResidentName,
                                            houseNumber: lr.houseNumber,
                                            passType: 'LIVING_RESIDENT',
                                            status: lr.qrStatus || 'ACTIVE',
                                            validFrom: '2026-01-01',
                                            validUntil: '2026-12-31',
                                            purpose: `Resident Access (${lr.relationship})`
                                          };
                                          setGeneratedPassModal(pass);
                                        }}
                                        className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                                      >
                                        <QrCode className="w-3 h-3 text-emerald-400" />
                                        <span>Active QR</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleGenerateLivingQRPass(lr)}
                                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] cursor-pointer"
                                      >
                                        + Issue QR
                                      </button>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lr.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                                      {lr.status || 'ACTIVE'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 pl-3 text-right">
                                    <div className="flex items-center justify-end space-x-1">
                                      <button
                                        type="button"
                                        onClick={() => setViewingLivingProfile(lr)}
                                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] px-2 cursor-pointer"
                                        title="View Full Living Resident Profile"
                                      >
                                        Profile
                                      </button>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const nextStatus = lr.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                                          try {
                                            await api.updateLivingResident(lr.id, { status: nextStatus });
                                            setLivingResidentsList(prev => prev.map(item => item.id === lr.id ? { ...item, status: nextStatus } : item));
                                            setMgmtToastNotice(`Living Resident status set to ${nextStatus}`);
                                            setTimeout(() => setMgmtToastNotice(null), 3000);
                                          } catch {
                                            alert('Failed to update resident status');
                                          }
                                        }}
                                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] px-1.5 cursor-pointer"
                                        title="Toggle Active Status"
                                      >
                                        {lr.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                        <Users className="w-6 h-6 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400">No additional living residents registered for House {viewingResidentProfile.houseNumber} yet.</p>
                        <p className="text-[10px] text-slate-500">You can register spouse, children, parents, or staff without limits.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewingResidentProfile(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Close Dossier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const h = viewingResidentProfile;
                    setViewingResidentProfile(null);
                    openEditResidentModal(h);
                  }}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-950/50 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile, Name &amp; Phone Numbers</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* MODAL: PRINT / EXPORT OFFICIAL GUARD DUTY CODE SLIPS */}
        {showPrintSlipsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <span>OFFICIAL GUARD DUTY SLIPS &amp; CODE REGISTER</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Record sheets formatted as [Guard Name — His Code] for duty deployment, physical dossiers, and handover.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slips</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrintSlipsModal(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Printable Content Area */}
              <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
                {/* Official Society Header */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <div className="text-xs text-cyan-400 font-mono uppercase tracking-wider font-bold">
                    {society.name} • Security &amp; Access Control Division
                  </div>
                  <h2 className="text-base font-bold text-white font-mono">
                    OFFICIAL SECURITY FORCE RECORD: GUARD NAME — HIS CODE
                  </h2>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Total Active Force: {localGuards.length} Guards | Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                  </div>
                </div>

                {/* Individual Guard Slips Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {localGuards.map((g, idx) => {
                    const assignedGate = gates.find(gt => gt.id === g.assignedGateId);
                    const isCopied = copiedRecordGuardId === g.id;

                    return (
                      <div
                        key={g.id}
                        className="p-4 rounded-2xl bg-slate-950 border-2 border-slate-800 hover:border-cyan-800 transition-colors space-y-3 relative"
                      >
                        <div className="flex items-start justify-between border-b border-slate-800/80 pb-2.5">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono block">GUARD NAME:</span>
                            <span className="text-base font-bold text-white tracking-wide">{g.name}</span>
                            <div className="text-xs text-slate-400 font-mono">Badge: {g.badgeNumber}</div>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            #{idx + 1}
                          </span>
                        </div>

                        {/* Duty Access Code Highlight (His Code) */}
                        <div className="bg-cyan-950/70 border border-cyan-800/80 p-3 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-cyan-300 block uppercase tracking-wider">
                              Assigned Duty Access Code:
                            </span>
                            <span className="text-lg font-mono font-black text-white tracking-widest">
                              {g.accessCode || '1234'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyGuardNameAndCode(g)}
                            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? 'Copied!' : 'Copy Slip Record'}</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-500 text-[10px] block">GATE POST:</span>
                            <span className="font-semibold text-slate-200 truncate block">
                              {assignedGate?.name || g.assignedGateId}
                            </span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-500 text-[10px] block">SHIFT:</span>
                            <span className="font-semibold text-amber-300 block">
                              {g.shift}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-dashed border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Verified by: Society Management</span>
                          <span>Auth Signature: ______________</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCopyAllGuardsNameAndCode}
                  className="px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold flex items-center space-x-2 cursor-pointer"
                >
                  {copiedAllRecords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAllRecords ? 'Copied Full Register!' : 'Copy Complete Register (Name — Code)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintSlipsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {showAddGuardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <span>{editingGuardId ? 'Edit Guard Duties & Access Code' : 'Register Guard & Assign Duty Code'}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Assign gate post, shift hours, and provide secret duty code for portal entry.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddGuardModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveGuard} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-slate-300 text-xs font-semibold mb-1">
                      Guard Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="input-new-guard-name"
                      type="text"
                      required
                      value={guardNameInput}
                      onChange={e => setGuardNameInput(e.target.value)}
                      placeholder="e.g. Kamran Akram"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-slate-300 text-xs font-semibold mb-1">
                      Badge Number
                    </label>
                    <input
                      id="input-new-guard-badge"
                      type="text"
                      value={guardBadgeInput}
                      onChange={e => setGuardBadgeInput(e.target.value)}
                      placeholder="e.g. SEC-119"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">
                      CNIC / National ID
                    </label>
                    <input
                      id="input-new-guard-cnic"
                      type="text"
                      value={guardCnicInput}
                      onChange={e => setGuardCnicInput(e.target.value)}
                      placeholder="e.g. 37405-1234567-1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">
                      Contact Phone
                    </label>
                    <input
                      id="input-new-guard-contact"
                      type="text"
                      value={guardContactInput}
                      onChange={e => setGuardContactInput(e.target.value)}
                      placeholder="e.g. +92-300-1234567"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                {/* Duty Assignments: Gate Post & Shift */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block font-mono flex items-center space-x-1.5">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span>Duty Deployment Assignments:</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Selected: <strong className="text-cyan-400">{effectiveGates.find(g => g.id === guardGateIdInput)?.name || guardGateIdInput}</strong>
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-slate-300 text-xs font-semibold">
                      Designated Gate Post
                    </label>

                    {/* Visual 1-Click Gate Post Tiles */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {effectiveGates.map(gate => {
                        const isChosen = guardGateIdInput === gate.id;
                        return (
                          <button
                            key={gate.id}
                            type="button"
                            onClick={() => setGuardGateIdInput(gate.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isChosen
                                ? 'bg-cyan-950 border-cyan-400 shadow-md shadow-cyan-950/80 text-white ring-1 ring-cyan-400'
                                : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold truncate">{gate.name}</span>
                              {isChosen && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 ml-1" />}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              Post #{gate.gateNumber || 1} • {gate.type}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Standard Dropdown Selector */}
                    <select
                      id="select-new-guard-gate"
                      value={guardGateIdInput}
                      onChange={e => setGuardGateIdInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      {effectiveGates.map(gate => (
                        <option key={gate.id} value={gate.id}>
                          {gate.name} ({gate.type}) — {gate.location || 'Designated Gate Post'}
                        </option>
                      ))}
                      {!effectiveGates.some(g => g.id === guardGateIdInput) && guardGateIdInput && (
                        <option value={guardGateIdInput}>
                          Assigned: {guardGateIdInput}
                        </option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">
                      Duty Shift
                    </label>
                    <select
                      id="select-new-guard-shift"
                      value={guardShiftInput}
                      onChange={e => setGuardShiftInput(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="MORNING">Morning (06:00 - 14:00)</option>
                      <option value="EVENING">Evening (14:00 - 22:00)</option>
                      <option value="NIGHT">Night (22:00 - 06:00)</option>
                    </select>
                  </div>
                </div>

                {/* Secret Duty Access Code (Crucial Requirement) */}
                <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-700/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                      <KeyRound className="w-4 h-4 text-cyan-400" />
                      <span>Secret Duty Access Code (For Guard Portal)</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomDutyCode}
                      className="text-[11px] bg-cyan-900/60 hover:bg-cyan-800 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-700 transition-colors font-semibold"
                    >
                      🎲 Generate PIN
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      id="input-new-guard-code"
                      type={showAccessCodeInModal ? 'text' : 'password'}
                      required
                      value={guardAccessCodeInput}
                      onChange={e => setGuardAccessCodeInput(e.target.value)}
                      placeholder="e.g. 4821 or 1234"
                      className="w-full bg-slate-950 border border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono tracking-widest text-center pr-10 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccessCodeInModal(!showAccessCodeInModal)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showAccessCodeInModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Management gives this secret code to the security guard. When the guard opens the Guard Portal, they will enter this code to authenticate and be automatically assigned their gate post and barrier controls.
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddGuardModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-save-guard-assignment"
                    type="submit"
                    disabled={isSavingGuard}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingGuard ? (
                      <span>Assigning Duties...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{editingGuardId ? 'Update Duties & Code' : 'Register Guard & Assign Code'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CROSS-SOCIETY ACCESS RESTRICTION MODAL */}
        {isSwitchModalOpen && pendingSwitchSociety && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-amber-800/70 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-slate-950/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-600/70 flex items-center justify-center text-amber-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white font-mono tracking-wider flex items-center space-x-2">
                      <span>RESTRICTED ACCESS</span>
                    </h2>
                    <p className="text-xs text-amber-300/90 font-medium">
                      Cross-Society Authorization Required
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="close-switch-society-modal"
                  onClick={() => setIsSwitchModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleVerifySwitchPasscode} className="p-6 space-y-4">
                {/* Visual context of society switch */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Current Portal:</span>
                    <span className="font-semibold text-slate-300 truncate max-w-[200px] text-right">{society.name}</span>
                  </div>
                  <div className="h-px bg-slate-800" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-400 font-medium flex items-center space-x-1">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Target Portal:</span>
                    </span>
                    <span className="font-bold text-white truncate max-w-[200px] text-right">{pendingSwitchSociety.name}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/50 text-[11px] text-amber-200/90 space-y-1">
                  <p className="font-semibold text-amber-300">Strict Access Control:</p>
                  <p>
                    Management personnel from another society cannot access or monitor other societies without entering the target society's administrative passcode.
                  </p>
                </div>

                {/* Error Banner */}
                {switchError && (
                  <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-200 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{switchError}</p>
                      {switchFailedCount > 0 && (
                        <p className="text-[10px] text-red-300/80 mt-1">
                          ⚠️ Security Warning: Unauthorized access attempts are monitored and recorded in the audit log.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Passcode Input - strictly no hint displayed */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Target Society Passcode
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Confidential</span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 text-slate-500 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-cross-society-passcode"
                      type={showSwitchPasscode ? 'text' : 'password'}
                      value={switchPasscode}
                      onChange={e => setSwitchPasscode(e.target.value)}
                      placeholder={`Enter passcode for ${pendingSwitchSociety.name}...`}
                      autoFocus
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSwitchPasscode(!showSwitchPasscode)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showSwitchPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsSwitchModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Stay in Current Society
                  </button>
                  <button
                    id="btn-verify-society-switch"
                    type="submit"
                    disabled={isSwitchVerifying}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-950/60 border border-amber-400/40 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <span>{isSwitchVerifying ? 'Verifying...' : 'Authenticate & Enter'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD LIVING RESIDENT (FEATURE 3, 5, 6) */}
        {showAddLivingModal && targetHouseForLiving && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-slate-900 border border-cyan-800/80 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-6">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                      <span>REGISTER LIVING RESIDENT</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        Villa {targetHouseForLiving.houseNumber}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Co-resident under main resident {targetHouseForLiving.ownerName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddLivingModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveLivingResident} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-mono text-slate-300 flex items-center space-x-1">
                      <span>Full Legal Name</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={livingFullName}
                      onChange={e => setLivingFullName(e.target.value)}
                      placeholder="e.g. Ayesha Khan"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>

                  {/* Relationship */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Relationship to Main Resident</label>
                    <select
                      value={livingRelationship}
                      onChange={e => setLivingRelationship(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                    >
                      <option value="Wife">Wife</option>
                      <option value="Husband">Husband</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Dependent">Dependent</option>
                      <option value="Relative">Relative</option>
                      <option value="Staff/Domestic Helper">Staff / Domestic Helper</option>
                      <option value="Driver">Driver</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Gender</label>
                    <select
                      value={livingGender}
                      onChange={e => setLivingGender(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                    >
                      <option value="FEMALE">Female</option>
                      <option value="MALE">Male</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {/* Date of Birth & Live Age Calculation (Feature 5) */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-slate-300 flex items-center space-x-1">
                        <span>Date of Birth</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${livingIsUnder18 ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-blue-950 text-blue-300 border border-blue-800'}`}>
                        {livingAge} Years Old ({livingIsUnder18 ? 'Minor Under 18' : 'Adult 18+'})
                      </span>
                    </div>
                    <input
                      type="date"
                      required
                      value={livingDob}
                      onChange={e => {
                        const val = e.target.value;
                        setLivingDob(val);
                        if (val) {
                          const birthDate = new Date(val);
                          const today = new Date();
                          let calcAge = today.getFullYear() - birthDate.getFullYear();
                          const m = today.getMonth() - birthDate.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                            calcAge--;
                          }
                          const under18 = calcAge < 18;
                          setLivingAge(calcAge);
                          setLivingIsUnder18(under18);
                          if (under18 && !livingResidentCode) {
                            setLivingResidentCode(`ZYG-${Math.floor(10000 + Math.random() * 90000)}`);
                          }
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>

                  {/* Conditional Verification Field based on Age (Feature 5) */}
                  {livingIsUnder18 ? (
                    <div className="sm:col-span-2 p-3.5 rounded-xl bg-purple-950/40 border border-purple-700/60 space-y-2">
                      <div className="flex items-center space-x-2 text-purple-300 text-xs font-mono font-bold">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span>MINOR PROTECTION PROTOCOL (UNDER 18)</span>
                      </div>
                      <p className="text-[11px] text-purple-200/80 leading-relaxed">
                        Under-18 minors are legally protected. CNIC is not stored. A dedicated unique Resident Code is generated for gate ANPR and manual guard verification.
                      </p>
                      <div className="pt-1">
                        <label className="text-[10px] font-mono text-purple-300 block mb-1">Assigned Resident Code</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={livingResidentCode || 'ZYG-48291'}
                            onChange={e => setLivingResidentCode(e.target.value.toUpperCase())}
                            className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-purple-800 text-xs font-mono text-cyan-300 font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => setLivingResidentCode(`ZYG-${Math.floor(10000 + Math.random() * 90000)}`)}
                            className="px-2.5 py-2 rounded-lg bg-purple-900 hover:bg-purple-800 text-purple-200 text-xs font-mono cursor-pointer"
                          >
                            Regenerate
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="sm:col-span-2 p-3.5 rounded-xl bg-blue-950/40 border border-blue-700/60 space-y-2">
                      <div className="flex items-center space-x-2 text-blue-300 text-xs font-mono font-bold">
                        <BadgeCheck className="w-4 h-4 text-blue-400" />
                        <span>ADULT VERIFICATION PROTOCOL (18+)</span>
                      </div>
                      <p className="text-[11px] text-blue-200/80 leading-relaxed">
                        Adult residents require a valid Pakistani 13-digit CNIC or Smart Card for gate clearance and audit record-keeping.
                      </p>
                      <div className="pt-1">
                        <label className="text-[10px] font-mono text-blue-300 block mb-1">
                          National ID (CNIC) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required={!livingIsUnder18}
                          value={livingCnic}
                          onChange={e => setLivingCnic(e.target.value)}
                          placeholder="e.g. 37405-1234567-1"
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-blue-800 text-xs font-mono text-white placeholder-slate-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Personal Phone (Optional)</label>
                    <input
                      type="tel"
                      value={livingPhone}
                      onChange={e => setLivingPhone(e.target.value)}
                      placeholder="e.g. 0300-1234567"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300">Emergency Phone</label>
                    <input
                      type="tel"
                      value={livingEmergencyContact}
                      onChange={e => setLivingEmergencyContact(e.target.value)}
                      placeholder="e.g. 0321-9876543"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-mono flex items-center space-x-2">
                  <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automatic QR Pass: An authorized Living Resident QR Pass will be generated instantly upon creation.</span>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLivingModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingLiving}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-950/60 cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isSavingLiving ? 'Saving Resident...' : 'Save & Issue QR Pass'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: VIEW LIVING RESIDENT PROFILE (FEATURE 4, 13) */}
        {viewingLivingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-slate-900 border border-cyan-800/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-6">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                      <span>{viewingLivingProfile.fullName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {viewingLivingProfile.relationship}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Living at Villa {viewingLivingProfile.houseNumber} • Host: {viewingLivingProfile.mainResidentName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingLivingProfile(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Status & Category Bar */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-400">Category:</span>
                    {viewingLivingProfile.isUnder18 ? (
                      <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold flex items-center space-x-1">
                        <Shield className="w-2.5 h-2.5" />
                        <span>Minor (Under 18)</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold">
                        Adult (18+)
                      </span>
                    )}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                    viewingLivingProfile.status === 'ACTIVE'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-red-950 text-red-300 border border-red-800'
                  }`}>
                    {viewingLivingProfile.status || 'ACTIVE'}
                  </span>
                </div>

                {/* Identity & Verification Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Identity Verification Details</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Date of Birth:</span>
                      <span className="text-white font-bold">{viewingLivingProfile.dateOfBirth || 'Not recorded'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Age &amp; Gender:</span>
                      <span className="text-white font-bold">{viewingLivingProfile.age} yrs • {viewingLivingProfile.gender}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Resident Verification Code:</span>
                      <span className="text-cyan-300 font-extrabold select-all">{viewingLivingProfile.residentCode || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">National CNIC:</span>
                      <span className="text-amber-300 font-bold select-all">
                        {viewingLivingProfile.isUnder18 ? 'Protected Minor' : (viewingLivingProfile.cnic || 'None')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Personal Phone:</span>
                      <span className="text-slate-300">{viewingLivingProfile.phone || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Emergency Contact:</span>
                      <span className="text-amber-300 font-bold">{viewingLivingProfile.emergencyContact || 'None'}</span>
                    </div>
                  </div>
                </div>

                {/* Gate QR Pass Section */}
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono font-bold text-emerald-300">GATE CLEARANCE PASS</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {viewingLivingProfile.qrStatus || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span>Pass ID:</span>
                    <span className="font-bold text-white select-all">{viewingLivingProfile.qrPassId || 'SEC247-PASS-LR'}</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const pass: any = {
                          id: viewingLivingProfile.qrPassId || `SEC247-PASS-${viewingLivingProfile.id}`,
                          secureToken: `SEC247-LVTKN-${viewingLivingProfile.id}`,
                          holderName: viewingLivingProfile.fullName,
                          hostResidentName: viewingLivingProfile.mainResidentName,
                          houseNumber: viewingLivingProfile.houseNumber,
                          passType: 'LIVING_RESIDENT',
                          status: viewingLivingProfile.qrStatus || 'ACTIVE',
                          validFrom: '2026-01-01',
                          validUntil: '2026-12-31',
                          purpose: `Living Resident Pass (${viewingLivingProfile.relationship})`
                        };
                        setGeneratedPassModal(pass);
                      }}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-950 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View &amp; Share QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateLivingQRPass(viewingLivingProfile)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={async () => {
                      const nextStatus = viewingLivingProfile.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                      try {
                        await api.updateLivingResident(viewingLivingProfile.id, { status: nextStatus });
                        setLivingResidentsList(prev => prev.map(item => item.id === viewingLivingProfile.id ? { ...item, status: nextStatus } : item));
                        setViewingLivingProfile({ ...viewingLivingProfile, status: nextStatus });
                        setMgmtToastNotice(`Resident status updated to ${nextStatus}`);
                        setTimeout(() => setMgmtToastNotice(null), 3000);
                      } catch {
                        alert('Failed to update status');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border cursor-pointer ${
                      viewingLivingProfile.status === 'ACTIVE'
                        ? 'bg-red-950/40 text-red-300 border-red-800 hover:bg-red-900/60'
                        : 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                    }`}
                  >
                    {viewingLivingProfile.status === 'ACTIVE' ? 'Deactivate Resident' : 'Activate Resident'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingLivingProfile(null)}
                    className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: QR PASS VIEWER, SAVING, SHARING & CLOSE OPTIONS */}
        {generatedPassModal && (() => {
          const passHolderName = generatedPassModal.holderName || (generatedPassModal as any).visitorName || 'Resident';
          const passHostName = generatedPassModal.hostResidentName || (generatedPassModal as any).hostResident || '';
          const isCoResident = Boolean(passHostName && passHostName.trim().toLowerCase() !== passHolderName.trim().toLowerCase());
          const passRoleLabel = isCoResident ? `Co-Resident (Living with ${passHostName})` : 'Primary Resident';

          const whatsappMessage = [
            `*SECURE 24/7 SOCIETY GATE ACCESS PASS*`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            `👤 *Resident Name:* ${passHolderName}`,
            `🏷️ *Resident Classification:* ${passRoleLabel}`,
            `🏡 *House / Villa:* ${generatedPassModal.houseNumber || 'Unit'}`,
            ...(isCoResident ? [`👨‍👩‍👧 *Household / Primary Resident:* ${passHostName}`] : []),
            `🎫 *Gate Pass ID:* ${generatedPassModal.id}`,
            `🔑 *Access Token:* ${generatedPassModal.secureToken || generatedPassModal.id}`,
            `🛡️ *Access Status:* ACTIVE / AUTHORIZED`,
            `📅 *Validity:* ${generatedPassModal.validUntil || 'PERMANENT RESIDENT ACCESS'}`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            `📲 *Gate Entry Instructions:*`,
            `Show this digital QR pass code at the gate scanner or guard terminal for instant verified barrier clearance.`
          ].join('\n');

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
              <div className="bg-slate-900 border border-emerald-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-6">
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono">GATE CLEARANCE PASS</h3>
                      <p className="text-[10px] text-slate-400">SECURE 24/7 ENCRYPTED ACCESS TOKEN</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGeneratedPassModal(null)}
                    className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center space-x-1 transition-colors"
                    title="Close QR Code"
                  >
                    <X className="w-4 h-4 text-slate-400 hover:text-red-400" />
                    <span className="text-xs font-mono">Close</span>
                  </button>
                </div>

                <div className="p-6 space-y-4 text-center">
                  {/* Visual QR Code Display */}
                  <div className="p-6 rounded-2xl bg-white text-slate-950 inline-block mx-auto shadow-xl border-4 border-emerald-500/30">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        generatedPassModal.secureToken || generatedPassModal.id
                      )}`}
                      alt="Gate QR Code"
                      className="w-48 h-48 mx-auto"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-[10px] font-mono font-bold text-slate-700 mt-2 tracking-widest uppercase">
                      Scan At Gate Kiosk
                    </div>
                  </div>

                  {/* Pass Details */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-400">Resident Name:</span>
                      <span className="text-cyan-300 font-extrabold text-sm">{passHolderName}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-400">Resident Role:</span>
                      <span className="text-emerald-300 font-bold">{passRoleLabel}</span>
                    </div>
                    {isCoResident && (
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                        <span className="text-slate-400">Primary Resident:</span>
                        <span className="text-white font-medium">{passHostName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-400">House / Villa:</span>
                      <span className="text-white font-bold">{generatedPassModal.houseNumber || 'Unit'}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-400">Pass ID:</span>
                      <span className="text-cyan-300 font-extrabold select-all">{generatedPassModal.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Validity:</span>
                      <span className="text-amber-300 font-bold">{generatedPassModal.validUntil || 'Active'}</span>
                    </div>
                  </div>

                  {/* Action Controls: Share, Save, Close/Cancel, and Remove */}
                  <div className="space-y-2 pt-1 font-mono text-xs">
                    {/* Share Group */}
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-950 cursor-pointer transition-colors"
                        title={`Share QR Pass for ${passHolderName} via WhatsApp`}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          copyToClipboard(whatsappMessage, `qr-text-${generatedPassModal.id}`);
                          setMgmtToastNotice(`Copied pass details for ${passHolderName} to clipboard!`);
                          setTimeout(() => setMgmtToastNotice(null), 3500);
                        }}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center space-x-1.5 border border-slate-700 cursor-pointer transition-colors"
                        title="Copy full pass details with resident name to clipboard"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Details</span>
                      </button>
                    </div>

                    {/* Save Group */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => downloadQrCodeImage(generatedPassModal)}
                        className="py-2.5 px-3 rounded-xl bg-cyan-900/60 hover:bg-cyan-800/80 text-cyan-200 hover:text-white font-bold flex items-center justify-center space-x-1.5 border border-cyan-700/70 cursor-pointer transition-colors"
                        title="Save QR Code image to device"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save QR Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center space-x-1.5 border border-slate-700 cursor-pointer transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Pass Slip</span>
                      </button>
                    </div>

                    {/* Close / Cancel Option & Remove Option */}
                    <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGeneratedPassModal(null)}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center space-x-1.5 border border-slate-700 cursor-pointer transition-colors"
                        title="Close QR Code without saving or sharing"
                      >
                        <X className="w-3.5 h-3.5 text-slate-400" />
                        <span>Close / Cancel</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Remove QR pass ${generatedPassModal.id} for ${generatedPassModal.holderName || 'this resident'}?`)) {
                            try {
                              await api.deleteQrPass(generatedPassModal.id);
                              setGeneratedPassModal(null);
                              soundEngine.playSuccessChime();
                              setMgmtToastNotice(`Pass ${generatedPassModal.id} removed.`);
                              setTimeout(() => setMgmtToastNotice(null), 3500);
                              onRefresh();
                            } catch {
                              alert('Failed to remove QR pass');
                            }
                          }
                        }}
                        className="py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 font-bold flex items-center justify-center space-x-1.5 border border-red-800/60 cursor-pointer transition-colors"
                        title="Delete / Remove QR Pass"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Remove Pass</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MULTI-CHANNEL RESIDENT CONTACT MODAL (PRIMARY, ALTERNATE, EMERGENCY) */}
        {residentContactModal && residentContactModal.isOpen && (
          <ResidentContactModal
            isOpen={residentContactModal.isOpen}
            onClose={() => setResidentContactModal(null)}
            resident={residentContactModal.resident}
            societyName={society.name}
            callerRole="MANAGEMENT"
            callerTitle="Society Management Command"
            contextType={residentContactModal.contextType}
            visitorName={residentContactModal.visitorName}
            vehiclePlate={residentContactModal.vehiclePlate}
            initialSelectedLine={residentContactModal.initialSelectedLine}
            onEditResident={(targetHouse) => {
              setResidentContactModal(null);
              openEditResidentModal(targetHouse);
            }}
            onSendNotice={(message) => {
              setMgmtToastNotice(message);
              setTimeout(() => setMgmtToastNotice(null), 5000);
            }}
          />
        )}
      </main>
    </div>
  );
};
