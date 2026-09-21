import React, { useState } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneForwarded,
  MessageCircle,
  MessageSquare,
  Smartphone,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Building2,
  Send,
  AlertOctagon,
  Edit3
} from 'lucide-react';
import { House } from '../types';
import { soundEngine } from '../services/audio';

export type ContactContextType =
  | 'GUEST_CHECK'
  | 'DELIVERY'
  | 'CAB'
  | 'EMERGENCY'
  | 'GENERAL'
  | 'VEHICLE_CLEARANCE';

export type ContactLineType = 'PRIMARY' | 'ALTERNATE' | 'EMERGENCY';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resident: House;
  callerRole: 'GUARD' | 'MANAGEMENT';
  contextType?: ContactContextType;
  visitorName?: string;
  vehiclePlate?: string;
  gateName?: string;
  societyName?: string;
  initialSelectedLine?: ContactLineType;
  onStartIntercomCall?: (targetHouse: House, numberToUse: string, lineType: ContactLineType) => void;
  onVerificationSuccess?: (note: string) => void;
  onEditResident?: (targetHouse: House) => void;
}

export const ResidentContactModal: React.FC<Props> = ({
  isOpen,
  onClose,
  resident,
  callerRole,
  contextType = 'GUEST_CHECK',
  visitorName = '',
  vehiclePlate = '',
  gateName = 'Main Security Gate',
  societyName = 'Housing Society',
  initialSelectedLine = 'PRIMARY',
  onStartIntercomCall,
  onVerificationSuccess,
  onEditResident
}) => {
  const [selectedLine, setSelectedLine] = useState<ContactLineType>(() => {
    if (initialSelectedLine === 'ALTERNATE' && resident.alternateContactNumber) return 'ALTERNATE';
    if (initialSelectedLine === 'EMERGENCY' && resident.emergencyContact) return 'EMERGENCY';
    return 'PRIMARY';
  });

  const [copiedText, setCopiedText] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Helper to clean and format phone for WhatsApp and international dialing
  const formatPhoneForWhatsApp = (rawPhone: string) => {
    let cleaned = rawPhone.replace(/\D/g, '');
    if (cleaned.startsWith('92')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      cleaned = '92' + cleaned.substring(1);
    }
    return cleaned || '923001234567';
  };

  // Generate intelligent context-aware message templates
  const getDefaultMessage = () => {
    const vName = visitorName.trim() || 'A visitor / guest';
    const plate = vehiclePlate.trim().toUpperCase();
    const plateText = plate ? ` with vehicle plate [${plate}]` : '';

    if (callerRole === 'MANAGEMENT') {
      if (contextType === 'EMERGENCY') {
        return `🚨 URGENT EMERGENCY NOTICE - ${societyName} Management\n\nDear ${resident.ownerName} (${resident.houseNumber}),\nAn urgent emergency situation requires your immediate attention regarding your residence. Please contact the Society Management Office or Central Security immediately at the earliest.\n\nTime: ${new Date().toLocaleTimeString()}\nSociety Command Office`;
      }
      return `Assalam-o-Alaikum / Hello ${resident.ownerName} (${resident.houseNumber}),\nThis is ${societyName} Management Office reaching out regarding residence matters. Please get in touch with us at your earliest convenience.\nThank you.`;
    }

    // Guard context
    switch (contextType) {
      case 'EMERGENCY':
        return `🚨 EMERGENCY ALERT: Security Gate (${gateName}) - ${societyName}\nDear ${resident.ownerName} (${resident.houseNumber}),\nPlease be informed of an urgent security / safety alert regarding your premises. Please contact the gate post immediately.`;
      case 'DELIVERY':
        return `Assalam-o-Alaikum / Hello ${resident.ownerName},\nThis is Security Guard at ${gateName}.\nA delivery rider (${vName})${plateText} is at the security gate with a parcel for your residence (${resident.houseNumber}).\nKindly confirm if we should allow them entry. Reply YES to approve or NO to hold at gate.`;
      case 'CAB':
        return `Assalam-o-Alaikum / Hello ${resident.ownerName},\nThis is Security Guard at ${gateName}.\nA ride / cab driver (${vName})${plateText} has arrived at the gate for pickup / drop-off at your residence (${resident.houseNumber}).\nPlease confirm if this ride was requested by you. Reply YES to approve or NO to deny.`;
      case 'VEHICLE_CLEARANCE':
        return `Assalam-o-Alaikum / Hello ${resident.ownerName},\nThis is Security Guard at ${gateName}.\nA vehicle${plateText} driven by ${vName} is requesting entry to visit your residence (${resident.houseNumber}).\nPlease confirm if you have authorized this vehicle. Reply YES to permit or NO to deny.`;
      case 'GUEST_CHECK':
      default:
        return `Assalam-o-Alaikum / Hello ${resident.ownerName},\nThis is Security Guard at ${gateName} (${societyName}).\nYour guest ${vName}${plateText} is at the security gate requesting entry to visit your residence (${resident.houseNumber}).\nPlease confirm if we should allow entry: Reply YES to permit or NO to deny.\nThank you.`;
    }
  };

  const [messageText, setMessageText] = useState(getDefaultMessage);

  if (!isOpen) return null;

  // Retrieve numbers
  const primaryNumber = resident.contactNumber || '';
  const alternateNumber = resident.alternateContactNumber || '';
  const emergencyNumber = resident.emergencyContact || '';

  const getNumberForLine = (line: ContactLineType): string => {
    switch (line) {
      case 'PRIMARY':
        return primaryNumber;
      case 'ALTERNATE':
        return alternateNumber;
      case 'EMERGENCY':
        return emergencyNumber;
    }
  };

  const activeNumber = getNumberForLine(selectedLine) || primaryNumber;

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // 1. Direct Phone / Intercom Call
  const handlePhoneCall = (line: ContactLineType = selectedLine) => {
    soundEngine.playSuccessChime();
    const num = getNumberForLine(line);
    if (!num) {
      showToast('No phone number registered for this line.');
      return;
    }

    if (onStartIntercomCall && callerRole === 'GUARD') {
      onStartIntercomCall(resident, num, line);
      onClose();
    } else {
      showToast(`Initiating direct call to ${line} line: ${num}...`);
      window.location.href = `tel:${num}`;
    }
  };

  // 2. Call via WhatsApp (Voice / Video)
  const handleWhatsAppCall = (line: ContactLineType = selectedLine) => {
    soundEngine.playSuccessChime();
    const num = getNumberForLine(line);
    if (!num) {
      showToast('No phone number registered for this line.');
      return;
    }
    const cleanNum = formatPhoneForWhatsApp(num);
    showToast(`Launching WhatsApp Call interface to ${line} line (${num})...`);
    window.open(`https://wa.me/${cleanNum}`, '_blank');
  };

  // 3. Msg via WhatsApp
  const handleWhatsAppMessage = (line: ContactLineType = selectedLine) => {
    soundEngine.playSuccessChime();
    const num = getNumberForLine(line);
    if (!num) {
      showToast('No phone number registered for this line.');
      return;
    }
    const cleanNum = formatPhoneForWhatsApp(num);
    showToast(`Dispatched message via WhatsApp to ${line} line (${num})...`);
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  // 4. Messenger / SMS Direct Dispatch
  const handleMessengerDispatch = (line: ContactLineType = selectedLine) => {
    soundEngine.playSuccessChime();
    const num = getNumberForLine(line);
    if (!num) {
      showToast('No phone number registered for this line.');
      return;
    }
    showToast(`Opened SMS Messenger for ${line} line (${num})...`);
    window.location.href = `sms:${num}?body=${encodeURIComponent(messageText)}`;
  };

  const handleCopyText = () => {
    navigator.clipboard?.writeText(messageText);
    soundEngine.playSuccessChime();
    setCopiedText(true);
    showToast('Message text copied to clipboard!');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyNumber = (num: string, lineName: string) => {
    navigator.clipboard?.writeText(num);
    soundEngine.playSuccessChime();
    setCopiedNumber(lineName);
    showToast(`${lineName} copied to clipboard!`);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleApproveClearance = () => {
    soundEngine.playSuccessChime();
    if (onVerificationSuccess) {
      onVerificationSuccess(`Contact verified with resident on ${selectedLine} line.`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              contextType === 'EMERGENCY'
                ? 'bg-rose-950 border border-rose-600 text-rose-400'
                : 'bg-cyan-950 border border-cyan-600 text-cyan-400'
            }`}>
              {contextType === 'EMERGENCY' ? <AlertOctagon className="w-5 h-5" /> : <PhoneForwarded className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white font-mono">
                  {callerRole === 'GUARD' ? 'Contact Host Resident' : 'Resident Contact Hub'}
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                  contextType === 'EMERGENCY'
                    ? 'bg-red-950 text-red-300 border-red-700'
                    : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                }`}>
                  {contextType.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: <strong className="text-white">{resident.ownerName}</strong> • {resident.houseNumber} ({resident.block})
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onEditResident && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditResident(resident);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-700 text-xs font-mono flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
                title="Edit Resident Profile & Phone Numbers"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Profile & Numbers</span>
              </button>
            )}
            <button
              type="button"
              id="btn-close-resident-contact-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="bg-emerald-950 border-b border-emerald-800 px-5 py-2 text-xs font-mono text-emerald-300 flex items-center space-x-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{actionNotice}</span>
          </div>
        )}

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Context Notice / Clarification */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start space-x-3 text-xs">
            <div className="p-1 rounded bg-blue-950 text-blue-400 border border-blue-800 shrink-0 mt-0.5">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <p className="text-slate-300 font-medium">
                {visitorName ? (
                  <>Checking on guest <strong className="text-white">{visitorName}</strong> {vehiclePlate && <span className="font-mono text-cyan-300">[{vehiclePlate}]</span>} for {resident.houseNumber}</>
                ) : (
                  <>Direct resident communication for <strong className="text-white">{resident.houseNumber}</strong> ({resident.ownerName})</>
                )}
              </p>
              <p className="text-[11px] text-slate-400">
                You have full discretion to choose between the <strong className="text-emerald-400">Primary Intercom</strong>, <strong className="text-cyan-400">Alternate Line</strong>, or <strong className="text-amber-400">Emergency Contact Number</strong> via Phone Call, WhatsApp Call, WhatsApp Message, or Messenger/SMS.
              </p>
            </div>
          </div>

          {/* 3 Contact Numbers Selection Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center space-x-1.5">
                <span>Select Target Contact Line:</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Active: <span className="font-bold text-white uppercase">{selectedLine} LINE</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* LINE 1: PRIMARY INTERCOM */}
              <div
                onClick={() => setSelectedLine('PRIMARY')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedLine === 'PRIMARY'
                    ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold uppercase">
                      Primary Intercom
                    </span>
                    <input
                      type="radio"
                      checked={selectedLine === 'PRIMARY'}
                      onChange={() => setSelectedLine('PRIMARY')}
                      className="accent-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div className="mt-1.5">
                    <span className="text-[9px] text-slate-400 block font-mono">Villa Intercom Phone</span>
                    <span className="font-mono text-xs font-bold text-emerald-300 block truncate select-all">
                      {primaryNumber || 'Not available'}
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyNumber(primaryNumber, 'Primary number');
                    }}
                    className="text-[9px] font-mono text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                  >
                    {copiedNumber === 'Primary number' ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>Copy</span>
                  </button>
                  <span className="text-[9px] text-emerald-400 font-bold">Default Intercom</span>
                </div>
              </div>

              {/* LINE 2: ALTERNATE NUMBER */}
              <div
                onClick={() => {
                  if (alternateNumber) setSelectedLine('ALTERNATE');
                }}
                className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                  !alternateNumber
                    ? 'opacity-50 bg-slate-950 border-slate-850 cursor-not-allowed'
                    : selectedLine === 'ALTERNATE'
                    ? 'bg-cyan-950/50 border-cyan-500 ring-1 ring-cyan-500/50 cursor-pointer'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold uppercase">
                      Alternate Line
                    </span>
                    {alternateNumber && (
                      <input
                        type="radio"
                        checked={selectedLine === 'ALTERNATE'}
                        onChange={() => setSelectedLine('ALTERNATE')}
                        className="accent-cyan-500 cursor-pointer"
                      />
                    )}
                  </div>
                  <div className="mt-1.5">
                    <span className="text-[9px] text-slate-400 block font-mono">Mobile / Secondary</span>
                    <span className="font-mono text-xs font-bold text-cyan-300 block truncate select-all">
                      {alternateNumber || 'None provided'}
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                  {alternateNumber ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyNumber(alternateNumber, 'Alternate number');
                        }}
                        className="text-[9px] font-mono text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                      >
                        {copiedNumber === 'Alternate number' ? <Check className="w-2.5 h-2.5 text-cyan-400" /> : <Copy className="w-2.5 h-2.5" />}
                        <span>Copy</span>
                      </button>
                      <span className="text-[9px] text-cyan-400 font-bold">Shared by Mgmt</span>
                    </>
                  ) : (
                    <span className="text-[9px] text-slate-500 italic">Optional Line</span>
                  )}
                </div>
              </div>

              {/* LINE 3: EMERGENCY CONTACT */}
              <div
                onClick={() => {
                  if (emergencyNumber) setSelectedLine('EMERGENCY');
                }}
                className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                  !emergencyNumber
                    ? 'opacity-50 bg-slate-950 border-slate-850 cursor-not-allowed'
                    : selectedLine === 'EMERGENCY'
                    ? 'bg-amber-950/50 border-amber-500 ring-1 ring-amber-500/50 cursor-pointer'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700 font-bold uppercase">
                      Emergency Contact
                    </span>
                    {emergencyNumber && (
                      <input
                        type="radio"
                        checked={selectedLine === 'EMERGENCY'}
                        onChange={() => setSelectedLine('EMERGENCY')}
                        className="accent-amber-500 cursor-pointer"
                      />
                    )}
                  </div>
                  <div className="mt-1.5">
                    <span className="text-[9px] text-slate-400 block font-mono">24/7 Priority Emergency</span>
                    <span className="font-mono text-xs font-bold text-amber-300 block truncate select-all">
                      {emergencyNumber || 'None provided'}
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                  {emergencyNumber ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyNumber(emergencyNumber, 'Emergency number');
                        }}
                        className="text-[9px] font-mono text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                      >
                        {copiedNumber === 'Emergency number' ? <Check className="w-2.5 h-2.5 text-amber-400" /> : <Copy className="w-2.5 h-2.5" />}
                        <span>Copy</span>
                      </button>
                      <span className="text-[9px] text-amber-400 font-bold">High Priority</span>
                    </>
                  ) : (
                    <span className="text-[9px] text-slate-500 italic">No Emergency Line</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Grid: Call / WhatsApp Call / WhatsApp Msg / Messenger for Selected Line */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center space-x-2">
                <span>Dispatch Channel Options ({selectedLine} Line):</span>
              </span>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {activeNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Option 1: Phone / Intercom Call */}
              <button
                type="button"
                id="btn-contact-modal-phone"
                onClick={() => handlePhoneCall(selectedLine)}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-emerald-500 text-left transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-600 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Direct Audio</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Direct Phone Call</div>
                  <div className="text-[10px] text-slate-400">
                    {callerRole === 'GUARD' ? 'Gate Terminal Intercom' : 'Standard Cellular Dial'}
                  </div>
                </div>
              </button>

              {/* Option 2: Call via WhatsApp */}
              <button
                type="button"
                id="btn-contact-modal-wa-call"
                onClick={() => handleWhatsAppCall(selectedLine)}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-emerald-500 text-left transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-900/60 border border-emerald-500 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 uppercase">Voice / Video</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Call via WhatsApp</div>
                  <div className="text-[10px] text-slate-400">Ring over WhatsApp Internet</div>
                </div>
              </button>

              {/* Option 3: Msg via WhatsApp */}
              <button
                type="button"
                id="btn-contact-modal-wa-msg"
                onClick={() => handleWhatsAppMessage(selectedLine)}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-emerald-500 text-left transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 uppercase">Text Chat</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Msg via WhatsApp</div>
                  <div className="text-[10px] text-slate-400">Send Guest / Alert Verification</div>
                </div>
              </button>

              {/* Option 4: Messenger / SMS */}
              <button
                type="button"
                id="btn-contact-modal-messenger"
                onClick={() => handleMessengerDispatch(selectedLine)}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-purple-500 text-left transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono text-purple-400 uppercase">SMS / Chat</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Messenger / SMS</div>
                  <div className="text-[10px] text-slate-400">Cellular Text &amp; Messenger</div>
                </div>
              </button>
            </div>
          </div>

          {/* Pre-filled Message Editor & Customizer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Verification Message Content:</span>
              </label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
              >
                {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedText ? 'Copied' : 'Copy Message'}</span>
              </button>
            </div>

            <textarea
              id="textarea-resident-contact-message"
              rows={4}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono resize-none leading-relaxed"
              placeholder="Type message text here..."
            />

            {/* Quick Template Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-mono mr-1">Quick Templates:</span>
              <button
                type="button"
                onClick={() => {
                  const v = visitorName || 'A guest';
                  const p = vehiclePlate ? `[${vehiclePlate.toUpperCase()}]` : '';
                  setMessageText(`Assalam-o-Alaikum / Hello ${resident.ownerName},\nGuest ${v} ${p} is at ${gateName} to visit ${resident.houseNumber}.\nPlease reply YES to approve entry or NO to deny.`);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 cursor-pointer"
              >
                Guest Verification
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessageText(`Assalam-o-Alaikum / Hello ${resident.ownerName},\nDelivery rider with parcel has arrived at ${gateName} for residence ${resident.houseNumber}.\nKindly confirm if we should allow entry.`);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 cursor-pointer"
              >
                Delivery Check
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessageText(`🚨 URGENT EMERGENCY NOTICE for ${resident.ownerName} (${resident.houseNumber}):\nPlease contact security desk / management immediately regarding an urgent situation.`);
                }}
                className="px-2 py-0.5 rounded bg-rose-950 hover:bg-rose-900 border border-rose-800 text-[10px] font-mono text-rose-300 cursor-pointer"
              >
                Emergency Alert
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 border-t border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <span>Active Target:</span>
            <span className="font-bold text-white">{resident.ownerName}</span>
            <span className="font-mono text-cyan-400">({activeNumber})</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>

            {callerRole === 'GUARD' && (
              <button
                type="button"
                id="btn-confirm-resident-permission"
                onClick={handleApproveClearance}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-950 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Permission Confirmed</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
