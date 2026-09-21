import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Shield,
  Car,
  UserCheck,
  Package,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  X,
  Copy,
  Check,
  Lock,
  Building2,
  Calendar,
  Share2,
  FileText,
  Trash2,
  ExternalLink,
  ChevronRight,
  LogOut,
  QrCode,
  Radio,
  Sparkles,
  Info,
  Phone,
  User,
  Send,
  Smartphone,
  ShieldCheck,
  Download
} from 'lucide-react';
import { House, Society, RMPNotification, RMPNotificationType, RMPNotificationStatus } from '../types';
import { api } from '../services/api';
import { soundEngine } from '../services/audio';

interface Props {
  society: Society;
  societies: Society[];
  onSelectSociety: (societyId: string) => void;
  onLogout: () => void;
  onNavigateToGuard?: () => void;
  onOpenEmergency?: () => void;
  initialResident?: House | null;
}

export const ResidentMessagesPortal: React.FC<Props> = ({
  society,
  societies,
  onSelectSociety,
  onLogout,
  onNavigateToGuard,
  onOpenEmergency,
  initialResident = null
}) => {
  // Login / Auth State
  const [authenticatedResident, setAuthenticatedResident] = useState<House | null>(initialResident);
  const [authSociety, setAuthSociety] = useState<Society>(society);
  const [societyCodeInput, setSocietyCodeInput] = useState('');
  const [residentNameInput, setResidentNameInput] = useState('');
  const [residentCodeInput, setResidentCodeInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<RMPNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<RMPNotificationType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<RMPNotificationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Notification Form Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formType, setFormType] = useState<RMPNotificationType>('GUEST');
  const [formFullName, setFormFullName] = useState('');
  const [formNIC, setFormNIC] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formVehiclePlate, setFormVehiclePlate] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formSubCategory, setFormSubCategory] = useState('');
  const [formOrderRef, setFormOrderRef] = useState('');
  const [formExpectedDate, setFormExpectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formExpectedTime, setFormExpectedTime] = useState('08:00 PM');
  const [formIsSingleUse, setFormIsSingleUse] = useState(true);
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Digital Pass & Share State
  const [selectedPassNotif, setSelectedPassNotif] = useState<RMPNotification | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Live Simulation Modal: Guard ANPR plate auto-catch view
  const [simulatePlateModal, setSimulatePlateModal] = useState<RMPNotification | null>(null);

  // Initialize or fetch notifications when resident is authenticated
  useEffect(() => {
    if (authenticatedResident) {
      loadNotifications();
    }
  }, [authenticatedResident?.id, authSociety?.id]);

  // ESC key listener to skip/close QR pass modal or any active overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPassNotif) {
          setSelectedPassNotif(null);
        } else if (showCreateModal) {
          setShowCreateModal(false);
        } else if (simulatePlateModal) {
          setSimulatePlateModal(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPassNotif, showCreateModal, simulatePlateModal]);

  const loadNotifications = async () => {
    if (!authenticatedResident) return;
    setLoading(true);
    try {
      const data = await api.getRMPNotifications({
        societyId: authSociety.id,
        houseId: authenticatedResident.houseNumber
      });
      setNotifications(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  // Handle Resident Portal Authentication
  const handleResidentLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const res = await api.authRMP({
        societyNameOrId: authSociety.name,
        societyResidentCode: societyCodeInput.trim(),
        residentCode: residentCodeInput.trim(),
        residentName: residentNameInput.trim()
      });

      if (res.success && res.resident) {
        soundEngine.playSuccessChime();
        setAuthenticatedResident(res.resident);
        if (res.society) {
          setAuthSociety(res.society);
          onSelectSociety(res.society.id);
        }
      }
    } catch (err: any) {
      soundEngine.playWarningSound();
      setAuthError(err.message || 'Invalid credentials. Please verify your Society Code, Resident Name, and Personal Resident Code.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Create New Visitor Notification
  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticatedResident) return;

    if (!formFullName.trim()) {
      setFormError('Please enter the visitor, rider, or technician full name.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload: Partial<RMPNotification> = {
        societyId: authSociety.id,
        residentHouseId: authenticatedResident.id,
        residentHouseNumber: authenticatedResident.houseNumber,
        residentName: authenticatedResident.ownerName,
        residentPhone: authenticatedResident.contactNumber,
        type: formType,
        fullName: formFullName.trim(),
        nic: formNIC.trim(),
        phone: formPhone.trim(),
        vehiclePlate: formVehiclePlate.trim().toUpperCase(),
        purpose: formPurpose.trim() || (formType === 'GUEST' ? 'Personal Visit / Family Guest' : formType === 'DELIVERY' ? 'Parcel/Food Delivery' : 'Maintenance/Service'),
        subCategory: formSubCategory.trim(),
        orderReference: formOrderRef.trim(),
        expectedDate: formExpectedDate,
        expectedTime: formExpectedTime,
        additionalNotes: formNotes.trim()
      };

      const res = await api.createRMPNotification(payload);
      if (res.success && res.notification) {
        // Also synchronize official QR Pass in QR registry for gate scanning
        try {
          await api.createQRPass({
            societyId: authSociety.id,
            passType: (formType === 'RESIDENT' ? 'RESIDENT' : formType === 'DELIVERY' ? 'DELIVERY' : formType === 'SERVICE_STAFF' ? 'SERVICE_STAFF' : formType === 'SOCIAL_WORKER' ? 'SOCIAL_WORKER' : formType === 'OTHER' ? 'OTHER' : 'GUEST') as any,
            entityType: (formType === 'RESIDENT' ? 'RESIDENT' : formType === 'DELIVERY' ? 'DELIVERY' : formType === 'SERVICE_STAFF' ? 'SERVICE_STAFF' : formType === 'SOCIAL_WORKER' ? 'SOCIAL_WORKER' : 'VISITOR') as any,
            holderName: formFullName.trim(),
            holderPhone: formPhone.trim() || undefined,
            hostResidentId: authenticatedResident.id,
            hostResidentName: authenticatedResident.ownerName,
            houseId: authenticatedResident.houseNumber,
            houseNumber: authenticatedResident.houseNumber,
            purpose: payload.purpose || 'Authorized Gate Pass',
            vehiclePlate: formVehiclePlate.trim().toUpperCase() || undefined,
            validFrom: formExpectedDate,
            validUntil: formExpectedDate,
            expiryTime: formExpectedTime,
            isSingleUse: formIsSingleUse,
            status: 'ACTIVE',
            createdBy: authenticatedResident.ownerName
          });
        } catch {
          // Non-blocking fallback
        }

        soundEngine.playSuccessChime();
        setNotifications(prev => [res.notification, ...prev]);
        setShowCreateModal(false);
        // Reset form
        setFormFullName('');
        setFormNIC('');
        setFormPhone('');
        setFormVehiclePlate('');
        setFormPurpose('');
        setFormSubCategory('');
        setFormOrderRef('');
        setFormNotes('');
        setFormIsSingleUse(true);
      }
    } catch (err: any) {
      soundEngine.playWarningSound();
      setFormError(err.message || 'Failed to submit pre-notification.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel / Revoke Pre-Notification
  const handleCancelNotification = async (notifId: string) => {
    if (!window.confirm('Are you sure you want to cancel this visitor pre-clearance?')) return;
    try {
      await api.deleteRMPNotification(notifId);
      soundEngine.playSuccessChime();
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch {
      alert('Failed to cancel pre-clearance.');
    }
  };

  // Build Formatted Gate Pass for WhatsApp, Clipboard, and Native Sharing
  const buildPassShareText = (notif: RMPNotification) => {
    return `*SECURE 24 BY 7 — OFFICIAL VISITOR GATE PASS*
🏛️ *Society:* ${authSociety.name}
👤 *Visitor / Guest:* ${notif.fullName}
🏠 *Host Resident:* ${notif.residentName} (${notif.residentHouseNumber})
🚗 *Vehicle Plate:* ${notif.vehiclePlate || 'WALK-IN (No Vehicle)'}
📅 *Arrival Date:* ${notif.expectedDate}
⏰ *Arrival Time:* ${notif.expectedTime}
🎫 *Gate Pass Code:* RMP-${notif.id.slice(-6).toUpperCase()}
🎯 *Visit Purpose:* ${notif.purpose}${notif.phone ? `\n📱 *Guest Contact:* ${notif.phone}` : ''}${notif.additionalNotes ? `\n📝 *Notes:* "${notif.additionalNotes}"` : ''}
✅ *Status:* PRE-AUTHORIZED BY RESIDENT

━━━━━━━━━━━━━━━━━━━
🛡️ *Gate Guard Express Entry Instructions:*
Show this digital pass or mention Pass Code *RMP-${notif.id.slice(-6).toUpperCase()}* (or scan the QR code) at Gate 1 or Gate 2 for instant verified barrier clearance.`;
  };

  // Copy Digital Gate Pass to Clipboard
  const handleCopyPassDetails = (notif: RMPNotification) => {
    const text = buildPassShareText(notif);
    navigator.clipboard.writeText(text);
    soundEngine.playSuccessChime();
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 3000);
  };

  // Share via WhatsApp
  const handleShareWhatsApp = (notif: RMPNotification, directToGuestNumber: boolean = false) => {
    const text = buildPassShareText(notif);
    const encoded = encodeURIComponent(text);

    let url = `https://api.whatsapp.com/send?text=${encoded}`;
    if (directToGuestNumber && notif.phone) {
      const cleanPhone = notif.phone.replace(/[^0-9]/g, '');
      if (cleanPhone) {
        url = `https://wa.me/${cleanPhone}?text=${encoded}`;
      }
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    soundEngine.playSuccessChime();
  };

  // Native Share (Mobile / Tablet / Safari / Chrome)
  const handleNativeShare = async (notif: RMPNotification) => {
    const text = buildPassShareText(notif);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Gate Pass for ${notif.fullName} - ${authSociety.name}`,
          text: text,
        });
        soundEngine.playSuccessChime();
      } catch {
        // user aborted or dismissed share dialog
      }
    } else {
      handleCopyPassDetails(notif);
    }
  };

  // Copy Resident Access Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    soundEngine.playSuccessChime();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter(n => {
    if (filterType !== 'ALL' && n.type !== filterType) return false;
    if (filterStatus !== 'ALL' && n.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = n.fullName.toLowerCase().includes(q);
      const matchPlate = n.vehiclePlate?.toLowerCase().includes(q);
      const matchPhone = n.phone?.toLowerCase().includes(q);
      const matchNIC = n.nic?.toLowerCase().includes(q);
      const matchPurpose = n.purpose.toLowerCase().includes(q);
      if (!matchName && !matchPlate && !matchPhone && !matchNIC && !matchPurpose) return false;
    }
    return true;
  });

  // Calculate quick metrics
  const upcomingCount = notifications.filter(n => n.status === 'UPCOMING').length;
  const insideCount = notifications.filter(n => n.status === 'INSIDE_SOCIETY' || n.status === 'ARRIVED').length;
  const completedCount = notifications.filter(n => n.status === 'EXITED').length;

  // ----------------------------------------------------
  // VIEW 1: RESIDENT AUTHENTICATION SCREEN
  // ----------------------------------------------------
  if (!authenticatedResident) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white relative overflow-hidden">
        {/* Background Visual Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(#2e1065_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30 border border-purple-400/30">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-wider text-slate-100 text-lg uppercase font-mono">
                RMP — Resident Messages Portal
              </span>
              <p className="text-xs text-slate-400 font-medium">
                Visitor Pre-Clearance &amp; Gate Fast-Track Authorization
              </p>
            </div>
          </div>

          <button
            id="btn-rmp-back-main"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Return to Main Portals</span>
          </button>
        </header>

        {/* Main Login Card */}
        <main className="relative z-10 max-w-xl mx-auto w-full px-6 py-10 flex-1 flex flex-col justify-center">
          <div className="bg-slate-900/90 border border-purple-900/50 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-wider text-purple-300 uppercase">
                  Resident Access Verification
                </span>
              </div>
              <span className="text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded">
                MULTI-TIER RESIDENT VERIFICATION
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Enter Resident Portal
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Provide your official <strong>Society Resident Access Code</strong>, registered <strong>Resident Name</strong>, and your personal <strong>Resident Access Code</strong> to connect to your residence portal.
              </p>
            </div>

            {authError && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-start space-x-3 shadow-lg">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Authentication Verification Failed</p>
                  <p className="text-[11px] leading-relaxed text-red-300">{authError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleResidentLogin} className="space-y-5">
              {/* 1. Society Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  1. Society Name
                </label>
                <select
                  id="rmp-society-select"
                  value={authSociety.id}
                  onChange={e => {
                    const found = societies.find(s => s.id === e.target.value);
                    if (found) {
                      setAuthSociety(found);
                      onSelectSociety(found.id);
                      setAuthError(null);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {societies.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Society Resident Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                    2. Society Resident Access Code
                  </label>
                  <span className="text-[10px] text-purple-400 font-mono">
                    Society-Level Verification
                  </span>
                </div>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    id="rmp-society-code-input"
                    type="text"
                    required
                    placeholder="e.g. aeechsRsdnt10000"
                    value={societyCodeInput}
                    onChange={e => setSocietyCodeInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center space-x-1">
                  <Info className="w-3 h-3 text-purple-400" />
                  <span>Code for {authSociety.name}: <strong className="text-purple-300 font-mono">{authSociety.residentAccessCode || 'aeechsRsdnt10000'}</strong></span>
                </p>
              </div>

              {/* 3. Enter Resident Name */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                    3. Enter Resident Name
                  </label>
                  <span className="text-[10px] text-purple-400 font-mono">
                    Allotment Record Name
                  </span>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    id="rmp-resident-name-input"
                    type="text"
                    required
                    placeholder="e.g. Babar Gauri"
                    value={residentNameInput}
                    onChange={e => setResidentNameInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Enter your full resident name as registered with Society Management.
                </p>
              </div>

              {/* 4. Personal Resident Access Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                    4. Personal Resident Access Code
                  </label>
                  <span className="text-[10px] text-purple-400 font-mono">
                    Unique to each residence
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    id="rmp-resident-code-input"
                    type="text"
                    required
                    placeholder="e.g. BG-8821"
                    value={residentCodeInput}
                    onChange={e => setResidentCodeInput(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Issued by Society Management. Enter your personal resident key.
                </p>
              </div>

              <button
                id="btn-rmp-submit-login"
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-purple-950 flex items-center justify-center space-x-2"
              >
                {authLoading ? (
                  <span>Verifying Resident Credentials...</span>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Connect to RMP Portal</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </main>

        <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 px-6 py-3 text-center text-xs text-slate-500 font-mono">
          SECURE 24 BY 7 • RESIDENT MESSAGES PORTAL (RMP) • END-TO-END GATE CLEARANCE PROTOCOL
        </footer>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: AUTHENTICATED RESIDENT DASHBOARD
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40 border border-purple-400/30">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wider text-slate-100 text-lg uppercase font-mono">
                RMP PORTAL
              </span>
              <span className="text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700/60 px-2 py-0.5 rounded">
                RESIDENT ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium truncate">
              {authSociety.name} • {authenticatedResident.houseNumber} ({authenticatedResident.ownerName})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Society & Personal Access Code Badges */}
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono">
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Soc Code:</span>
              <span className="font-bold text-cyan-300">{authenticatedResident.societyResidentAccessCode || authSociety.residentAccessCode || 'DEFAULT'}</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-purple-900/80 text-purple-200">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-400">Personal Code:</span>
              <span className="font-extrabold text-white">{authenticatedResident.rmpCode}</span>
              <button
                type="button"
                onClick={() => handleCopyCode(authenticatedResident.rmpCode || '')}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
                title="Copy personal resident code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Direct Switch to Guard Portal to test */}
          {onNavigateToGuard && (
            <button
              id="btn-rmp-view-guard"
              onClick={onNavigateToGuard}
              className="px-3 py-2 rounded-lg border border-cyan-700/80 bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              title="Switch to Gate Guard View to verify ANPR detection"
            >
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Gate Guard Console</span>
            </button>
          )}

          {/* Logout from RMP */}
          <button
            id="btn-rmp-logout"
            onClick={() => {
              setAuthenticatedResident(null);
              soundEngine.playSuccessChime();
            }}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all"
            title="Log out of Resident Messages Portal"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-6">
        {/* Top Resident Welcome & Action Banner */}
        <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-800/40 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white">
                Welcome, {authenticatedResident.ownerName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-900/80 text-purple-200 border border-purple-600/60 text-xs font-semibold">
                {authenticatedResident.houseNumber}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Pre-notify society security guards about upcoming guests, deliveries, or service staff. When visitors arrive, security guards enter their vehicle plate for <strong>instant automatic clearance</strong> without delays.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              id="btn-new-pre-notification"
              onClick={() => {
                setFormType('GUEST');
                setShowCreateModal(true);
                soundEngine.playSuccessChime();
              }}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-purple-950 flex items-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Pre-Clear Visitor / Delivery / Staff</span>
            </button>
          </div>
        </div>

        {/* ORDERED RESIDENT PROFILE BAR: Name, Primary Number, Alternate Number, House/Block, Vehicles, Access Codes */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg backdrop-blur-md">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 text-xs">
            {/* 1. RESIDENT NAME */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 flex items-center space-x-1">
                <User className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">1. Resident</span>
              </span>
              <div className="font-bold text-white text-xs sm:text-sm truncate" title={authenticatedResident.ownerName}>
                {authenticatedResident.ownerName}
              </div>
            </div>

            {/* 2. PRIMARY NUMBER (SHRUNK & CRISP) */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-emerald-900/70 space-y-0.5">
              <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-400 flex items-center space-x-1">
                <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">2. Primary</span>
              </span>
              <div className="font-mono font-bold text-emerald-300 text-[11px] sm:text-xs select-all break-all leading-tight">
                {authenticatedResident.contactNumber || 'N/A'}
              </div>
            </div>

            {/* 3. ALTERNATE NUMBER (SHRUNK & CRISP) */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-cyan-900/70 space-y-0.5">
              <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider font-bold text-cyan-400 flex items-center space-x-1">
                <Phone className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">3. Alternate</span>
              </span>
              <div className="font-mono font-bold text-cyan-300 text-[11px] sm:text-xs select-all break-all leading-tight">
                {authenticatedResident.alternateContactNumber || (
                  <span className="text-slate-500 font-normal italic text-[10px]">None</span>
                )}
              </div>
            </div>

            {/* HOUSE & BLOCK */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 flex items-center space-x-1">
                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">Unit &amp; Block</span>
              </span>
              <div className="font-mono font-bold text-white text-xs sm:text-sm">
                {authenticatedResident.houseNumber} <span className="text-cyan-400 font-normal text-[10px]">({authenticatedResident.block})</span>
              </div>
            </div>

            {/* REGISTERED VEHICLES */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 flex items-center space-x-1">
                <Car className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">Plates ({authenticatedResident.registeredPlates?.length || 0})</span>
              </span>
              <div className="flex flex-wrap gap-1">
                {(authenticatedResident.registeredPlates?.length || 0) > 0 ? (
                  authenticatedResident.registeredPlates?.slice(0, 2).map(p => (
                    <span key={p} className="px-1 py-0.2 rounded bg-slate-900 border border-cyan-800 text-[9px] font-mono font-bold text-cyan-300 select-all">
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[10px] italic">None</span>
                )}
              </div>
            </div>

            {/* ACCESS CODES */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-purple-950/40 border border-purple-900/80 space-y-0.5">
              <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider font-bold text-purple-300 flex items-center space-x-1">
                <Lock className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="truncate">Gate Codes</span>
              </span>
              <div className="text-[10px] font-mono space-y-0.5">
                <div className="text-slate-400 truncate">
                  Soc: <span className="text-cyan-300 font-bold select-all">{authenticatedResident.societyResidentAccessCode || society.residentAccessCode || 'DEFAULT'}</span>
                </div>
                <div className="text-slate-400 truncate">
                  PIN: <span className="text-purple-200 font-extrabold select-all">{authenticatedResident.rmpCode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-slate-400 font-medium mb-1">Total Pre-Clearances</div>
            <div className="text-2xl font-extrabold text-white font-mono">{notifications.length}</div>
          </div>
          <div className="bg-slate-900/80 border border-amber-900/40 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-amber-400 font-medium mb-1 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Upcoming at Gate</span>
            </div>
            <div className="text-2xl font-extrabold text-amber-300 font-mono">{upcomingCount}</div>
          </div>
          <div className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-emerald-400 font-medium mb-1 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Currently Inside Society</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-300 font-mono">{insideCount}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-slate-400 font-medium mb-1">Completed / Exited</div>
            <div className="text-2xl font-extrabold text-slate-300 font-mono">{completedCount}</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto w-full md:w-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === 'ALL'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Types ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType('GUEST')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap flex items-center space-x-1 transition-all ${
                filterType === 'GUEST'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-3 h-3" />
              <span>Guests</span>
            </button>
            <button
              onClick={() => setFilterType('DELIVERY')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap flex items-center space-x-1 transition-all ${
                filterType === 'DELIVERY'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3 h-3" />
              <span>Deliveries</span>
            </button>
            <button
              onClick={() => setFilterType('SERVICE_STAFF')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap flex items-center space-x-1 transition-all ${
                filterType === 'SERVICE_STAFF'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wrench className="w-3 h-3" />
              <span>Service Staff</span>
            </button>
          </div>

          {/* Search Input & Status Filter */}
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search visitor, plate, phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="UPCOMING">Upcoming / Scheduled</option>
              <option value="INSIDE_SOCIETY">Inside Society</option>
              <option value="EXITED">Exited</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Notifications Grid / List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-purple-950/80 border border-purple-800/60 mx-auto flex items-center justify-center text-purple-400">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-white">No Pre-Notifications Found</h3>
              <p className="text-xs text-slate-400">
                {searchQuery
                  ? `No records match "${searchQuery}". Clear your search query to see all visitors.`
                  : 'You have not submitted any visitor or delivery notifications yet. Click the button below to add your first guest.'}
              </p>
            </div>
            <button
              onClick={() => {
                setFormType('GUEST');
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wide shadow-md transition-all inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Pre-Clear a Guest Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNotifications.map(notif => {
              const isUpcoming = notif.status === 'UPCOMING';
              const isInside = notif.status === 'INSIDE_SOCIETY' || notif.status === 'ARRIVED';
              const isExited = notif.status === 'EXITED';
              const isCancelled = notif.status === 'CANCELLED';

              return (
                <div
                  key={notif.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-purple-600/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-4">
                    {/* Top Type & Status Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          notif.type === 'GUEST'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                            : notif.type === 'DELIVERY'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        }`}>
                          {notif.type === 'GUEST' && <Car className="w-4 h-4" />}
                          {notif.type === 'DELIVERY' && <Package className="w-4 h-4" />}
                          {notif.type === 'SERVICE_STAFF' && <Wrench className="w-4 h-4" />}
                          {notif.type === 'OTHER' && <UserCheck className="w-4 h-4" />}
                        </span>
                        <div>
                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            {notif.type.replace('_', ' ')}
                          </div>
                          <div className="text-xs font-bold text-white truncate max-w-[150px]">
                            {notif.subCategory || (notif.type === 'GUEST' ? 'Personal Guest' : notif.type === 'DELIVERY' ? 'Parcel/Food' : 'Maintenance')}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center space-x-1 ${
                        isUpcoming
                          ? 'bg-amber-950/90 text-amber-300 border border-amber-700/60'
                          : isInside
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-600/60 animate-pulse'
                          : isExited
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : 'bg-red-950/80 text-red-300 border border-red-800/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isUpcoming ? 'bg-amber-400' : isInside ? 'bg-emerald-400' : isExited ? 'bg-slate-400' : 'bg-red-400'
                        }`} />
                        <span>{isInside ? 'INSIDE SOCIETY' : notif.status}</span>
                      </span>
                    </div>

                    {/* Visitor Main Details */}
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                        {notif.fullName}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {notif.purpose}
                      </p>
                    </div>

                    {/* Key Attributes Box */}
                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs">
                      {/* Vehicle Number Plate */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center space-x-1.5">
                          <Car className="w-3.5 h-3.5 text-slate-500" />
                          <span>Vehicle Plate:</span>
                        </span>
                        <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {notif.vehiclePlate || 'WALK-IN (NO CAR)'}
                        </span>
                      </div>

                      {/* Phone */}
                      {notif.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center space-x-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>Phone:</span>
                          </span>
                          <span className="font-mono text-slate-300">{notif.phone}</span>
                        </div>
                      )}

                      {/* NIC / CNIC */}
                      {notif.nic && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center space-x-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>CNIC / NIC:</span>
                          </span>
                          <span className="font-mono text-slate-300">{notif.nic}</span>
                        </div>
                      )}

                      {/* Expected Schedule */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Scheduled:</span>
                        </span>
                        <span className="font-mono font-semibold text-purple-300">
                          {notif.expectedDate} • {notif.expectedTime}
                        </span>
                      </div>

                      {/* Admitted Info if inside */}
                      {notif.admittedAt && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400">
                          <span className="flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Gate Admittance:</span>
                          </span>
                          <span className="font-mono">{notif.admittedAt}</span>
                        </div>
                      )}
                    </div>

                    {/* Additional Notes / Guard Instructions */}
                    {notif.additionalNotes && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                        "{notif.additionalNotes}"
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {/* Share Digital Pass & QR Code */}
                    <button
                      type="button"
                      onClick={() => setSelectedPassNotif(notif)}
                      className="px-3 py-1.5 rounded-lg bg-purple-950/90 hover:bg-purple-900 border border-purple-800/70 text-purple-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                      title="Open QR Code & Share via WhatsApp or Link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share QR Code &amp; Pass</span>
                    </button>

                    {/* Test ANPR Simulation Button */}
                    {notif.vehiclePlate && isUpcoming && (
                      <button
                        type="button"
                        onClick={() => setSimulatePlateModal(notif)}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 text-xs font-semibold flex items-center space-x-1 transition-all"
                        title="Simulate Guard entering this plate at gate"
                      >
                        <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                        <span>Simulate Gate Scan</span>
                      </button>
                    )}

                    {/* Cancel Pre-clearance */}
                    {isUpcoming && (
                      <button
                        type="button"
                        onClick={() => handleCancelNotification(notif.id)}
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-950/80 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-800/60 transition-all"
                        title="Cancel this pre-clearance"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 px-6 py-4 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>RMP — RESIDENT MESSAGES PORTAL • {authSociety.name}</span>
        <span className="text-purple-400/80">AUTOMATIC ANPR GATE VERIFICATION ENABLED</span>
      </footer>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: CREATE NEW VISITOR PRE-NOTIFICATION         */}
      {/* ---------------------------------------------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-purple-900/60 w-full max-w-2xl rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6 text-left relative my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-700/60 flex items-center justify-center text-purple-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Pre-Notify Security Guard at Society Gate
                  </h3>
                  <p className="text-xs text-slate-400">
                    Host Residence: <strong className="text-white">{authenticatedResident.houseNumber}</strong> ({authenticatedResident.ownerName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Type Selector Tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Select Visitor Category:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('GUEST');
                    setFormPurpose('Personal Guest / Family Visit');
                    setFormSubCategory('Family Guest');
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    formType === 'GUEST'
                      ? 'bg-purple-950 border-purple-500 text-white shadow-md shadow-purple-950'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Car className={`w-4 h-4 mb-1.5 ${formType === 'GUEST' ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold leading-tight">1. Guest</span>
                  <span className="text-[10px] text-slate-400">Family &amp; Social</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormType('DELIVERY');
                    setFormPurpose('Parcel/Food Delivery');
                    setFormSubCategory('FoodPanda Rider');
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    formType === 'DELIVERY'
                      ? 'bg-purple-950 border-purple-500 text-white shadow-md shadow-purple-950'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Package className={`w-4 h-4 mb-1.5 ${formType === 'DELIVERY' ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold leading-tight">2. Delivery</span>
                  <span className="text-[10px] text-slate-400">Rider / Courier</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormType('SERVICE_STAFF');
                    setFormPurpose('Home Maintenance / Repair');
                    setFormSubCategory('Electrician / AC Tech');
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    formType === 'SERVICE_STAFF'
                      ? 'bg-purple-950 border-purple-500 text-white shadow-md shadow-purple-950'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Wrench className={`w-4 h-4 mb-1.5 ${formType === 'SERVICE_STAFF' ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold leading-tight">3. Staff</span>
                  <span className="text-[10px] text-slate-400">Maintenance</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormType('SOCIAL_WORKER');
                    setFormPurpose('Community / Social Visit');
                    setFormSubCategory('Health / Community Worker');
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    formType === 'SOCIAL_WORKER'
                      ? 'bg-purple-950 border-purple-500 text-white shadow-md shadow-purple-950'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <ShieldCheck className={`w-4 h-4 mb-1.5 ${formType === 'SOCIAL_WORKER' ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold leading-tight">4. Social Worker</span>
                  <span className="text-[10px] text-slate-400">Health / NGO</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormType('RESIDENT');
                    setFormPurpose('Resident Living Member Pass');
                    setFormSubCategory('Family Resident');
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    formType === 'RESIDENT'
                      ? 'bg-purple-950 border-purple-500 text-white shadow-md shadow-purple-950'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <User className={`w-4 h-4 mb-1.5 ${formType === 'RESIDENT' ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold leading-tight">5. Resident</span>
                  <span className="text-[10px] text-slate-400">Living Member</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormType('OTHER');
                    setFormPurpose('General Official Visit');
                    setFormSubCategory('Official / Other');
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    formType === 'OTHER'
                      ? 'bg-purple-950 border-purple-500 text-white shadow-md shadow-purple-950'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <UserCheck className={`w-4 h-4 mb-1.5 ${formType === 'OTHER' ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold leading-tight">6. Other</span>
                  <span className="text-[10px] text-slate-400">Utility / Survey</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateNotification} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Aslam"
                    value={formFullName}
                    onChange={e => setFormFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>

                {/* Car / Vehicle Number Plate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Car / Bike Number Plate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LEA-2024 or ICT-5511"
                    value={formVehiclePlate}
                    onChange={e => setFormVehiclePlate(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono uppercase focus:outline-none"
                  />
                </div>
              </div>

              {/* ANPR Note Banner */}
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-start space-x-2.5 text-xs text-purple-200">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Auto-Gate Intelligence:</strong> When the guard enters this vehicle plate at the barrier, the app automatically catches this pre-clearance data and grants express gate access.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NIC / CNIC */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    NIC / CNIC Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 35202-8472910-1"
                    value={formNIC}
                    onChange={e => setFormNIC(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +92-300-4455667"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Expected Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Expected Arrival Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formExpectedDate}
                    onChange={e => setFormExpectedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>

                {/* Expected Time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Expected Arrival Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 08:00 PM"
                    value={formExpectedTime}
                    onChange={e => setFormExpectedTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Purpose & Sub-Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Purpose / Visit Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Personal Guest / Family Dinner"
                    value={formPurpose}
                    onChange={e => setFormPurpose(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Company / Sub-category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FoodPanda / Bykea / Electrician / Family"
                    value={formSubCategory}
                    onChange={e => setFormSubCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Single-Use vs Multi-Use Option */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300 font-mono">
                  Pass Validity &amp; Usage Mode:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    formIsSingleUse ? 'bg-purple-950/60 border-purple-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="passUsage"
                      checked={formIsSingleUse}
                      onChange={() => setFormIsSingleUse(true)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div className="text-xs">
                      <strong className="block text-white">Single-Use Pass</strong>
                      <span className="text-[10px] text-slate-400">Expires after single entry/exit</span>
                    </div>
                  </label>

                  <label className={`flex items-center space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    !formIsSingleUse ? 'bg-purple-950/60 border-purple-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="passUsage"
                      checked={!formIsSingleUse}
                      onChange={() => setFormIsSingleUse(false)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div className="text-xs">
                      <strong className="block text-white">Multi-Use Pass</strong>
                      <span className="text-[10px] text-slate-400">Valid for multiple entries today</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Additional Notes for Gate Officer */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                  Additional Notes / Guard Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Driving dark grey Honda Civic. Please allow direct passage to House 88-C driveway."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  id="btn-submit-rmp-notification"
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-purple-950 flex items-center space-x-2"
                >
                  {submitting ? (
                    <span>Submitting to Gate Guards...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authorize Pre-Clearance</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: DIGITAL VISITOR GATE PASS & QR CODE SHARE   */}
      {/* ---------------------------------------------------- */}
      {selectedPassNotif && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPassNotif(null);
          }}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-purple-800/80 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-left relative my-auto">
            {/* Header: Title and Clear Cross (✕) Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-950/90 border border-purple-700/60 text-purple-300 flex items-center justify-center shrink-0 shadow-inner">
                  <QrCode className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                    <span>Digital Visitor Gate Pass &amp; QR Code</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Share directly with guest via WhatsApp or copy invitation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPassNotif(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                title="Close &amp; Skip (Esc)"
                aria-label="Close and Skip"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pass Visual Card */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/90 border border-purple-700/60 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-inner">
              <div className="flex items-center justify-between pb-2.5 border-b border-purple-900/40">
                <div>
                  <div className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                    Secure 24 by 7 • Electronic Gate Pass
                  </div>
                  <div className="text-sm font-bold text-white">{authSociety.name}</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 text-[10px] font-mono font-bold border border-purple-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>RMP VERIFIED</span>
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Visitor / Guest:</span>
                  <span className="font-bold text-white text-sm">{selectedPassNotif.fullName}</span>
                </div>
                {selectedPassNotif.phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Guest Phone:</span>
                    <span className="font-mono text-cyan-300">{selectedPassNotif.phone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Host Resident:</span>
                  <span className="font-semibold text-white">
                    {selectedPassNotif.residentName} ({selectedPassNotif.residentHouseNumber})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Vehicle Number Plate:</span>
                  <span className="font-mono font-bold text-purple-300 bg-slate-950 px-2 py-0.5 rounded border border-purple-800">
                    {selectedPassNotif.vehiclePlate || 'WALK-IN'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Valid Arrival:</span>
                  <span className="font-mono text-slate-300">
                    {selectedPassNotif.expectedDate} at {selectedPassNotif.expectedTime}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Gate Pass Code:</span>
                  <span className="font-mono font-extrabold text-amber-300 text-sm tracking-wide bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
                    RMP-{selectedPassNotif.id.slice(-6).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="pt-3 border-t border-purple-900/40 text-center">
                <div className="inline-block p-3 rounded-xl bg-white shadow-xl mb-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      `RMP-${selectedPassNotif.id.slice(-6).toUpperCase()}`
                    )}`}
                    alt="Digital Visitor QR Pass"
                    className="w-36 h-36 mx-auto rounded"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-[9px] font-mono font-bold text-slate-800 mt-1 uppercase tracking-wider">
                    RMP-{selectedPassNotif.id.slice(-6).toUpperCase()}
                  </div>
                </div>
                <p className="text-[10px] text-purple-300/90 font-mono">
                  Guards scan this QR code or enter code <span className="text-amber-300 font-bold">RMP-{selectedPassNotif.id.slice(-6).toUpperCase()}</span> at barrier
                </p>
              </div>
            </div>

            {/* Sharing Options Section */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-mono text-slate-400 uppercase font-bold flex items-center justify-between">
                <span>Share Digital Pass:</span>
                <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp Enabled</span>
                </span>
              </div>

              {/* 1. Share via WhatsApp (Direct to Guest Phone if available) */}
              {selectedPassNotif.phone ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(selectedPassNotif, true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 cursor-pointer"
                    title={`Send WhatsApp message directly to ${selectedPassNotif.phone}`}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0 fill-current" />
                    <span className="truncate">WhatsApp {selectedPassNotif.fullName.split(' ')[0]}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(selectedPassNotif, false)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 hover:text-white font-semibold text-xs tracking-wide transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    title="Choose any WhatsApp contact or group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>Any WhatsApp Chat</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedPassNotif, false)}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 cursor-pointer"
                  title="Open WhatsApp with pre-filled gate pass"
                >
                  <MessageSquare className="w-4 h-4 shrink-0 fill-current" />
                  <span>Share via WhatsApp</span>
                </button>
              )}

              {/* 2. Copy Invitation Text & Secondary Sharing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPassDetails(selectedPassNotif)}
                  className="w-full py-2 rounded-xl bg-purple-900/70 hover:bg-purple-800 text-purple-200 hover:text-white font-semibold text-xs border border-purple-700/60 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {copiedPass ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300 font-bold">Pass Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Pass Text</span>
                    </>
                  )}
                </button>

                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
                  <button
                    type="button"
                    onClick={() => handleNativeShare(selectedPassNotif)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>More Share Options</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCopyCode(`RMP-${selectedPassNotif.id.slice(-6).toUpperCase()}`)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-300 font-bold">Code Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Copy Code Only</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 3. Save / Download QR Image */}
              <button
                type="button"
                onClick={async () => {
                  const passCode = `RMP-${selectedPassNotif.id.slice(-6).toUpperCase()}`;
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(passCode)}`;
                  try {
                    const res = await fetch(qrUrl);
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `QR_PASS_${passCode}_${selectedPassNotif.fullName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    soundEngine.playSuccessChime();
                  } catch {
                    window.open(qrUrl, '_blank');
                  }
                }}
                className="w-full py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 text-cyan-200 font-semibold text-xs border border-cyan-800/70 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                title="Save QR Code image directly to your device"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Save QR Code Image (PNG)</span>
              </button>
            </div>

            {/* Bottom Actions: Cancel / Skip Option */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Press Esc or Cancel to skip
              </span>

              <button
                type="button"
                onClick={() => setSelectedPassNotif(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Cancel and return to RMP Portal"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
                <span>Cancel / Skip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: LIVE SIMULATION OF GUARD ANPR AUTO-CATCH    */}
      {/* ---------------------------------------------------- */}
      {simulatePlateModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSimulatePlateModal(null);
          }}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-cyan-700/80 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 text-left relative my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Gate Guard ANPR Live Catch Simulation</h3>
              </div>
              <button
                type="button"
                onClick={() => setSimulatePlateModal(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                title="Close Simulation (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-700/60 text-xs text-cyan-200 space-y-1">
              <p className="font-bold flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>RMP Pre-Authorization Automatically Caught!</span>
              </p>
              <p className="text-[11px] text-cyan-300/80">
                This is exactly what the security guard sees when vehicle <strong>{simulatePlateModal.vehiclePlate}</strong> arrives at Gate 1:
              </p>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Scanned Number Plate:</span>
                <span className="font-bold text-cyan-300 text-sm">{simulatePlateModal.vehiclePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Visitor Full Name:</span>
                <span className="text-white font-sans font-bold">{simulatePlateModal.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination Residence:</span>
                <span className="text-emerald-400 font-bold">{simulatePlateModal.residentHouseNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Authorized By Resident:</span>
                <span className="text-slate-200 font-sans">{simulatePlateModal.residentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Visitor Phone:</span>
                <span className="text-slate-200">{simulatePlateModal.phone || 'Provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Visitor CNIC:</span>
                <span className="text-slate-200">{simulatePlateModal.nic || 'Verified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Time:</span>
                <span className="text-purple-300">{simulatePlateModal.expectedTime} Today</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gate Action:</span>
                <span className="text-emerald-400 font-bold">1-CLICK EXPRESS ENTRY ADMIT</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSimulatePlateModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close Simulation
              </button>
              {onNavigateToGuard && (
                <button
                  type="button"
                  onClick={() => {
                    setSimulatePlateModal(null);
                    onNavigateToGuard();
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-cyan-950"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Go to Gate Guard Console Now</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
