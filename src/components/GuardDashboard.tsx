import React, { useState, useEffect } from 'react';
import {
  Shield,
  Car,
  CarFront,
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
  Building2,
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneForwarded,
  User,
  Copy,
  Check,
  MessageSquare,
  MessageCircle,
  ExternalLink,
  Sparkles
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
  AuditMode,
  RMPNotification
} from '../types';
import { api } from '../services/api';
import { soundEngine } from '../services/audio';
import { GuardAccountabilityAudit } from './GuardAccountabilityAudit';
import { ResidentContactModal, ContactContextType, ContactLineType } from './ResidentContactModal';

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
  onSwitchToManagement?: () => void;
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
  onSwitchToManagement,
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
    | 'ACCOUNTABILITY'
    | 'RMP_CLEARANCES'
    | 'SCAN_QR_PASS'
    | 'VERIFY_IDENTITY'
    | 'GUARD_AI_ASSISTANT';

  const [activeTab, setActiveTab] = useState<ActiveTab>('ACTIONS');
  const [mobileMode, setMobileMode] = useState(false);

  // Scan QR Pass states (Feature 1 & Feature 2)
  const [qrScanInput, setQrScanInput] = useState('');
  const [qrScanLoading, setQrScanLoading] = useState(false);
  const [scannedPassResult, setScannedPassResult] = useState<any | null>(null);
  const [qrScanError, setQrScanError] = useState<string | null>(null);
  const [qrScanSuccessNotice, setQrScanSuccessNotice] = useState<string | null>(null);

  // 4 Verification Methods states (Feature 7 & Feature 8)
  const [verifyMethod, setVerifyMethod] = useState<'QR_PASS' | 'CNIC' | 'RESIDENT_CODE' | 'VEHICLE_PLATE' | 'PHONE' | 'HOUSE'>('CNIC');
  const [verifyQuery, setVerifyQuery] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Secure AI Guard Assistant states (Feature 10)
  const [guardAiQuery, setGuardAiQuery] = useState('');
  const [guardAiLoading, setGuardAiLoading] = useState(false);
  const [guardAiHistory, setGuardAiHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Assalam-o-Alaikum Officer! I am Secure 24/7 Gate AI Assistant. Ask me about visitor clearance, vehicle registration, resident contacts, under-18 policies, or gate security rules.'
    }
  ]);

  // Barrier states
  const [barrierState, setBarrierState] = useState(currentGate.barrierState);
  const [barrierLoading, setBarrierLoading] = useState(false);

  // RMP Pre-Clearance states
  const [rmpMatchedNotification, setRmpMatchedNotification] = useState<RMPNotification | null>(null);
  const [rmpNotificationsList, setRmpNotificationsList] = useState<RMPNotification[]>([]);
  const [rmpFilterType, setRmpFilterType] = useState<'ALL' | 'GUEST' | 'DELIVERY' | 'SERVICE_STAFF'>('ALL');
  const [rmpClearanceLoading, setRmpClearanceLoading] = useState(false);

  // Vehicle Entry states
  const [plateInput, setPlateInput] = useState('');
  const [scannedVehicle, setScannedVehicle] = useState<Vehicle | null>(null);
  const [isUnknownPlate, setIsUnknownPlate] = useState(false);
  const [isWatchlistPlate, setIsWatchlistPlate] = useState(false);
  const [watchlistWarning, setWatchlistWarning] = useState('');
  const [unknownSelectedHouse, setUnknownSelectedHouse] = useState('Villa 104');
  const [unknownDriverName, setUnknownDriverName] = useState('');
  const [unknownDriverPhone, setUnknownDriverPhone] = useState('');
  const [unknownGuestPurpose, setUnknownGuestPurpose] = useState('Personal Guest / Family Visit');
  const [approvalRequested, setApprovalRequested] = useState(false);
  const [entrySuccessNote, setEntrySuccessNote] = useState('');

  // Resident Search & Direct Call state for Unknown / Guest Vehicles
  const [residentSearchQuery, setResidentSearchQuery] = useState('');
  const [phoneCallState, setPhoneCallState] = useState<{
    isOpen: boolean;
    residentName: string;
    houseNumber: string;
    contactNumber: string;
    primaryContactNumber: string;
    alternateContactNumber?: string;
    emergencyContactNumber?: string;
    activeNumberUsed: 'PRIMARY' | 'ALTERNATE' | 'EMERGENCY';
    block: string;
    status: 'DIALING' | 'CONNECTED' | 'ENDED';
    durationSec: number;
    callOutcome?: 'APPROVED' | 'DENIED' | 'NO_ANSWER' | null;
  } | null>(null);
  const [phoneCallVerified, setPhoneCallVerified] = useState(false);
  const [copiedResidentPhone, setCopiedResidentPhone] = useState(false);
  const [copiedAlternatePhone, setCopiedAlternatePhone] = useState(false);
  const [copiedEmergencyPhone, setCopiedEmergencyPhone] = useState(false);

  // Multi-Channel Contact Hub State (Calls/WhatsApp/SMS/Messenger across Primary, Alternate, Emergency lines)
  const [contactHubState, setContactHubState] = useState<{
    isOpen: boolean;
    resident: House;
    contextType: ContactContextType;
    visitorName?: string;
    vehiclePlate?: string;
    initialSelectedLine?: ContactLineType;
  } | null>(null);

  const [messengerModalOpen, setMessengerModalOpen] = useState(false);
  const [messengerModalData, setMessengerModalData] = useState<{
    resident: House;
    messageText: string;
    sentStatus?: string;
    selectedLine?: ContactLineType;
  } | null>(null);
  const [guardContactToast, setGuardContactToast] = useState<string | null>(null);

  const formatPhoneForWhatsApp = (rawPhone: string) => {
    let cleaned = rawPhone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('0')) {
      cleaned = '92' + cleaned.substring(1);
    }
    return cleaned || '923001234567';
  };

  const handleCallViaWhatsApp = (resident: House, phoneToUse?: string) => {
    soundEngine.playSuccessChime();
    const phone = phoneToUse || resident.contactNumber || resident.alternateContactNumber || resident.emergencyContact || '+923001234567';
    const cleanNumber = formatPhoneForWhatsApp(phone);
    setGuardContactToast(`Opening WhatsApp Call line for ${resident.ownerName} (${phone})...`);
    setTimeout(() => setGuardContactToast(null), 4000);
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const handleMsgViaWhatsApp = (resident: House, phoneToUse?: string) => {
    soundEngine.playSuccessChime();
    const phone = phoneToUse || resident.contactNumber || resident.alternateContactNumber || resident.emergencyContact || '+923001234567';
    const cleanNumber = formatPhoneForWhatsApp(phone);
    const visitor = unknownDriverName.trim() || 'A visitor';
    const plate = plateInput.trim().toUpperCase() || 'Guest Vehicle';
    const gateName = currentGate?.name || 'Main Gate';
    const text = `Assalam-o-Alaikum / Hello ${resident.ownerName},\nThis is Security Guard at ${gateName}.\n${visitor} is at the gate with vehicle plate [${plate}] stating they are visiting your residence ${resident.houseNumber}.\nCan I let them enter? Please reply YES to permit or NO to deny.\nThank you.`;
    setGuardContactToast(`Dispatched WhatsApp guest entry inquiry to ${phone}...`);
    setTimeout(() => setGuardContactToast(null), 4000);
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOpenMessenger = (resident: House) => {
    soundEngine.playSuccessChime();
    const visitor = unknownDriverName.trim() || 'A visitor';
    const plate = plateInput.trim().toUpperCase() || 'Guest Vehicle';
    const gateName = currentGate?.name || 'Main Gate';
    const text = `Assalam-o-Alaikum / Hello ${resident.ownerName},\nThis is Security Guard at ${gateName}.\n${visitor} is at the gate with vehicle plate [${plate}] stating they are visiting your residence ${resident.houseNumber}.\nCan I let them enter? Please reply YES to permit or NO to deny.`;
    setMessengerModalData({
      resident,
      messageText: text
    });
    setMessengerModalOpen(true);
  };

  // Unified Multi-Line Resident Contact Modal (Primary, Alternate, Emergency lines)
  const [unifiedContactModal, setUnifiedContactModal] = useState<{
    isOpen: boolean;
    resident: House;
    contextType: ContactContextType;
    visitorName?: string;
    vehiclePlate?: string;
    initialSelectedLine?: ContactLineType;
  } | null>(null);

  const openUnifiedContactModal = (
    resident: House,
    contextType: ContactContextType = 'GUEST_CHECK',
    visitorName: string = '',
    vehiclePlate: string = '',
    initialLine: ContactLineType = 'PRIMARY'
  ) => {
    soundEngine.playSuccessChime();
    setUnifiedContactModal({
      isOpen: true,
      resident,
      contextType,
      visitorName: visitorName || unknownDriverName.trim() || 'Guest',
      vehiclePlate: vehiclePlate || plateInput.trim().toUpperCase() || 'Visitor Vehicle',
      initialSelectedLine: initialLine
    });
  };

  // Active Intercom Call duration counter & connection simulation
  useEffect(() => {
    let timerInterval: any;
    if (phoneCallState && phoneCallState.isOpen) {
      if (phoneCallState.status === 'DIALING') {
        const dialingTimeout = setTimeout(() => {
          soundEngine.playSuccessChime();
          setPhoneCallState(prev => prev ? { ...prev, status: 'CONNECTED' } : null);
        }, 1400);
        return () => clearTimeout(dialingTimeout);
      } else if (phoneCallState.status === 'CONNECTED') {
        timerInterval = setInterval(() => {
          setPhoneCallState(prev => prev ? { ...prev, durationSec: prev.durationSec + 1 } : null);
        }, 1000);
      }
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [phoneCallState?.isOpen, phoneCallState?.status]);

  // Load RMP Pre-Clearance Notifications
  const loadRMPNotifications = async () => {
    try {
      const list = await api.getRMPNotifications({ societyId: society.id });
      setRmpNotificationsList(list);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadRMPNotifications();
  }, [society.id]);

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

  // Admit RMP Pre-Authorized Visitor with 1-click Express Fast-Track
  const handleAdmitRMPVisitor = async (notif: RMPNotification) => {
    setRmpClearanceLoading(true);
    try {
      await api.updateRMPStatus(notif.id, {
        status: 'INSIDE_SOCIETY',
        guardName: currentGuard.name,
        gateName: currentGate.name,
        notes: `RMP Express Clearance at ${currentGate.name}. Host: ${notif.residentName} (${notif.residentHouseNumber})`
      });

      handleBarrierCommand('OPEN');
      soundEngine.playSuccessChime();
      setEntrySuccessNote(`RMP EXPRESS CLEARANCE: ${notif.fullName} (${notif.vehiclePlate || 'WALK-IN'}) cleared for ${notif.residentName} (${notif.residentHouseNumber}). Gate Boom Barrier Opened!`);
      
      setRmpNotificationsList(prev => prev.map(n => n.id === notif.id ? { ...n, status: 'INSIDE_SOCIETY' as const, admittedAt: new Date().toLocaleTimeString() } : n));
      
      setTimeout(() => {
        setPlateInput('');
        setRmpMatchedNotification(null);
        setEntrySuccessNote('');
        onRefresh();
      }, 4000);
    } catch {
      alert('Error admitting RMP visitor.');
    } finally {
      setRmpClearanceLoading(false);
    }
  };

  // Check Plate lookup / ANPR Scan (Catches RMP Data automatically!)
  const handleLookupPlate = async (plateToSearch: string) => {
    const cleanPlate = plateToSearch.trim().toUpperCase();
    if (!cleanPlate) return;

    setApprovalRequested(false);
    setEntrySuccessNote('');
    setIsWatchlistPlate(false);
    setWatchlistWarning('');
    setPhoneCallVerified(false);
    setResidentSearchQuery('');
    setRmpMatchedNotification(null);

    // Check watchlist
    if (cleanPlate === 'SUS-999') {
      setIsWatchlistPlate(true);
      setWatchlistWarning('WATCHLIST MATCH: Suspected perimeter loitering. Do NOT allow access.');
      soundEngine.playEmergencyAlarm();
      return;
    }

    // 1. Check registered resident vehicles
    const found = vehicles.find(v => v.plateNumber.toUpperCase() === cleanPlate);
    if (found) {
      setScannedVehicle(found);
      setIsUnknownPlate(false);
      setRmpMatchedNotification(null);
      soundEngine.playSuccessChime();
      return;
    }

    // 2. Automatically query RMP (Resident Messages Portal)
    try {
      const rmpResult = await api.searchVehicleRMP(society.id, cleanPlate);
      if (rmpResult.found && rmpResult.notification) {
        setRmpMatchedNotification(rmpResult.notification);
        setScannedVehicle(null);
        setIsUnknownPlate(false);
        soundEngine.playSuccessChime();
        return;
      }
    } catch (e) {
      console.warn('RMP lookup error:', e);
    }

    // 3. Fallback: Unknown vehicle
    setScannedVehicle(null);
    setRmpMatchedNotification(null);
    setIsUnknownPlate(true);
    if (houses.length > 0 && !houses.find(h => h.houseNumber === unknownSelectedHouse)) {
      setUnknownSelectedHouse(houses[0].houseNumber);
    }
    soundEngine.playWarningSound();
  };

  // Start Intercom Phone Call to Resident on specific line (Primary, Alternate, or Emergency)
  const handleStartResidentCall = (
    targetHouse: House,
    lineChoiceOrAlternate: ContactLineType | boolean = 'PRIMARY'
  ) => {
    soundEngine.playSuccessChime();
    const primary = targetHouse.contactNumber || '+92-300-5551100';
    const alternate = targetHouse.alternateContactNumber || '';
    const emergency = targetHouse.emergencyContact || '';

    let lineChoice: ContactLineType = 'PRIMARY';
    if (typeof lineChoiceOrAlternate === 'boolean') {
      lineChoice = lineChoiceOrAlternate ? 'ALTERNATE' : 'PRIMARY';
    } else {
      lineChoice = lineChoiceOrAlternate;
    }

    let numberToUse = primary;
    if (lineChoice === 'ALTERNATE' && alternate) {
      numberToUse = alternate;
    } else if (lineChoice === 'EMERGENCY' && emergency) {
      numberToUse = emergency;
    }

    setPhoneCallState({
      isOpen: true,
      residentName: targetHouse.ownerName,
      houseNumber: targetHouse.houseNumber,
      contactNumber: numberToUse,
      primaryContactNumber: primary,
      alternateContactNumber: alternate,
      emergencyContactNumber: emergency,
      activeNumberUsed: lineChoice,
      block: targetHouse.block || 'Main Sector',
      status: 'DIALING',
      durationSec: 0,
      callOutcome: null
    });
  };

  const handleSwitchCallToLine = (line: ContactLineType) => {
    if (!phoneCallState) return;
    const house = houses.find(h => h.houseNumber === phoneCallState.houseNumber);
    const targetNum =
      line === 'PRIMARY'
        ? (phoneCallState.primaryContactNumber || house?.contactNumber || '+92-300-5551100')
        : line === 'ALTERNATE'
        ? (phoneCallState.alternateContactNumber || house?.alternateContactNumber || '')
        : (phoneCallState.emergencyContactNumber || house?.emergencyContact || '');

    if (!targetNum) {
      setGuardContactToast(`No ${line.toLowerCase()} line registered for this residence.`);
      setTimeout(() => setGuardContactToast(null), 3500);
      return;
    }

    soundEngine.playSuccessChime();
    setPhoneCallState(prev => prev ? {
      ...prev,
      contactNumber: targetNum,
      activeNumberUsed: line,
      status: 'DIALING',
      durationSec: 0
    } : null);
    setGuardContactToast(`Dialing resident via ${line} line (${targetNum})...`);
    setTimeout(() => setGuardContactToast(null), 3500);
  };

  const handleSwitchCallToAlternate = () => handleSwitchCallToLine('ALTERNATE');
  const handleSwitchCallToPrimary = (primaryNum?: string) => handleSwitchCallToLine('PRIMARY');
  const handleSwitchCallToEmergency = () => handleSwitchCallToLine('EMERGENCY');

  // Handle Call Outcome (Resident Said YES or NO)
  const handleCallOutcome = (outcome: 'APPROVED' | 'DENIED' | 'NO_ANSWER') => {
    if (outcome === 'APPROVED') {
      soundEngine.playSuccessChime();
      setPhoneCallVerified(true);
      setPhoneCallState(prev => prev ? { ...prev, status: 'ENDED', callOutcome: 'APPROVED' } : null);
      setTimeout(() => {
        setPhoneCallState(null);
      }, 900);
    } else if (outcome === 'DENIED') {
      soundEngine.playEmergencyAlarm();
      setPhoneCallVerified(false);
      setPhoneCallState(prev => prev ? { ...prev, status: 'ENDED', callOutcome: 'DENIED' } : null);
      setTimeout(() => {
        setPhoneCallState(null);
      }, 1200);
    } else {
      setPhoneCallState(prev => prev ? { ...prev, status: 'ENDED', callOutcome: 'NO_ANSWER' } : null);
      setTimeout(() => {
        setPhoneCallState(null);
      }, 700);
    }
  };

  // Copy Resident Contact Number
  const handleCopyResidentPhone = (num: string) => {
    navigator.clipboard?.writeText(num);
    setCopiedResidentPhone(true);
    soundEngine.playSuccessChime();
    setTimeout(() => setCopiedResidentPhone(false), 2000);
  };

  // Copy Alternate Contact Number
  const handleCopyAlternatePhone = (num: string) => {
    navigator.clipboard?.writeText(num);
    setCopiedAlternatePhone(true);
    soundEngine.playSuccessChime();
    setTimeout(() => setCopiedAlternatePhone(false), 2000);
  };

  // Copy Emergency Contact Number
  const handleCopyEmergencyPhone = (num: string) => {
    navigator.clipboard?.writeText(num);
    setCopiedEmergencyPhone(true);
    soundEngine.playSuccessChime();
    setTimeout(() => setCopiedEmergencyPhone(false), 2000);
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
        purpose: unknownGuestPurpose || 'Guest Visit / Vehicle Entry',
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
    const targetHouse = houses.find(h => h.houseNumber === unknownSelectedHouse);
    try {
      await api.recordVehicleEntry({
        plateNumber: plateInput.toUpperCase(),
        gateId: currentGate.id,
        guardName: currentGuard.name,
        houseNumber: unknownSelectedHouse,
        classification: 'GUEST',
        notes: `Guest driver (${unknownDriverName || 'Visitor'}) visiting ${unknownSelectedHouse} (${targetHouse?.ownerName || 'Resident'}). Purpose: ${unknownGuestPurpose}. ${phoneCallVerified ? 'Verified via direct resident phone call' : 'Authorized by guard'}`
      });
      handleBarrierCommand('OPEN');
      setEntrySuccessNote(`Guest Vehicle ${plateInput.toUpperCase()} approved for ${unknownSelectedHouse}. Gate opened.`);
      setTimeout(() => {
        setPlateInput('');
        setIsUnknownPlate(false);
        setPhoneCallVerified(false);
        setUnknownDriverName('');
        setUnknownDriverPhone('');
        setEntrySuccessNote('');
        onRefresh();
      }, 3000);
    } catch {
      alert('Error recording guest vehicle entry');
    }
  };

  // --- FEATURE 1 & 2: SCAN QR PASS HANDLERS ---
  const handleScanQRPass = async (tokenOverride?: string) => {
    const token = (tokenOverride || qrScanInput).trim();
    if (!token) {
      setQrScanError('Please enter or scan a valid QR Pass ID or Token.');
      return;
    }
    setQrScanLoading(true);
    setQrScanError(null);
    setQrScanSuccessNotice(null);
    try {
      const res = await api.scanQRPass({
        token,
        gateId: currentGate.id,
        guardName: currentGuard.name
      });
      setScannedPassResult(res);
      if (res.valid) {
        soundEngine.playSuccessChime();
      } else {
        soundEngine.playEmergencyAlarm();
        setQrScanError(`Pass Validation Warning: ${res.status || 'Invalid or Expired Pass'}`);
      }
    } catch (err: any) {
      console.error(err);
      soundEngine.playEmergencyAlarm();
      setQrScanError('Failed to validate QR Pass against gate server. Please check pass token.');
    } finally {
      setQrScanLoading(false);
    }
  };

  const handleApproveScannedPass = async (pass: any) => {
    try {
      handleBarrierCommand('OPEN');
      soundEngine.playSuccessChime();
      setQrScanSuccessNotice(`Entry Approved for ${pass.holderName || pass.name || 'Visitor'} (${pass.passType || pass.type || 'PASS'}). Barrier opened!`);

      // Record QR pass scan entry
      if (pass.id) {
        try {
          await api.recordQRPassEntry({
            passId: pass.id,
            gateName: currentGate.name,
            guardName: currentGuard.name,
            notes: `Approved QR entry at ${currentGate.name}`
          });
        } catch (e) {
          console.error('Failed to update QR scan count:', e);
        }
      }

      // Record official gate clearance entry (Feature 11 & 16)
      try {
        await api.recordVerificationEntry({
          type: (pass.passType === 'RESIDENT' || pass.passType === 'LIVING_RESIDENT') ? 'RESIDENT' : 'GUEST',
          resident: pass.hostResidentName || pass.holderName || pass.residentName || pass.name,
          house: pass.houseNumber,
          gate: currentGate.name,
          guard: currentGuard.name,
          visitorName: pass.holderName || pass.name,
          vehiclePlate: pass.vehiclePlate,
          qrPassId: pass.id || pass.passId,
          purpose: pass.purpose || `${pass.passType || 'VISITOR'} Gate Access`,
          method: 'QR_PASS',
          verifiedIdentifier: pass.id || pass.passId,
          notes: `Gate entry granted via approved ${pass.passType || 'QR'} pass.`
        });
      } catch (e) {
        console.error('Failed to log verification entry:', e);
      }

      // If single-use pass, invalidate on backend
      if (pass.isSingleUse && pass.id) {
        try {
          await api.invalidateQRPass(pass.id);
        } catch {
          // Non-blocking
        }
      }
      setTimeout(() => {
        setQrScanSuccessNotice(null);
        onRefresh();
      }, 4000);
    } catch (err) {
      alert('Failed to record pass approval.');
    }
  };

  const handleDenyScannedPass = async (pass: any) => {
    soundEngine.playEmergencyAlarm();
    const passId = pass.passId || pass.id || 'N/A';
    const holder = pass.holderName || pass.name || 'Visitor';
    setQrScanError(`Entry Denied for Pass #${passId} (${holder}). Security restriction recorded.`);
    try {
      await api.recordVerificationEntry({
        type: (pass.passType === 'RESIDENT' || pass.passType === 'LIVING_RESIDENT') ? 'RESIDENT' : 'GUEST',
        resident: pass.hostResidentName || pass.hostResident || holder,
        house: pass.houseNumber,
        gate: currentGate.name,
        guard: currentGuard.name,
        visitorName: holder,
        vehiclePlate: pass.vehiclePlate || pass.vehicleNumber,
        qrPassId: passId,
        purpose: pass.purpose || 'Entry Denied by Guard',
        method: 'QR_PASS',
        verifiedIdentifier: passId,
        status: 'DENIED',
        approvalDenial: 'DENIED',
        notes: `Entry DENIED for QR pass ${passId} (${holder}) at ${currentGate.name} by ${currentGuard.name}.`
      });
      onRefresh();
    } catch (e) {
      console.error('Failed to log denial entry:', e);
    }
  };

  // --- FEATURE 7 & 8: 4 VERIFICATION METHODS HANDLER ---
  const handleRunIdentityVerification = async () => {
    const q = verifyQuery.trim();
    if (!q) {
      setVerifyError('Please enter a query to verify.');
      return;
    }
    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyResult(null);
    try {
      const payload: any = {
        method: verifyMethod,
        value: q,
        societyId: society.id,
        gateName: currentGate.name,
        guardName: currentGuard.name
      };

      const res = await api.verifyIdentity(payload);
      setVerifyResult(res);
      if (res.success) {
        soundEngine.playSuccessChime();
      } else {
        soundEngine.playEmergencyAlarm();
        setVerifyError(res.message || 'No resident record matched this search parameter.');
      }
    } catch (err) {
      console.error(err);
      soundEngine.playEmergencyAlarm();
      setVerifyError('Verification query failed. Check connection.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // --- FEATURE 10: SECURE AI GUARD ASSISTANT HANDLER ---
  const handleAskGuardAI = async (promptToSend?: string) => {
    const query = promptToSend || guardAiQuery;
    if (!query.trim()) return;

    const userMessage = { role: 'user' as const, text: query };
    setGuardAiHistory(prev => [...prev, userMessage]);
    setGuardAiQuery('');
    setGuardAiLoading(true);

    try {
      const res = await api.askAI(query, society.id, {
        clientSociety: society,
        clientHouses: houses,
        clientVehicles: vehicles
      });
      setGuardAiHistory(prev => [...prev, { role: 'assistant', text: res.answer }]);
      soundEngine.playSuccessChime();
    } catch {
      setGuardAiHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Secure AI node is offline. Standard Guard Protocol: Check physical resident roster or call villa intercom directly.'
        }
      ]);
    } finally {
      setGuardAiLoading(false);
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
    const raw = qrScanInput.trim().toUpperCase();
    const matchedRmp = rmpNotificationsList.find(n => 
      raw.includes(n.id.slice(-6).toUpperCase()) ||
      (n.vehiclePlate && raw.includes(n.vehiclePlate.toUpperCase())) ||
      (n.fullName && raw.includes(n.fullName.toUpperCase()))
    );

    if (matchedRmp) {
      setQrScanResult({
        valid: true,
        message: `PASS VALID: Digital RMP Pass Verified for ${matchedRmp.fullName} -> House ${matchedRmp.residentHouseNumber} (Host: ${matchedRmp.residentName}). Express Entry Granted.`
      });
      soundEngine.playSuccessChime();
      handleBarrierCommand('OPEN');
    } else if (qrScanInput.includes('GP849102') || qrScanInput.includes('BILAL') || raw.includes('RMP')) {
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

          {/* Switch to Management Portal button if provided */}
          {onSwitchToManagement && !onReturnToRole && (
            <button
              type="button"
              onClick={onSwitchToManagement}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow transition-all cursor-pointer"
              title="Switch to Society Management Portal"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Management</span>
            </button>
          )}

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
          <button
            onClick={() => setActiveTab('RMP_CLEARANCES')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'RMP_CLEARANCES'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                : 'bg-slate-900 text-purple-300 hover:text-white border border-purple-900/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>RMP Pre-Clearances ({rmpNotificationsList.filter(n => n.status === 'UPCOMING').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SCAN_QR_PASS')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'SCAN_QR_PASS'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950 ring-1 ring-purple-400'
                : 'bg-slate-900 text-purple-300 hover:text-white border border-purple-800/80 hover:bg-purple-950/40'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-purple-400" />
            <span>Scan QR Pass</span>
          </button>
          <button
            onClick={() => setActiveTab('VERIFY_IDENTITY')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'VERIFY_IDENTITY'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'bg-slate-900 text-cyan-300 hover:text-white border border-cyan-800/80 hover:bg-cyan-950/40'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Verify Resident (4 Methods)</span>
          </button>
          <button
            onClick={() => setActiveTab('GUARD_AI_ASSISTANT')}
            className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              activeTab === 'GUARD_AI_ASSISTANT'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950 ring-1 ring-cyan-400'
                : 'bg-slate-900 text-cyan-300 hover:text-white border border-cyan-800/80 hover:bg-cyan-950/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Secure AI Guard</span>
          </button>
        </div>

        {/* TAB 1: MAIN FAST ACTIONS GRID */}
        {activeTab === 'ACTIONS' && (
          <div className="space-y-6">
            {/* Quick action cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* 1. SCAN QR PASS (FEATURE 1) */}
              <button
                type="button"
                onClick={() => setActiveTab('SCAN_QR_PASS')}
                className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-900 hover:bg-purple-900/60 border border-purple-600/80 hover:border-purple-400 text-left transition-all group flex flex-col justify-between shadow-lg ring-1 ring-purple-500/20"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-900/80 border border-purple-500/60 flex items-center justify-center text-purple-300 mb-3 group-hover:scale-105 transition-transform shadow-inner">
                  <QrCode className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h4 className="font-bold text-base text-white group-hover:text-purple-300">📱 Scan QR Pass</h4>
                  </div>
                  <p className="text-xs text-purple-300/80 mt-1">Guests, Delivery, Staff &amp; Residents</p>
                </div>
              </button>

              {/* 2. VERIFY RESIDENT (4 METHODS - FEATURE 7) */}
              <button
                type="button"
                onClick={() => setActiveTab('VERIFY_IDENTITY')}
                className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-900 hover:bg-cyan-900/60 border border-cyan-600/80 hover:border-cyan-400 text-left transition-all group flex flex-col justify-between shadow-lg ring-1 ring-cyan-500/20"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-900/80 border border-cyan-500/60 flex items-center justify-center text-cyan-300 mb-3 group-hover:scale-105 transition-transform shadow-inner">
                  <UserCheck className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white group-hover:text-cyan-300">🛡️ Verify Resident</h4>
                  <p className="text-xs text-cyan-300/80 mt-1">CNIC, Phone, House &amp; Minor Protection</p>
                </div>
              </button>

              {/* 3. SECURE AI GUARD ASSISTANT (FEATURE 10) */}
              <button
                type="button"
                onClick={() => setActiveTab('GUARD_AI_ASSISTANT')}
                className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/80 via-slate-900 to-slate-900 hover:bg-blue-900/60 border border-blue-600/80 hover:border-blue-400 text-left transition-all group flex flex-col justify-between shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-900/80 border border-blue-500/60 flex items-center justify-center text-blue-300 mb-3 group-hover:scale-105 transition-transform shadow-inner">
                  <Sparkles className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white group-hover:text-blue-300">✨ Secure AI Assistant</h4>
                  <p className="text-xs text-blue-300/80 mt-1">Ask questions, rules &amp; lookup assistance</p>
                </div>
              </button>

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
                <button
                  type="button"
                  onClick={() => {
                    setPlateInput('LEA-2024');
                    handleLookupPlate('LEA-2024');
                    setActiveTab('VEHICLE_ENTRY');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-xs font-mono font-bold text-purple-300 flex items-center space-x-1"
                >
                  <MessageSquare className="w-3 h-3 text-purple-400" />
                  <span>LEA-2024 (RMP Pre-Cleared: Tariq Aslam)</span>
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

                {/* Resident Contact Info for Guard Verification */}
                {(() => {
                  const regHouse = houses.find(h => h.houseNumber === scannedVehicle.houseNumber);
                  const primaryPhone = regHouse?.contactNumber || scannedVehicle.phone || '+92-300-1234567';
                  const alternatePhone = regHouse?.alternateContactNumber || scannedVehicle.alternateContactNumber;

                  return (
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Resident Contact Details Shared With Guard</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          VERIFIED RESIDENT
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Primary Phone */}
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono block">PRIMARY PHONE</span>
                            <span className="font-mono font-bold text-white text-xs">{primaryPhone}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <a
                              href={`tel:${primaryPhone}`}
                              className="px-2 py-1 rounded bg-blue-950 hover:bg-blue-900 text-blue-300 text-[10px] font-mono border border-blue-800"
                              title="Call Primary Phone"
                            >
                              Call
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                if (regHouse) handleCallViaWhatsApp(regHouse, primaryPhone);
                              }}
                              className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[10px] font-mono border border-emerald-800"
                              title="WhatsApp Primary Phone"
                            >
                              WhatsApp
                            </button>
                          </div>
                        </div>

                        {/* Alternate Phone */}
                        <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                          alternatePhone
                            ? 'bg-cyan-950/40 border-cyan-700/60 text-cyan-200'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                        }`}>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] font-mono block text-cyan-400 font-bold">
                                ALTERNATE NUMBER
                              </span>
                              {alternatePhone && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/80 text-cyan-300 border border-cyan-700 font-mono">
                                  SHARED BY MANAGEMENT
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-xs">
                              {alternatePhone || 'Not provided by management'}
                            </span>
                          </div>
                          {alternatePhone && (
                            <div className="flex items-center space-x-1.5">
                              <a
                                href={`tel:${alternatePhone}`}
                                className="px-2 py-1 rounded bg-blue-950 hover:bg-blue-900 text-blue-300 text-[10px] font-mono border border-blue-800"
                                title="Call Alternate Phone"
                              >
                                Call
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  if (regHouse) handleCallViaWhatsApp(regHouse, alternatePhone);
                                }}
                                className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[10px] font-mono border border-emerald-800"
                                title="WhatsApp Alternate Phone"
                              >
                                WhatsApp
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

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

            {/* CASE 1B: RMP PRE-AUTHORIZED CLEARANCE DETECTED (Automatic Data Catch) */}
            {rmpMatchedNotification && (
              <div className="p-6 rounded-2xl bg-slate-950 border-2 border-purple-500 space-y-5 shadow-2xl shadow-purple-950/50 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-900/60 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500 flex items-center justify-center text-purple-300">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-400 font-extrabold text-sm font-mono tracking-wider">
                          RMP PRE-AUTHORIZED CLEARANCE DETECTED
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-600 font-mono font-bold text-xs">
                          {rmpMatchedNotification.type}
                        </span>
                      </div>
                      <span className="text-xs text-slate-300">
                        Pre-authorized in Resident Messages Portal by <strong className="text-white">{rmpMatchedNotification.residentName}</strong> ({rmpMatchedNotification.residentHouseNumber})
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 font-mono text-xs font-bold border border-emerald-800 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>FAST-TRACK PRE-APPROVED</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-purple-900/60">
                    <span className="text-slate-400 block text-[10px] font-mono">VISITOR FULL NAME</span>
                    <span className="font-bold text-white text-sm">{rmpMatchedNotification.fullName}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-purple-900/60">
                    <span className="text-slate-400 block text-[10px] font-mono">VEHICLE PLATE</span>
                    <span className="font-mono text-base font-extrabold text-purple-300">
                      {rmpMatchedNotification.vehiclePlate || 'WALK-IN'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-purple-900/60">
                    <span className="text-slate-400 block text-[10px] font-mono">PHONE NUMBER</span>
                    <span className="font-mono font-bold text-slate-200">{rmpMatchedNotification.phone || 'N/A'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-purple-900/60">
                    <span className="text-slate-400 block text-[10px] font-mono">CNIC / ID NUMBER</span>
                    <span className="font-mono font-bold text-slate-200">{rmpMatchedNotification.nic || 'Verified in RMP'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/60 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-300 font-mono">
                      Host Resident: <strong className="text-white">{rmpMatchedNotification.residentName}</strong> ({rmpMatchedNotification.residentHouseNumber})
                    </span>
                    <span className="text-purple-300 font-mono">
                      Scheduled Arrival: <strong>{rmpMatchedNotification.expectedDate}</strong> at <strong>{rmpMatchedNotification.expectedTime}</strong>
                    </span>
                  </div>
                  <div className="text-slate-300">
                    <strong className="text-purple-300">Purpose / Details:</strong> {rmpMatchedNotification.purpose}
                  </div>
                  {rmpMatchedNotification.additionalNotes && (
                    <div className="text-slate-400 italic text-[11px] bg-slate-900/80 p-2 rounded border border-purple-900/40">
                      Resident Instructions: "{rmpMatchedNotification.additionalNotes}"
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-emerald-400 font-mono flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified via RMP. Pre-clearance prevents gate queue and eliminates resident call delay.</span>
                  </div>
                  <button
                    type="button"
                    disabled={rmpClearanceLoading}
                    onClick={() => handleAdmitRMPVisitor(rmpMatchedNotification)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-purple-950 border border-purple-400/40 flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <DoorClosed className="w-4 h-4" />
                    <span>{rmpClearanceLoading ? 'OPENING BARRIER...' : '1-CLICK EXPRESS CLEARANCE & OPEN BARRIER'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* CASE 2: UNKNOWN / GUEST VEHICLE: RESIDENT SEARCH & DIRECT CALL VERIFICATION */}
            {isUnknownPlate && (() => {
              const selectedResidentHouse = houses.find(h => h.houseNumber === unknownSelectedHouse) || houses[0];
              const matchingResidentHouses = houses.filter(h => {
                if (!residentSearchQuery.trim()) return true;
                const q = residentSearchQuery.toLowerCase();
                return (
                  h.ownerName.toLowerCase().includes(q) ||
                  h.houseNumber.toLowerCase().includes(q) ||
                  (h.block && h.block.toLowerCase().includes(q)) ||
                  (h.contactNumber && h.contactNumber.includes(q)) ||
                  (h.alternateContactNumber && h.alternateContactNumber.includes(q))
                );
              });

              return (
                <div className="p-6 rounded-2xl bg-slate-950 border-2 border-amber-500/90 space-y-6 shadow-2xl shadow-amber-950/40 animate-fadeIn">
                  {/* Header alert */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600 flex items-center justify-center text-amber-400 flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-amber-400 font-extrabold text-sm font-mono tracking-wider">
                            UNKNOWN / UNREGISTERED VEHICLE
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-amber-500/50 text-amber-300 font-mono font-bold text-xs">
                            {plateInput.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          Plate is not registered to any resident. Identify the resident host and contact them for clearance.
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 font-mono text-xs font-bold border border-amber-700">
                      GUEST VERIFICATION REQUIRED
                    </span>
                  </div>

                  {/* STEP 1: RESIDENT SEARCH TOOL */}
                  <div className="space-y-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase font-mono text-cyan-400 flex items-center space-x-2">
                        <Search className="w-3.5 h-3.5" />
                        <span>Step 1: Search Which Resident This Car Is A Guest Of</span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {matchingResidentHouses.length} Society Residents
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={residentSearchQuery}
                        onChange={e => setResidentSearchQuery(e.target.value)}
                        placeholder="Search resident name, Villa no., phone, or alternate number..."
                        className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                      {residentSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setResidentSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Quick Selection Chips */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono block">
                        Quick Select Society Resident / Villa:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {matchingResidentHouses.map(h => (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => {
                              setUnknownSelectedHouse(h.houseNumber);
                              setPhoneCallVerified(false);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 border ${
                              unknownSelectedHouse === h.houseNumber
                                ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 shadow-md shadow-amber-500/30 scale-105'
                                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                            }`}
                          >
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span>{h.houseNumber}</span>
                            <span className="opacity-75 font-normal">({h.ownerName})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* STEP 2: SELECTED RESIDENT HOST DETAILS & DIRECT CALLING HUB */}
                  {selectedResidentHouse && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-cyan-700/60 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-600 flex items-center justify-center text-cyan-400">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-base font-extrabold text-white font-mono">
                                {selectedResidentHouse.houseNumber}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                • {selectedResidentHouse.block} ({selectedResidentHouse.street})
                              </span>
                            </div>
                            <span className="text-xs font-bold text-amber-300 block">
                              Host Resident: {selectedResidentHouse.ownerName}
                            </span>
                          </div>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 font-mono text-[11px] font-bold border border-cyan-800">
                          SELECTED RESIDENT HOST
                        </span>
                      </div>

                      {/* Contact numbers and Call / Message Communication Hub */}
                      <div className="space-y-3">
                        {/* 3-Line Contact Display: Primary, Alternate, and Emergency Lines */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {/* Line 1: Primary Intercom Line */}
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                                Primary Intercom
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-mono border border-emerald-800 font-bold">
                                PRIMARY
                              </span>
                            </div>
                            <span className="font-mono text-sm font-extrabold text-emerald-400 tracking-wider block">
                              {selectedResidentHouse.contactNumber}
                            </span>
                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-900">
                              <button
                                type="button"
                                onClick={() => handleCopyResidentPhone(selectedResidentHouse.contactNumber)}
                                className="flex-1 py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-800 flex items-center justify-center space-x-1"
                                title="Copy Primary Number"
                              >
                                {copiedResidentPhone ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => openUnifiedContactModal(selectedResidentHouse, 'GUEST_CHECK', unknownDriverName, plateInput, 'PRIMARY')}
                                className="py-1 px-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[10px] font-mono border border-emerald-800 flex items-center space-x-1"
                                title="Contact Primary Line (Call, WhatsApp, Messenger)"
                              >
                                <span>Options</span>
                              </button>
                            </div>
                          </div>

                          {/* Line 2: Alternate Contact Line (Shared by Management) */}
                          <div className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 ${
                            selectedResidentHouse.alternateContactNumber
                              ? 'bg-cyan-950/40 border-cyan-600/80 text-cyan-200'
                              : 'bg-slate-950/60 border-slate-800 text-slate-500'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">
                                Alternate Line
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono border ${
                                selectedResidentHouse.alternateContactNumber
                                  ? 'bg-cyan-900 text-cyan-300 border-cyan-600 font-bold'
                                  : 'bg-slate-900 text-slate-500 border-slate-800'
                              }`}>
                                {selectedResidentHouse.alternateContactNumber ? 'MGMT SYNC' : 'NOT ENTERED'}
                              </span>
                            </div>
                            <span className="font-mono text-sm font-extrabold text-cyan-300 tracking-wider block">
                              {selectedResidentHouse.alternateContactNumber || 'None on record'}
                            </span>
                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-900/80">
                              {selectedResidentHouse.alternateContactNumber ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyAlternatePhone(selectedResidentHouse.alternateContactNumber!)}
                                    className="flex-1 py-1 px-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[10px] font-mono border border-cyan-700 flex items-center justify-center space-x-1"
                                    title="Copy Alternate Number"
                                  >
                                    {copiedAlternatePhone ? (
                                      <>
                                        <Check className="w-3 h-3 text-cyan-400" />
                                        <span className="text-cyan-400">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openUnifiedContactModal(selectedResidentHouse, 'GUEST_CHECK', unknownDriverName, plateInput, 'ALTERNATE')}
                                    className="py-1 px-2 rounded-lg bg-cyan-900 hover:bg-cyan-800 text-cyan-200 text-[10px] font-mono border border-cyan-700 flex items-center space-x-1"
                                    title="Contact Alternate Line (Call, WhatsApp, Messenger)"
                                  >
                                    <span>Options</span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic py-0.5">Not configured</span>
                              )}
                            </div>
                          </div>

                          {/* Line 3: Emergency Contact Line */}
                          <div className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 ${
                            selectedResidentHouse.emergencyContact
                              ? 'bg-amber-950/40 border-amber-600/70 text-amber-200'
                              : 'bg-slate-950/60 border-slate-800 text-slate-500'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-bold">
                                Emergency Line
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono border ${
                                selectedResidentHouse.emergencyContact
                                  ? 'bg-amber-900 text-amber-300 border-amber-600 font-bold'
                                  : 'bg-slate-900 text-slate-500 border-slate-800'
                              }`}>
                                {selectedResidentHouse.emergencyContact ? 'EMERGENCY' : 'NOT ENTERED'}
                              </span>
                            </div>
                            <span className="font-mono text-sm font-extrabold text-amber-300 tracking-wider block">
                              {selectedResidentHouse.emergencyContact || 'None on record'}
                            </span>
                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-900/80">
                              {selectedResidentHouse.emergencyContact ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyEmergencyPhone(selectedResidentHouse.emergencyContact!)}
                                    className="flex-1 py-1 px-2 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 text-[10px] font-mono border border-amber-700 flex items-center justify-center space-x-1"
                                    title="Copy Emergency Number"
                                  >
                                    {copiedEmergencyPhone ? (
                                      <>
                                        <Check className="w-3 h-3 text-amber-400" />
                                        <span className="text-amber-400">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openUnifiedContactModal(selectedResidentHouse, 'GUEST_CHECK', unknownDriverName, plateInput, 'EMERGENCY')}
                                    className="py-1 px-2 rounded-lg bg-amber-900 hover:bg-amber-800 text-amber-200 text-[10px] font-mono border border-amber-700 flex items-center space-x-1"
                                    title="Contact Emergency Line (Call, WhatsApp, Messenger)"
                                  >
                                    <span>Options</span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic py-0.5">Not configured</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* MASTER UNIFIED CONTACT HUB BUTTON & LINE SWITCH BAR */}
                        <div className="p-3 rounded-xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-2 border-cyan-500/80 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-cyan-950/30">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-400">
                              <PhoneForwarded className="w-4 h-4 animate-pulse" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white block">
                                Resident Multi-Channel Contact Hub
                              </span>
                              <span className="text-[10px] text-cyan-300">
                                Guards can contact via <strong>Primary</strong>, <strong>Alternate</strong>, or <strong>Emergency</strong> line using <strong>Call</strong>, <strong>WhatsApp</strong>, or <strong>Messenger</strong>
                              </span>
                            </div>
                          </div>
                          <button
                            id="btn-open-multi-channel-contact-modal"
                            type="button"
                            onClick={() => openUnifiedContactModal(selectedResidentHouse, 'GUEST_CHECK', unknownDriverName, plateInput)}
                            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono shadow-md shadow-cyan-950/60 flex items-center space-x-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Open Multi-Line Contact Hub &rarr;</span>
                          </button>
                        </div>

                        {/* HIGH-VISIBILITY CONTACT CHANNELS FOR THE GUARD */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          {/* 1. WHATSAPP CALL OPTION */}
                          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 flex flex-col justify-between space-y-2 shadow-md shadow-emerald-950/40">
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] font-mono font-extrabold tracking-wider text-emerald-400 uppercase">
                                WHATSAPP CALL
                              </span>
                              <Phone className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <div className="font-extrabold text-xs text-white">Call via WhatsApp</div>
                              <div className="text-[10px] text-emerald-400/80">Voice / Video Ring</div>
                            </div>
                            <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-emerald-900/80">
                              <button
                                type="button"
                                onClick={() => handleCallViaWhatsApp(selectedResidentHouse, selectedResidentHouse.contactNumber)}
                                className="py-1 px-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-mono font-bold text-[9px] text-center truncate"
                                title="WhatsApp Call Primary Line"
                              >
                                Primary
                              </button>
                              <button
                                type="button"
                                disabled={!selectedResidentHouse.alternateContactNumber}
                                onClick={() => selectedResidentHouse.alternateContactNumber && handleCallViaWhatsApp(selectedResidentHouse, selectedResidentHouse.alternateContactNumber)}
                                className={`py-1 px-1 rounded font-mono font-bold text-[9px] text-center truncate ${
                                  selectedResidentHouse.alternateContactNumber
                                    ? 'bg-cyan-800 hover:bg-cyan-700 text-white'
                                    : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                                }`}
                                title={selectedResidentHouse.alternateContactNumber ? 'WhatsApp Call Alternate Line' : 'Alternate line not configured'}
                              >
                                Alt
                              </button>
                              <button
                                type="button"
                                disabled={!selectedResidentHouse.emergencyContact}
                                onClick={() => selectedResidentHouse.emergencyContact && handleCallViaWhatsApp(selectedResidentHouse, selectedResidentHouse.emergencyContact)}
                                className={`py-1 px-1 rounded font-mono font-bold text-[9px] text-center truncate ${
                                  selectedResidentHouse.emergencyContact
                                    ? 'bg-amber-800 hover:bg-amber-700 text-white'
                                    : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                                }`}
                                title={selectedResidentHouse.emergencyContact ? 'WhatsApp Call Emergency Line' : 'Emergency line not configured'}
                              >
                                Emerg
                              </button>
                            </div>
                          </div>

                          {/* 2. WHATSAPP MESSAGE OPTION */}
                          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 flex flex-col justify-between space-y-2 shadow-md shadow-emerald-950/40">
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] font-mono font-extrabold tracking-wider text-emerald-400 uppercase">
                                WHATSAPP MESSAGE
                              </span>
                              <MessageCircle className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <div className="font-extrabold text-xs text-white">Msg via WhatsApp</div>
                              <div className="text-[10px] text-emerald-400/80">Send Car &amp; Guest Info</div>
                            </div>
                            <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-emerald-900/80">
                              <button
                                type="button"
                                onClick={() => handleMsgViaWhatsApp(selectedResidentHouse, selectedResidentHouse.contactNumber)}
                                className="py-1 px-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-mono font-bold text-[9px] text-center truncate"
                                title="WhatsApp Message Primary Line"
                              >
                                Primary
                              </button>
                              <button
                                type="button"
                                disabled={!selectedResidentHouse.alternateContactNumber}
                                onClick={() => selectedResidentHouse.alternateContactNumber && handleMsgViaWhatsApp(selectedResidentHouse, selectedResidentHouse.alternateContactNumber)}
                                className={`py-1 px-1 rounded font-mono font-bold text-[9px] text-center truncate ${
                                  selectedResidentHouse.alternateContactNumber
                                    ? 'bg-cyan-800 hover:bg-cyan-700 text-white'
                                    : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                                }`}
                                title={selectedResidentHouse.alternateContactNumber ? 'WhatsApp Message Alternate Line' : 'Alternate line not configured'}
                              >
                                Alt
                              </button>
                              <button
                                type="button"
                                disabled={!selectedResidentHouse.emergencyContact}
                                onClick={() => selectedResidentHouse.emergencyContact && handleMsgViaWhatsApp(selectedResidentHouse, selectedResidentHouse.emergencyContact)}
                                className={`py-1 px-1 rounded font-mono font-bold text-[9px] text-center truncate ${
                                  selectedResidentHouse.emergencyContact
                                    ? 'bg-amber-800 hover:bg-amber-700 text-white'
                                    : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                                }`}
                                title={selectedResidentHouse.emergencyContact ? 'WhatsApp Message Emergency Line' : 'Emergency line not configured'}
                              >
                                Emerg
                              </button>
                            </div>
                          </div>

                          {/* 3. NORMAL PHONE CALL OPTION */}
                          <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-600/60 text-blue-200 flex flex-col justify-between space-y-2 shadow-md shadow-blue-950/40">
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] font-mono font-extrabold tracking-wider text-blue-400 uppercase">
                                CELLULAR / GSM
                              </span>
                              <Smartphone className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <div className="font-extrabold text-xs text-white">Normal Phone Call</div>
                              <div className="text-[10px] text-blue-300/80">Call or Intercom</div>
                            </div>
                            <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-blue-900/80">
                              <button
                                type="button"
                                onClick={() => handleStartResidentCall(selectedResidentHouse, 'PRIMARY')}
                                className="py-1 px-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-[9px] text-center truncate"
                                title="Call Primary Line"
                              >
                                Primary
                              </button>
                              <button
                                type="button"
                                disabled={!selectedResidentHouse.alternateContactNumber}
                                onClick={() => selectedResidentHouse.alternateContactNumber && handleStartResidentCall(selectedResidentHouse, 'ALTERNATE')}
                                className={`py-1 px-1 rounded font-mono font-bold text-[9px] text-center truncate ${
                                  selectedResidentHouse.alternateContactNumber
                                    ? 'bg-cyan-700 hover:bg-cyan-600 text-white'
                                    : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                                }`}
                                title={selectedResidentHouse.alternateContactNumber ? 'Call Alternate Line' : 'Alternate line not configured'}
                              >
                                Alt
                              </button>
                              <button
                                type="button"
                                disabled={!selectedResidentHouse.emergencyContact}
                                onClick={() => selectedResidentHouse.emergencyContact && handleStartResidentCall(selectedResidentHouse, 'EMERGENCY')}
                                className={`py-1 px-1 rounded font-mono font-bold text-[9px] text-center truncate ${
                                  selectedResidentHouse.emergencyContact
                                    ? 'bg-amber-700 hover:bg-amber-600 text-white'
                                    : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                                }`}
                                title={selectedResidentHouse.emergencyContact ? 'Call Emergency Line' : 'Emergency line not configured'}
                              >
                                Emerg
                              </button>
                            </div>
                          </div>

                          {/* 4. MSG VIA MESSENGER OPTION */}
                          <div className="p-3 rounded-xl bg-purple-950/80 border border-purple-500/60 text-purple-200 flex flex-col justify-between space-y-2 shadow-md shadow-purple-950/40">
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] font-mono font-extrabold tracking-wider text-purple-400 uppercase">
                                MESSENGER / SMS
                              </span>
                              <MessageSquare className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <div className="font-extrabold text-xs text-white">Msg via Messenger</div>
                              <div className="text-[10px] text-purple-300/80">Messenger / SMS Dispatch</div>
                            </div>
                            <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-purple-900/80">
                              <button
                                type="button"
                                onClick={() => handleOpenMessenger(selectedResidentHouse)}
                                className="py-1 px-1 rounded bg-purple-800 hover:bg-purple-700 text-white font-mono font-bold text-[9px] text-center"
                                title="Open Messenger Dispatch Modal"
                              >
                                Dispatch
                              </button>
                              <button
                                type="button"
                                onClick={() => openUnifiedContactModal(selectedResidentHouse, 'GUEST_CHECK', unknownDriverName, plateInput, 'EMERGENCY')}
                                className="py-1 px-1 rounded bg-amber-900 hover:bg-amber-800 text-amber-200 font-mono font-bold text-[9px] text-center"
                                title="Open Emergency SMS / Messenger"
                              >
                                Emerg SMS
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Quick One-Click Verification Status Toggle */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                          <div className="text-xs text-slate-300 flex items-center space-x-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>
                              After calling or messaging, click below once the resident grants permission:
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playSuccessChime();
                              setPhoneCallVerified(!phoneCallVerified);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center space-x-1.5 cursor-pointer ${
                              phoneCallVerified
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                                : 'bg-slate-800 hover:bg-emerald-900 hover:text-emerald-300 text-slate-300 border border-slate-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{phoneCallVerified ? 'Resident Confirmed (Verified)' : 'Mark Resident Confirmed'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: VERIFICATION STATUS NOTICE */}
                  {phoneCallVerified ? (
                    <div className="p-4 rounded-xl bg-emerald-950/90 border-2 border-emerald-500 text-emerald-200 text-xs flex items-center justify-between shadow-lg shadow-emerald-950">
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <span className="font-extrabold uppercase tracking-wide block font-mono text-white">
                            VERIFIED VIA DIRECT RESIDENT PHONE CALL
                          </span>
                          <span className="text-emerald-300 text-[11px]">
                            {selectedResidentHouse?.ownerName} ({selectedResidentHouse?.houseNumber}) has verbally authorized guest entry.
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-emerald-900 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-700">
                        VERIFIED
                      </span>
                    </div>
                  ) : approvalRequested ? (
                    <div className="p-3.5 rounded-xl bg-cyan-950/90 border border-cyan-500 text-cyan-200 text-xs flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span>Digital approval dispatched to {unknownSelectedHouse}. Waiting for resident...</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900 border border-cyan-700 text-cyan-300">
                        PENDING APP RESPONSE
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>
                        Access Pending: Please call {selectedResidentHouse?.ownerName} at{' '}
                        <span className="font-mono font-bold text-white underline">{selectedResidentHouse?.contactNumber}</span> to confirm if they are expecting this vehicle.
                      </span>
                    </div>
                  )}

                  {/* STEP 4: GUEST DRIVER & PURPOSE DETAILS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <label className="block text-slate-400 mb-1 font-mono text-[11px]">Driver Name (Optional)</label>
                      <input
                        type="text"
                        value={unknownDriverName}
                        onChange={e => setUnknownDriverName(e.target.value)}
                        placeholder="e.g. Asad Qureshi"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-mono text-[11px]">Driver Phone (Optional)</label>
                      <input
                        type="text"
                        value={unknownDriverPhone}
                        onChange={e => setUnknownDriverPhone(e.target.value)}
                        placeholder="e.g. +92-333-5559922"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-mono text-[11px]">Purpose of Visit</label>
                      <select
                        value={unknownGuestPurpose}
                        onChange={e => setUnknownGuestPurpose(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      >
                        <option value="Personal Guest / Family Visit">Personal Guest / Family Visit</option>
                        <option value="Food & Grocery Delivery">Food &amp; Grocery Delivery</option>
                        <option value="Courier / Package Delivery">Courier / Package Delivery</option>
                        <option value="Maintenance / Contractor">Maintenance / Contractor</option>
                        <option value="Official / Business Meeting">Official / Business Meeting</option>
                        <option value="Other Visitor">Other Visitor</option>
                      </select>
                    </div>
                  </div>

                  {/* STEP 5: FINAL GUARD DECISION ACTIONS */}
                  <div className="pt-2 flex flex-wrap gap-2.5 justify-end items-center border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUnknownPlate(false);
                        setPlateInput('');
                        setPhoneCallVerified(false);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 font-bold text-xs border border-red-800 transition-colors"
                    >
                      ❌ Deny Entry &amp; Clear
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartResidentCall(selectedResidentHouse)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-xs border border-cyan-800 flex items-center space-x-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Call {selectedResidentHouse?.houseNumber}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAuthorizeUnknownGuest}
                      className={`px-6 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center space-x-2 border transition-all ${
                        phoneCallVerified
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 border-emerald-400 scale-105'
                          : 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-950 border-amber-400'
                      }`}
                    >
                      <DoorClosed className="w-4 h-4" />
                      <span>
                        {phoneCallVerified ? '✅ Allow Verified Guest & Open Barrier' : 'Allow Guest & Open Boom Barrier'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}
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

                {/* Host Resident Contact Details Card for Guard Clearance */}
                {(() => {
                  const targetHouse = houses.find(h => h.houseNumber === visitorHouse) || houses[0];
                  if (!targetHouse) return null;
                  return (
                    <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-bold text-white font-mono">{targetHouse.houseNumber} Host: {targetHouse.ownerName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{targetHouse.block} • {targetHouse.street}</span>
                      </div>

                      {/* 3 lines display */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] text-slate-400">Primary Intercom</span>
                            <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">PRIMARY</span>
                          </div>
                          <span className="text-emerald-400 font-bold block">{targetHouse.contactNumber}</span>
                        </div>

                        <div className={`p-2 rounded-lg border ${targetHouse.alternateContactNumber ? 'bg-cyan-950/40 border-cyan-800' : 'bg-slate-900/50 border-slate-800'}`}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] text-cyan-400 font-bold">Alternate Line</span>
                            <span className={`text-[8px] px-1 py-0.2 rounded border font-bold ${targetHouse.alternateContactNumber ? 'bg-cyan-900 text-cyan-300 border-cyan-700' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                              {targetHouse.alternateContactNumber ? 'MGMT SYNC' : 'NONE'}
                            </span>
                          </div>
                          <span className="text-cyan-300 font-bold block">{targetHouse.alternateContactNumber || 'Not entered'}</span>
                        </div>

                        <div className={`p-2 rounded-lg border ${targetHouse.emergencyContact ? 'bg-amber-950/40 border-amber-800' : 'bg-slate-900/50 border-slate-800'}`}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] text-amber-400 font-bold">Emergency Line</span>
                            <span className={`text-[8px] px-1 py-0.2 rounded border font-bold ${targetHouse.emergencyContact ? 'bg-amber-900 text-amber-300 border-amber-700' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                              {targetHouse.emergencyContact ? 'EMERGENCY' : 'NONE'}
                            </span>
                          </div>
                          <span className="text-amber-300 font-bold block">{targetHouse.emergencyContact || 'Not entered'}</span>
                        </div>
                      </div>

                      {/* Contact Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900">
                        <span className="text-[11px] text-slate-400">
                          Verify guest with host using any channel:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openUnifiedContactModal(targetHouse, 'GUEST_CHECK', visitorName, visitorPlate)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center space-x-1 shadow"
                          >
                            <PhoneForwarded className="w-3.5 h-3.5" />
                            <span>Multi-Line Contact Hub</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartResidentCall(targetHouse, 'PRIMARY')}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center space-x-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCallViaWhatsApp(targetHouse, targetHouse.contactNumber)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-mono flex items-center space-x-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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

            {/* Host Resident Contact Details for Delivery Clearance */}
            {(() => {
              const targetHouse = houses.find(h => h.houseNumber === deliveryHouse) || houses[0];
              if (!targetHouse) return null;
              return (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white font-mono">{targetHouse.houseNumber} Host: {targetHouse.ownerName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{targetHouse.block} • {targetHouse.street}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900">
                    <div className="flex items-center space-x-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Primary Intercom:</span>
                        <span className="text-emerald-400 font-bold">{targetHouse.contactNumber}</span>
                      </div>
                      {targetHouse.alternateContactNumber && (
                        <div className="border-l border-slate-800 pl-3">
                          <div className="flex items-center space-x-1">
                            <span className="text-[10px] text-cyan-400 font-bold">Alternate Line:</span>
                            <span className="text-[8px] bg-cyan-950 text-cyan-300 px-1 py-0.2 rounded border border-cyan-700 font-bold">SHARED BY MGMT</span>
                          </div>
                          <span className="text-cyan-300 font-bold">{targetHouse.alternateContactNumber}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartResidentCall(targetHouse)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center space-x-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call Host</span>
                      </button>
                      {targetHouse.alternateContactNumber && (
                        <button
                          type="button"
                          onClick={() => handleStartResidentCall(targetHouse, true)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center space-x-1"
                          title="Call Alternate Number"
                        >
                          <PhoneForwarded className="w-3 h-3" />
                          <span>Call Alt</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCallViaWhatsApp(targetHouse)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-mono flex items-center space-x-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

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

            {/* Host Resident Contact Details for Service Staff Clearance */}
            {(() => {
              const targetHouse = houses.find(h => h.houseNumber === serviceHouse) || houses[0];
              if (!targetHouse) return null;
              return (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white font-mono">{targetHouse.houseNumber} Host: {targetHouse.ownerName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{targetHouse.block} • {targetHouse.street}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900">
                    <div className="flex items-center space-x-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Primary Intercom:</span>
                        <span className="text-emerald-400 font-bold">{targetHouse.contactNumber}</span>
                      </div>
                      {targetHouse.alternateContactNumber && (
                        <div className="border-l border-slate-800 pl-3">
                          <div className="flex items-center space-x-1">
                            <span className="text-[10px] text-cyan-400 font-bold">Alternate Line:</span>
                            <span className="text-[8px] bg-cyan-950 text-cyan-300 px-1 py-0.2 rounded border border-cyan-700 font-bold">SHARED BY MGMT</span>
                          </div>
                          <span className="text-cyan-300 font-bold">{targetHouse.alternateContactNumber}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartResidentCall(targetHouse)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center space-x-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call Host</span>
                      </button>
                      {targetHouse.alternateContactNumber && (
                        <button
                          type="button"
                          onClick={() => handleStartResidentCall(targetHouse, true)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center space-x-1"
                          title="Call Alternate Number"
                        >
                          <PhoneForwarded className="w-3 h-3" />
                          <span>Call Alt</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCallViaWhatsApp(targetHouse)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-mono flex items-center space-x-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

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

        {/* TAB 10: RMP (RESIDENT MESSAGES PORTAL) PRE-CLEARANCES ROSTER */}
        {activeTab === 'RMP_CLEARANCES' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-600 flex items-center justify-center text-purple-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-white font-mono tracking-wider">
                      RMP PRE-CLEARANCE GATE ROSTER
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono text-[10px] font-bold">
                      LIVE STREAM
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Pre-notifications submitted by verified residents to eliminate gate bottlenecks and waiting queues
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={loadRMPNotifications}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-purple-300 flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync RMP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ACTIONS')}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Back to Fast Actions
                </button>
              </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">TOTAL SUBMITTED</span>
                <span className="text-lg font-bold text-white">{rmpNotificationsList.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-purple-900/60">
                <span className="text-[10px] text-purple-400 block">EXPECTED TODAY (UPCOMING)</span>
                <span className="text-lg font-bold text-purple-300">
                  {rmpNotificationsList.filter(n => n.status === 'UPCOMING').length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-900/60">
                <span className="text-[10px] text-emerald-400 block">CURRENTLY INSIDE</span>
                <span className="text-lg font-bold text-emerald-300">
                  {rmpNotificationsList.filter(n => n.status === 'INSIDE_SOCIETY').length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">COMPLETED EXITS</span>
                <span className="text-lg font-bold text-slate-400">
                  {rmpNotificationsList.filter(n => n.status === 'EXITED').length}
                </span>
              </div>
            </div>

            {/* Filters and search */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-1.5 overflow-x-auto">
                {(['ALL', 'GUEST', 'DELIVERY', 'SERVICE_STAFF'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRmpFilterType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      rmpFilterType === type
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {type === 'ALL' ? 'All Records' : type === 'GUEST' ? 'Guests' : type === 'DELIVERY' ? 'Deliveries' : 'Service Staff'}
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Showing {rmpNotificationsList.filter(n => rmpFilterType === 'ALL' || n.type === rmpFilterType).length} records
              </div>
            </div>

            {/* List of Pre-Clearances */}
            {(() => {
              const filtered = rmpNotificationsList.filter(n => rmpFilterType === 'ALL' || n.type === rmpFilterType);

              if (filtered.length === 0) {
                return (
                  <div className="p-10 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                    <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-400 font-mono">No RMP pre-notifications found for this filter.</p>
                    <p className="text-xs text-slate-600">
                      When residents log visitors in the RMP Portal, they will appear here instantaneously.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map(notif => {
                    const isUpcoming = notif.status === 'UPCOMING';
                    const isInside = notif.status === 'INSIDE_SOCIETY';
                    const isExited = notif.status === 'EXITED';

                    return (
                      <div
                        key={notif.id}
                        className={`p-5 rounded-2xl bg-slate-950 border transition-all space-y-3 ${
                          isUpcoming
                            ? 'border-purple-600/80 shadow-lg shadow-purple-950/20'
                            : isInside
                            ? 'border-emerald-600/80'
                            : 'border-slate-800 opacity-70'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              notif.type === 'GUEST'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : notif.type === 'DELIVERY'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}>
                              {notif.type}
                            </span>
                            <span className="font-bold text-white text-sm">{notif.fullName}</span>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isUpcoming
                              ? 'bg-amber-950 text-amber-300 border border-amber-700'
                              : isInside
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}>
                            {notif.status}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono block">VEHICLE PLATE</span>
                            <span className="font-mono font-extrabold text-purple-300 text-sm">
                              {notif.vehiclePlate || 'WALK-IN'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-mono block">PHONE / CNIC</span>
                            <span className="font-mono text-slate-300 text-xs">{notif.phone || notif.nic || 'Verified'}</span>
                          </div>
                          <div className="col-span-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-mono text-[11px]">
                                Host: <strong className="text-white">{notif.residentName}</strong> ({notif.residentHouseNumber})
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {notif.expectedDate} • {notif.expectedTime}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1">
                              <span className="text-purple-400 font-semibold">Purpose:</span> {notif.purpose}
                            </p>
                            {notif.additionalNotes && (
                              <p className="text-[11px] text-slate-400 italic mt-0.5">
                                Note: "{notif.additionalNotes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                          {notif.vehiclePlate && (
                            <button
                              type="button"
                              onClick={() => {
                                setPlateInput(notif.vehiclePlate!);
                                handleLookupPlate(notif.vehiclePlate!);
                                setActiveTab('VEHICLE_ENTRY');
                              }}
                              className="text-[11px] font-mono text-purple-400 hover:text-purple-300 underline flex items-center space-x-1 cursor-pointer"
                            >
                              <Camera className="w-3 h-3" />
                              <span>Test ANPR Plate</span>
                            </button>
                          )}

                          <div className="flex items-center space-x-2 ml-auto">
                            {isUpcoming && (
                              <button
                                type="button"
                                disabled={rmpClearanceLoading}
                                onClick={() => handleAdmitRMPVisitor(notif)}
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-mono font-bold text-xs flex items-center space-x-1.5 shadow-md cursor-pointer"
                              >
                                <DoorClosed className="w-3.5 h-3.5" />
                                <span>Express Admit</span>
                              </button>
                            )}

                            {isInside && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await api.updateRMPStatus(notif.id, {
                                    status: 'EXITED',
                                    guardName: currentGuard.name,
                                    gateName: currentGate.name
                                  });
                                  soundEngine.playSuccessChime();
                                  loadRMPNotifications();
                                  onRefresh();
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
                              >
                                Log Exit
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB: SCAN QR PASS (FEATURE 1 & FEATURE 2) */}
        {activeTab === 'SCAN_QR_PASS' && (
          <div className="bg-slate-900 border border-purple-800/80 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-600 flex items-center justify-center text-purple-300 shadow-inner">
                  <QrCode className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-bold text-white font-mono">
                      OFFICIAL QR PASS SCANNER
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono font-bold">
                      GATE BARRIER SYNC
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Scan or enter QR Pass ID for Guests, Deliveries, Service Staff, Social Workers, or Residents.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                  Gate: <strong className="text-white">{currentGate.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('ACTIONS')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Back to Fast Actions
                </button>
              </div>
            </div>

            {/* Notifications & Banners */}
            {qrScanSuccessNotice && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center space-x-2 shadow-lg animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-semibold">{qrScanSuccessNotice}</span>
              </div>
            )}

            {qrScanError && (
              <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500 text-red-200 text-xs flex items-center space-x-2 shadow-lg animate-in fade-in">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="font-semibold">{qrScanError}</span>
              </div>
            )}

            {/* Scanner Input & Camera Viewport */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Scanner Box & Input */}
              <div className="lg:col-span-5 space-y-4">
                {/* Simulated Optical Camera Scanner Target */}
                <div className="relative aspect-video sm:aspect-square bg-slate-950 border-2 border-dashed border-purple-700/70 rounded-2xl p-4 flex flex-col items-center justify-center text-center overflow-hidden group shadow-inner">
                  {/* Sweep Line Animation */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-sm shadow-cyan-400 top-1/2 -translate-y-1/2" />
                  
                  {/* Corner Targets */}
                  <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-purple-400" />
                  <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-purple-400" />
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-purple-400" />
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-purple-400" />

                  <QrCode className="w-16 h-16 text-purple-400/80 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    Optical Scanner Active
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Align visitor's phone screen or printed gate pass QR in front of gate scanner
                  </p>
                </div>

                {/* Input Box for QR Pass ID / Token */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleScanQRPass();
                  }}
                  className="space-y-2"
                >
                  <label className="block text-xs font-mono font-semibold text-slate-300">
                    Scan or Enter QR Pass Code / ID:
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={qrScanInput}
                      onChange={(e) => setQrScanInput(e.target.value)}
                      placeholder="e.g. RMP-LEA2024 / QR-789123 / RES-ZYG48291"
                      className="flex-1 bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono uppercase focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={qrScanLoading}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs tracking-wider uppercase font-mono shadow-lg shadow-purple-950 flex items-center space-x-1.5 cursor-pointer"
                    >
                      {qrScanLoading ? (
                        <span>Validating...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Scan Pass</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Quick Simulation Presets */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block">
                    Quick Pass Test Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setQrScanInput('RMP-LEA2024');
                        handleScanQRPass('RMP-LEA2024');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-[10px] font-mono text-purple-200 cursor-pointer"
                    >
                      Guest (Farhan Tariq / 88-C)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQrScanInput('RMP-DELIV01');
                        handleScanQRPass('RMP-DELIV01');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-[10px] font-mono text-amber-200 cursor-pointer"
                    >
                      Delivery (FoodPanda / 88-C)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQrScanInput('RMP-STAFF01');
                        handleScanQRPass('RMP-STAFF01');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-[10px] font-mono text-blue-200 cursor-pointer"
                    >
                      Service (Electrician / 88-C)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQrScanInput('RMP-SOC01');
                        handleScanQRPass('RMP-SOC01');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-[10px] font-mono text-emerald-200 cursor-pointer"
                    >
                      Social Worker (Health / 88-C)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQrScanInput('RES-ZYG48291');
                        handleScanQRPass('RES-ZYG48291');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-[10px] font-mono text-cyan-200 cursor-pointer"
                    >
                      Resident Minor (Zainab / 88-C)
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Verified Pass Dossier Card */}
              <div className="lg:col-span-7">
                {scannedPassResult ? (
                  <div className={`p-5 sm:p-6 rounded-2xl border-2 space-y-4 shadow-xl ${
                    scannedPassResult.valid
                      ? 'bg-slate-950 border-emerald-500/80 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950 border-red-500/80 ring-1 ring-red-500/30'
                  }`}>
                    {/* Pass Status Banner */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center space-x-2">
                        {scannedPassResult.valid ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500 text-xs font-mono font-bold flex items-center space-x-1.5 shadow">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>PASS VERIFIED &amp; ACTIVE</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-red-950 text-red-300 border border-red-500 text-xs font-mono font-bold flex items-center space-x-1.5 shadow">
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span>{scannedPassResult.status || 'INVALID OR EXPIRED PASS'}</span>
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono font-bold uppercase">
                          {scannedPassResult.type || 'VISITOR'}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-slate-400">
                        ID: <strong className="text-white">{scannedPassResult.passId || scannedPassResult.id || qrScanInput}</strong>
                      </span>
                    </div>

                    {/* Pass Information Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* 1. Guest / Holder Name */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {scannedPassResult.type === 'DELIVERY'
                            ? 'Rider / Delivery Agent'
                            : scannedPassResult.type === 'SERVICE_STAFF'
                            ? 'Staff Personnel'
                            : scannedPassResult.type === 'RESIDENT'
                            ? 'Resident Name'
                            : 'Guest / Visitor Name'}
                        </span>
                        <div className="text-sm font-bold text-white">
                          {scannedPassResult.holderName || scannedPassResult.fullName || scannedPassResult.name || 'Farhan Tariq'}
                        </div>
                      </div>

                      {/* 2. Host Resident & House */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Host Resident &amp; Unit</span>
                        <div className="text-sm font-bold text-cyan-300">
                          {scannedPassResult.hostResident || scannedPassResult.residentName || 'Babar Ghori'} ({scannedPassResult.houseNumber || scannedPassResult.residentHouseNumber || '88-C'})
                        </div>
                      </div>

                      {/* 3. Purpose of Visit / Delivery Item */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Purpose of Visit / Scope</span>
                        <div className="font-semibold text-white">
                          {scannedPassResult.purpose || scannedPassResult.category || 'Family Visit / Social Gathering'}
                        </div>
                      </div>

                      {/* 4. Vehicle Number */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Vehicle Plate</span>
                        <div className="font-mono font-bold text-amber-300">
                          {scannedPassResult.vehicleNumber || scannedPassResult.vehiclePlate || 'WALK-IN (NO VEHICLE)'}
                        </div>
                      </div>

                      {/* 5. Pass Validity Window */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Pass Validity</span>
                        <div className="font-mono text-slate-200">
                          {scannedPassResult.validity || scannedPassResult.validUntil || 'Today (08:00 AM — 11:59 PM)'}
                        </div>
                      </div>

                      {/* 6. Usage Mode (Single-Use vs Multi-Use) */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Entry Permissions</span>
                        <div className="font-semibold text-purple-300 flex items-center space-x-1.5">
                          <span>{scannedPassResult.isSingleUse !== false ? 'Single-Use Pass (Expires on exit)' : 'Multi-Use Pass (Multiple Entries)'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Under-18 Resident Protection Banner (if resident pass) */}
                    {scannedPassResult.isUnder18 && (
                      <div className="p-3 rounded-xl bg-purple-950/70 border border-purple-700/80 text-xs flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                          <div>
                            <span className="font-bold text-white block">PROTECTED MINOR RESIDENT (UNDER-18)</span>
                            <span className="text-[10px] text-purple-300">Age: {scannedPassResult.age || 15} Years • Sensitive CNIC hidden under minor security guidelines</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono bg-purple-900 text-purple-200 px-2 py-0.5 rounded border border-purple-700">
                          CODE: {scannedPassResult.residentCode || 'ZYG-48291'}
                        </span>
                      </div>
                    )}

                    {/* Gate Operator Actions (Feature 1) */}
                    <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setScannedPassResult(null);
                            setQrScanInput('');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                        >
                          Clear &amp; Scan Next
                        </button>

                        {/* Contact Host Resident Button (Feature 1 Requirement) */}
                        <button
                          type="button"
                          onClick={() => {
                            const houseNum = scannedPassResult.houseNumber || scannedPassResult.residentHouseNumber;
                            const matchedHouse = houses.find(h => h.houseNumber === houseNum) || {
                              id: `house_${houseNum || 'unknown'}`,
                              houseNumber: houseNum || '88-C',
                              block: 'Block A',
                              ownerName: scannedPassResult.hostResident || scannedPassResult.residentName || 'Host Resident',
                              contactNumber: scannedPassResult.hostPhone || '+923001234567',
                              status: 'OCCUPIED'
                            };
                            setContactHubState({
                              isOpen: true,
                              resident: matchedHouse as any,
                              contextType: 'GUEST_ENTRY',
                              visitorName: scannedPassResult.holderName || scannedPassResult.fullName,
                              vehiclePlate: scannedPassResult.vehicleNumber || scannedPassResult.vehiclePlate
                            });
                          }}
                          className="px-3.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                          title="Call or message host resident to verify unexpected visitor"
                        >
                          <Phone className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Contact Host Resident</span>
                        </button>

                        {/* Record Exit Later Shortcut */}
                        {(scannedPassResult.vehicleNumber && scannedPassResult.vehicleNumber !== 'WALK-IN (NO VEHICLE)') && (
                          <button
                            type="button"
                            onClick={() => {
                              setExitPlateInput(scannedPassResult.vehicleNumber || '');
                              setActiveTab('VEHICLE_EXIT');
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono flex items-center space-x-1 cursor-pointer"
                            title="Navigate to Vehicle Exit log when this visitor departs"
                          >
                            <LogOut className="w-3.5 h-3.5 text-amber-400" />
                            <span>Record Exit Later</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleDenyScannedPass(scannedPassResult)}
                          className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 border border-red-700 text-xs font-bold cursor-pointer"
                        >
                          Deny Entry
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveScannedPass(scannedPassResult)}
                          className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs tracking-wider uppercase font-mono shadow-lg shadow-emerald-950 flex items-center space-x-1.5 cursor-pointer"
                        >
                          <DoorClosed className="w-4 h-4" />
                          <span>Approve &amp; Open Barrier</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[260px] p-8 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                    <QrCode className="w-12 h-12 text-slate-700" />
                    <h4 className="text-sm font-bold text-white font-mono">NO PASS SCANNED YET</h4>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Scan a pass QR code with the gate optical scanner or enter a Pass ID on the left to verify details.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: VERIFY RESIDENT IDENTITY (FEATURE 7 & FEATURE 8 - 4 METHODS) */}
        {activeTab === 'VERIFY_IDENTITY' && (
          <div className="bg-slate-900 border border-cyan-800/80 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-600 flex items-center justify-center text-cyan-300 shadow-inner">
                  <UserCheck className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-bold text-white font-mono">
                      RESIDENT IDENTITY VERIFICATION (4 METHODS)
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold">
                      FEATURE 7 &amp; 8
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Verify resident identity via CNIC, Phone, House/Address, or System Resident Code. Protects minors under 18.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('ACTIONS')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Back to Fast Actions
              </button>
            </div>

            {/* 4 Primary Verification Method Selection Buttons (Feature 7) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                { id: 'QR_PASS', label: '1. QR Pass Scan', icon: QrCode, desc: 'Pass ID, Token or Camera' },
                { id: 'CNIC', label: '2. NIC / CNIC (18+)', icon: Crown, desc: '13-digit Pakistani CNIC' },
                { id: 'RESIDENT_CODE', label: '3. Resident Code / Minor', icon: KeyRound, desc: 'Encrypted code for minor' },
                { id: 'VEHICLE_PLATE', label: '4. Number Plate (ANPR)', icon: CarFront, desc: 'Vehicle plate association' },
                { id: 'PHONE', label: '5. Phone Contact', icon: Phone, desc: 'Primary or alternate line' },
                { id: 'HOUSE', label: '6. House Number', icon: Building2, desc: 'Unit & block dossier' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setVerifyMethod(m.id as any);
                    setVerifyResult(null);
                    setVerifyError(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    verifyMethod === m.id
                      ? 'bg-cyan-950/90 border-cyan-500 text-white shadow-lg ring-1 ring-cyan-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-mono font-bold text-xs">
                    <m.icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{m.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{m.desc}</span>
                </button>
              ))}
            </div>

            {/* Search Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunIdentityVerification();
              }}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
            >
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={verifyQuery}
                    onChange={(e) => setVerifyQuery(e.target.value)}
                    placeholder={
                      verifyMethod === 'QR_PASS'
                        ? 'Enter Pass ID, Token, or scan QR (e.g. SEC247-PASS-BABAR-FARZAN or SEC247-PASS-GUEST-01)...'
                        : verifyMethod === 'CNIC'
                        ? 'Enter 13-digit CNIC (e.g. 37405-1234567-1 or 35202-1234567-1)...'
                        : verifyMethod === 'RESIDENT_CODE'
                        ? 'Enter resident code (e.g. ZYG-48291 or RS-88C)...'
                        : verifyMethod === 'VEHICLE_PLATE'
                        ? 'Enter vehicle plate number (e.g. KHI-8899, ABC-1234, or LEB-4421)...'
                        : verifyMethod === 'PHONE'
                        ? 'Enter resident phone number (e.g. +92-300-1234567)...'
                        : 'Enter house or villa number (e.g. House 88-C or Villa 101)...'
                    }
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs tracking-wider uppercase font-mono shadow-lg shadow-cyan-950 flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                >
                  {verifyLoading ? <span>Verifying...</span> : <span>Run Verification</span>}
                </button>
              </div>

              {/* Presets */}
              <div className="flex items-center space-x-2 flex-wrap text-[11px] text-slate-400 font-mono pt-1">
                <span className="text-slate-500">Fast Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod('QR_PASS');
                    setVerifyQuery('SEC247-PASS-BABAR-FARZAN');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 cursor-pointer"
                >
                  Farzan QR Pass
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod('CNIC');
                    setVerifyQuery('37405-1234567-1');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 cursor-pointer"
                >
                  Babar Ghori CNIC (37405-1234567-1)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod('RESIDENT_CODE');
                    setVerifyQuery('BG-7861');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-purple-400 border border-slate-800 cursor-pointer"
                >
                  Babar Ghori RMP Code (BG-7861)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod('VEHICLE_PLATE');
                    setVerifyQuery('KHI-8899');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 cursor-pointer"
                >
                  Plate KHI-8899 (Babar Ghori)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod('HOUSE');
                    setVerifyQuery('House 88-C');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                >
                  House 88-C
                </button>
              </div>
            </form>

            {/* Error Display */}
            {verifyError && (
              <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500 text-red-200 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            {/* Verification Result Card (Feature 8) */}
            {verifyResult && (() => {
              const detail = verifyResult.data || verifyResult;
              const isSuccess = !!(verifyResult.success || verifyResult.verified);
              const isMinor = !!(detail.isUnder18 || (detail.age && detail.age < 18));
              const resName = detail.residentName || detail.fullName || detail.name || detail.holderName || detail.ownerName || 'Resident';
              const houseNum = detail.houseNumber || '88-C';
              const blockStr = detail.block || 'Block A';
              const relStr = detail.relationship || detail.residentType || 'Main Resident';
              const maskedId = detail.maskedCnic || verifyResult.maskedCnic || (detail.cnic ? `${detail.cnic.slice(0, 5)}-*******-${detail.cnic.slice(-1)}` : 'On File (Masked)');
              const resCode = detail.residentCode || (isMinor ? 'ZYG-48291' : 'N/A');
              const statusStr = verifyResult.status || (isSuccess ? 'VERIFIED RESIDENT' : 'VERIFICATION REQUIRED');

              const isWatchlist = statusStr.includes('WATCHLIST');
              const isDenied = !isSuccess || isWatchlist || statusStr.includes('UNKNOWN') || statusStr.includes('EXPIRED') || statusStr.includes('REVOKED') || statusStr.includes('INVALID');

              return (
                <div className={`p-6 rounded-2xl border-2 space-y-4 shadow-xl ${
                  !isDenied
                    ? 'bg-slate-950 border-cyan-500/80 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950 border-red-500/80 ring-1 ring-red-500/30'
                }`}>
                  {/* Result Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center space-x-1.5 shadow ${
                        !isDenied
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                          : isWatchlist
                          ? 'bg-red-900 text-white border-2 border-red-500 animate-pulse'
                          : 'bg-red-950 text-red-300 border border-red-500'
                      }`}>
                        {!isDenied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                        <span>{statusStr}</span>
                      </span>

                      {/* Under-18 Badge */}
                      {isMinor ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-600 text-[10px] font-mono font-bold flex items-center space-x-1">
                          <Shield className="w-3 h-3 text-purple-400" />
                          <span>PROTECTED MINOR (UNDER-18)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold">
                          ADULT RESIDENT (18+)
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-mono text-slate-400">
                      Method: <strong className="text-white">{verifyResult.verificationMethod || verifyMethod}</strong>
                    </span>
                  </div>

                  {/* Details Grid (Feature 8) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {/* Full Name */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Resident Full Name</span>
                      <div className="text-sm font-bold text-white">
                        {resName}
                      </div>
                    </div>

                    {/* Relationship */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Relationship to Main Resident</span>
                      <div className="font-semibold text-cyan-300">
                        {relStr}
                      </div>
                    </div>

                    {/* House & Block */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">House Number &amp; Block</span>
                      <div className="font-mono font-bold text-white">
                        {houseNum} ({blockStr})
                      </div>
                    </div>

                    {/* Society Name */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Registered Society</span>
                      <div className="font-semibold text-slate-200">
                        {detail.societyName || society.name}
                      </div>
                    </div>

                    {/* Identification */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {isMinor ? 'System Resident Code' : 'National ID (CNIC)'}
                      </span>
                      <div className="font-mono font-bold text-amber-300">
                        {isMinor ? resCode : maskedId}
                      </div>
                    </div>

                    {/* Verification Status */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Status &amp; Authorization</span>
                      <div className={`font-bold ${!isDenied ? 'text-emerald-400' : 'text-red-400'}`}>
                        {statusStr}
                      </div>
                    </div>

                    {/* Vehicle Association & Registered Plates (Feature 9) */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 sm:col-span-2 lg:col-span-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center space-x-1">
                          <CarFront className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Vehicle Association &amp; Authorized Number Plates</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Primary Driver / Host: <strong className="text-white">{resName}</strong>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {detail.registeredPlates && detail.registeredPlates.length > 0 ? (
                          detail.registeredPlates.map((plt: string) => (
                            <span
                              key={plt}
                              className="px-2.5 py-1 rounded-lg bg-slate-950 text-cyan-300 border border-cyan-800 font-mono font-bold text-xs flex items-center space-x-1"
                            >
                              <CarFront className="w-3 h-3 text-cyan-400" />
                              <span>{plt}</span>
                            </span>
                          ))
                        ) : detail.plate ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-cyan-300 border border-cyan-800 font-mono font-bold text-xs flex items-center space-x-1">
                            <CarFront className="w-3 h-3 text-cyan-400" />
                            <span>{detail.plate}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-xs italic">
                            Associated with House {houseNum} (Check vehicle registry)
                          </span>
                        )}
                        {detail.vehicleDescription && (
                          <span className="text-xs text-slate-400 font-mono ml-2">
                            ({detail.vehicleDescription})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Minor Privacy Shield Note */}
                  {isMinor && (
                    <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-[11px] text-purple-200 flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>
                        <strong>Minor Security Protocol:</strong> Under-18 resident data is protected. Physical CNIC/phone details are withheld from gate screens; verification is confirmed via encrypted Resident Code.
                      </span>
                    </div>
                  )}

                  {/* Action Strip */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyResult(null);
                        setVerifyQuery('');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Clear Result
                    </button>

                    {!isDenied ? (
                      <button
                        type="button"
                        onClick={async () => {
                          handleBarrierCommand('OPEN');
                          soundEngine.playSuccessChime();
                          setQrScanSuccessNotice(`Verified Resident ${resName} permitted. Barrier opened!`);
                          try {
                            await api.recordVerificationEntry({
                              type: 'RESIDENT',
                              resident: resName,
                              house: houseNum,
                              gate: currentGate.name,
                              guard: currentGuard.name,
                              visitorName: resName,
                              vehiclePlate: detail.plate || (detail.registeredPlates && detail.registeredPlates[0]),
                              method: verifyResult.verificationMethod || verifyMethod,
                              verifiedIdentifier: verifyQuery,
                              notes: `Verified resident ${resName} permitted entry via ${verifyResult.verificationMethod || verifyMethod}.`
                            });
                          } catch (e) {
                            console.error('Failed to log verification entry:', e);
                          }
                          setTimeout(() => {
                            setQrScanSuccessNotice(null);
                            onRefresh();
                          }, 4000);
                        }}
                        className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950 flex items-center space-x-2 cursor-pointer"
                      >
                        <DoorClosed className="w-4 h-4" />
                        <span>Allow Passage &amp; Open Barrier</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playEmergencyAlarm();
                          setVerifyError(`Entry Denied for ${resName || 'unknown'}. Security alert recorded.`);
                        }}
                        className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950 flex items-center space-x-2 cursor-pointer"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Deny Entry &amp; Alert Security</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB: SECURE AI GUARD ASSISTANT (FEATURE 10) */}
        {activeTab === 'GUARD_AI_ASSISTANT' && (
          <div className="bg-slate-900 border border-blue-800/80 rounded-3xl p-5 sm:p-7 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-950 border border-blue-600 flex items-center justify-center text-blue-300 shadow-inner">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-bold text-white font-mono">
                      SECURE 24/7 AI GATE ASSISTANT
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold">
                      GEMINI POWERED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Real-time AI copilot for gate personnel: Ask about visitor rules, registered vehicles, residents, or security protocols.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('ACTIONS')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Back to Fast Actions
              </button>
            </div>

            {/* AI Query Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block">
                Recommended Guard Inquiries:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Who lives at House 88-C?',
                  'Is vehicle plate LEA-2024 registered or pre-cleared?',
                  'What are the night curfew rules for deliveries?',
                  'What is the under-18 resident verification procedure?',
                  'Are there any active security alerts or watchlist plates?'
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskGuardAI(prompt)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-blue-950/60 text-slate-300 hover:text-blue-200 border border-slate-800 hover:border-blue-700 text-xs font-medium transition-colors cursor-pointer"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            {/* AI Chat History */}
            <div className="space-y-3 max-h-96 overflow-y-auto p-4 rounded-2xl bg-slate-950 border border-slate-800">
              {guardAiHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {guardAiLoading && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-300 text-xs flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Secure AI reasoning gate data...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskGuardAI();
              }}
              className="flex space-x-2"
            >
              <input
                type="text"
                value={guardAiQuery}
                onChange={(e) => setGuardAiQuery(e.target.value)}
                placeholder="Ask Guard AI any question about residents, vehicles, or gate operations..."
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={guardAiLoading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs tracking-wider uppercase font-mono shadow-lg shadow-blue-950 flex items-center space-x-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </button>
            </form>
          </div>
        )}

        {/* INTERACTIVE RESIDENT INTERCOM CALL MODAL */}
        {phoneCallState && phoneCallState.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-lg bg-slate-950 border-2 border-cyan-500/80 rounded-3xl p-6 shadow-2xl shadow-cyan-950/60 space-y-5 text-white">
              {/* Terminal Title Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400">
                    <PhoneCall className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-extrabold uppercase tracking-wider text-cyan-300">
                      GATE INTERCOM TERMINAL • {currentGate.name.toUpperCase()}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Operator: Guard {currentGuard.name} ({currentGuard.badgeNumber})
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                    phoneCallState.status === 'CONNECTED'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 animate-pulse'
                      : phoneCallState.status === 'DIALING'
                      ? 'bg-amber-950 text-amber-300 border-amber-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}>
                    {phoneCallState.status === 'CONNECTED'
                      ? `CONNECTED • ${Math.floor(phoneCallState.durationSec / 60).toString().padStart(2, '0')}:${(phoneCallState.durationSec % 60).toString().padStart(2, '0')}`
                      : phoneCallState.status === 'DIALING'
                      ? 'DIALING VILLA...'
                      : 'CALL ENDED'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhoneCallState(null)}
                    className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Resident Host Identity Display */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950 border-2 border-cyan-500/60 flex items-center justify-center text-cyan-300 flex-shrink-0 shadow-lg shadow-cyan-950">
                  <Building2 className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-lg font-extrabold text-white">
                      {phoneCallState.houseNumber}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ({phoneCallState.block})
                    </span>
                  </div>
                  <h4 className="font-bold text-amber-300 text-sm truncate">
                    {phoneCallState.residentName}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {phoneCallState.contactNumber}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        phoneCallState.activeNumberUsed === 'ALTERNATE'
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      }`}>
                        {phoneCallState.activeNumberUsed === 'ALTERNATE' ? 'ALTERNATE LINE (MANAGEMENT)' : 'PRIMARY LINE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intercom Status & Visual Soundwave */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-center space-y-3">
                {phoneCallState.status === 'DIALING' ? (
                  <div className="space-y-2">
                    <div className="flex justify-center items-center space-x-1 py-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping delay-75" />
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping delay-150" />
                    </div>
                    <p className="text-xs text-amber-300 font-mono">
                      Dialing {phoneCallState.activeNumberUsed === 'ALTERNATE' ? 'Alternate Line' : 'Resident Villa'} Intercom ({phoneCallState.contactNumber})...
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Connecting gate audio terminal to resident's phone
                    </p>
                  </div>
                ) : phoneCallState.status === 'CONNECTED' ? (
                  <div className="space-y-2">
                    {/* Animated sound wave bars */}
                    <div className="flex justify-center items-center space-x-1.5 h-8 py-1">
                      <span className="w-1 bg-emerald-400 rounded-full h-3 animate-pulse" />
                      <span className="w-1 bg-emerald-400 rounded-full h-6 animate-pulse delay-75" />
                      <span className="w-1 bg-emerald-400 rounded-full h-7 animate-pulse delay-150" />
                      <span className="w-1 bg-emerald-400 rounded-full h-4 animate-pulse delay-100" />
                      <span className="w-1 bg-emerald-400 rounded-full h-6 animate-pulse delay-200" />
                      <span className="w-1 bg-emerald-400 rounded-full h-3 animate-pulse" />
                    </div>
                    <p className="text-xs text-emerald-300 font-mono font-bold">
                      LIVE INTERCOM AUDIO CONNECTED
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Speaking with <span className="text-white font-bold">{phoneCallState.residentName}</span> regarding vehicle{' '}
                      <span className="font-mono font-bold text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {plateInput || 'UNK-9941'}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="py-2 text-xs font-mono text-slate-400">
                    Call Terminated
                  </div>
                )}
              </div>

              {/* Alternate Contact Option in Modal */}
              {phoneCallState.alternateContactNumber && (
                <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/60 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-cyan-300 font-bold uppercase tracking-wider flex items-center space-x-1">
                      <PhoneForwarded className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Alternate Contact Provided by Management</span>
                    </span>
                    <span className="text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                      {phoneCallState.alternateContactNumber}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (phoneCallState.activeNumberUsed === 'PRIMARY') {
                          handleSwitchCallToAlternate();
                        } else {
                          const house = houses.find(h => h.houseNumber === phoneCallState.houseNumber);
                          handleSwitchCallToPrimary(house?.contactNumber || '+92-300-5551100');
                        }
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs flex items-center justify-center space-x-1.5 shadow"
                    >
                      <Phone className="w-3 h-3" />
                      <span>
                        {phoneCallState.activeNumberUsed === 'PRIMARY'
                          ? `Redial Alternate: ${phoneCallState.alternateContactNumber}`
                          : 'Switch to Primary Line'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const house = houses.find(h => h.houseNumber === phoneCallState.houseNumber);
                        if (house) handleCallViaWhatsApp(house, phoneCallState.alternateContactNumber);
                      }}
                      className="py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-mono font-bold text-xs flex items-center space-x-1 shadow"
                      title="WhatsApp Alternate Number"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Alt</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Guard Action Response Buttons */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block text-center">
                  Resident Decision on Phone Call:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCallOutcome('APPROVED')}
                    className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950 flex items-center justify-center space-x-2 border border-emerald-400/40 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resident Approved Access</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCallOutcome('DENIED')}
                    className="px-4 py-3 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 font-bold text-xs uppercase tracking-wider border border-red-800 flex items-center justify-center space-x-2 active:scale-95 transition-all"
                  >
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span>Resident Denied Entry</span>
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCallOutcome('NO_ANSWER')}
                    className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono border border-slate-800"
                  >
                    No Answer / Line Busy
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneCallState(null)}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800 flex items-center space-x-1.5"
                  >
                    <PhoneOff className="w-3.5 h-3.5 text-red-400" />
                    <span>Hang Up</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOAST FEEDBACK FOR GUARD CONTACT DISPATCH */}
        {guardContactToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-cyan-400 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-cyan-950/80 flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse flex-shrink-0" />
            <span className="text-xs font-semibold">{guardContactToast}</span>
          </div>
        )}

        {/* MESSENGER / SMS DISPATCH MODAL */}
        {messengerModalOpen && messengerModalData && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-slate-900 border-2 border-purple-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-purple-950/80 space-y-4 my-8">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500 flex items-center justify-center text-purple-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">
                      Message Resident via Messenger / SMS
                    </h3>
                    <p className="text-xs text-slate-400">
                      Host: <strong className="text-purple-300">{messengerModalData.resident.ownerName}</strong> ({messengerModalData.resident.houseNumber})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMessengerModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                  Guest Verification Message Preview:
                </label>
                <textarea
                  rows={5}
                  value={messengerModalData.messageText}
                  onChange={e =>
                    setMessengerModalData({
                      ...messengerModalData,
                      messageText: e.target.value
                    })
                  }
                  className="w-full bg-slate-950 border border-purple-900/60 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-400 font-mono resize-none leading-relaxed"
                />
              </div>

              {/* Message Transmission Actions */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block">
                  Select Dispatch Method:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={`sms:${messengerModalData.resident.contactNumber}?body=${encodeURIComponent(messengerModalData.messageText)}`}
                    onClick={() => {
                      setGuardContactToast(`Opened SMS Messenger for ${messengerModalData.resident.ownerName}`);
                      setTimeout(() => setGuardContactToast(null), 4000);
                    }}
                    className="p-2.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-600 text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Smartphone className="w-4 h-4 text-purple-400" />
                    <span>Open SMS Messenger</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const cleanNumber = formatPhoneForWhatsApp(messengerModalData.resident.contactNumber);
                      window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(messengerModalData.messageText)}`, '_blank');
                      setGuardContactToast(`Dispatched via WhatsApp to ${messengerModalData.resident.ownerName}`);
                      setTimeout(() => setGuardContactToast(null), 4000);
                    }}
                    className="p-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-600 text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Send via WhatsApp</span>
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(messengerModalData.messageText);
                      soundEngine.playSuccessChime();
                      setGuardContactToast('Message copied to clipboard!');
                      setTimeout(() => setGuardContactToast(null), 3000);
                    }}
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center justify-center space-x-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSuccessChime();
                      setPhoneCallVerified(true);
                      setMessengerModalOpen(false);
                    }}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center justify-center space-x-1 shadow-md shadow-emerald-950"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resident Replied YES (Approve)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UNIFIED MULTI-LINE RESIDENT CONTACT MODAL (CALL, WHATSAPP, MESSENGER FOR PRIMARY / ALT / EMERGENCY) */}
        {unifiedContactModal && unifiedContactModal.isOpen && (
          <ResidentContactModal
            isOpen={unifiedContactModal.isOpen}
            onClose={() => setUnifiedContactModal(null)}
            resident={unifiedContactModal.resident}
            gateName={currentGate?.name || 'Main Gate'}
            contextType={unifiedContactModal.contextType}
            visitorName={unifiedContactModal.visitorName}
            vehiclePlate={unifiedContactModal.vehiclePlate}
            initialSelectedLine={unifiedContactModal.initialSelectedLine}
            onActionLogged={(actionSummary) => {
              setGuardContactToast(actionSummary);
              setTimeout(() => setGuardContactToast(null), 4500);
              if (unifiedContactModal.contextType === 'GUEST_CHECK') {
                setPhoneCallVerified(true);
              }
            }}
          />
        )}
      </main>
    </div>
  );
};
