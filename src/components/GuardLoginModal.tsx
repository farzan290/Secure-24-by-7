import React, { useState } from 'react';
import {
  Shield,
  Upload,
  CheckCircle2,
  FileCheck,
  X,
  Lock,
  ArrowRight,
  AlertCircle,
  Crown,
  Building2,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import { Gate, Guard } from '../types';
import { api } from '../services/api';
import { soundEngine } from '../services/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gates: Gate[];
  guards: Guard[];
  onSuccess: (guard: Guard, auditMode?: 'OWNER' | 'MANAGEMENT', supervisorName?: string) => void;
}

export const GuardLoginModal: React.FC<Props> = ({
  isOpen,
  onClose,
  gates,
  guards,
  onSuccess
}) => {
  const [loginMode, setLoginMode] = useState<'GUARD' | 'OWNER' | 'MANAGEMENT'>('GUARD');

  // Guard state
  const [selectedGuardName, setSelectedGuardName] = useState('Tariq Mehmood');
  const [badgeNumber, setBadgeNumber] = useState('SEC-042');
  const [selectedGateId, setSelectedGateId] = useState(gates[0]?.id || 'gate_1');
  const [selectedShift, setSelectedShift] = useState<'MORNING' | 'EVENING' | 'NIGHT'>('MORNING');
  const [docUploaded, setDocUploaded] = useState(false);
  const [docFileName, setDocFileName] = useState('OFFICIAL_GOVT_SECURITY_BADGE_7719.enc');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  // Owner & Management Supervisor state
  const [ownerPassword, setOwnerPassword] = useState('');
  const [mgmtPassword, setMgmtPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreloadedGuard = (guard: Guard) => {
    setSelectedGuardName(guard.name);
    setBadgeNumber(guard.badgeNumber);
    setSelectedGateId(guard.assignedGateId);
    setSelectedShift(guard.shift as any);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFileName(file.name);
      setDocUploaded(true);
      setError('');
    }
  };

  // Guard login
  const handleVerifyGuard = async () => {
    if (!selectedGuardName.trim()) {
      setError('Please provide guard name');
      return;
    }
    if (!docUploaded) {
      setError('Authorized identity document or badge verification is required');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const res = await api.verifyGuard({
        guardName: selectedGuardName,
        badgeNumber,
        gateId: selectedGateId,
        shift: selectedShift,
        documentFileName: docFileName
      });

      if (res.success) {
        soundEngine.playSuccessChime();
        onSuccess(res.guard);
      } else {
        setError(res.error || 'Verification failed');
      }
    } catch {
      // Fallback
      const fallbackGuard: Guard = {
        id: `guard_${Date.now()}`,
        societyId: 'soc_grand_horizon',
        name: selectedGuardName,
        badgeNumber: badgeNumber || 'SEC-042',
        contactNumber: '+92-301-5550192',
        assignedGateId: selectedGateId,
        shift: selectedShift,
        dutyStatus: 'ON_DUTY',
        identityVerified: true,
        identityDocName: docFileName,
        attendanceRate: 99,
        incidentsReported: 0,
        shiftStartTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      soundEngine.playSuccessChime();
      onSuccess(fallbackGuard);
    } finally {
      setIsVerifying(false);
    }
  };

  // Owner Supervisor login into Guard Portal
  const handleOwnerSupervisorLogin = async () => {
    if (!ownerPassword) {
      setError('Owner Master Password is required');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const res = await api.loginOwner(ownerPassword);
      if (res.success) {
        soundEngine.playSuccessChime();
        const supervisorGuard: Guard = {
          id: `guard_owner_audit`,
          societyId: 'soc_grand_horizon',
          name: 'Executive Owner (Col. Retd R. Jamali)',
          badgeNumber: 'SUP-EXEC-01',
          contactNumber: '+92-51-2233445',
          assignedGateId: selectedGateId,
          shift: 'MORNING',
          dutyStatus: 'ON_DUTY',
          identityVerified: true,
          identityDocName: 'OWNER_EXECUTIVE_CREDENTIALS.enc',
          attendanceRate: 100,
          incidentsReported: 0,
          shiftStartTime: 'Executive Session'
        };
        onSuccess(supervisorGuard, 'OWNER', 'Col. (Retd) R. Jamali (Executive Owner)');
      } else {
        setError(res.error || 'Invalid Owner password credentials');
      }
    } catch {
      if (ownerPassword === 'OwnerMaster2026!') {
        soundEngine.playSuccessChime();
        const supervisorGuard: Guard = {
          id: `guard_owner_audit`,
          societyId: 'soc_grand_horizon',
          name: 'Executive Owner (Col. Retd R. Jamali)',
          badgeNumber: 'SUP-EXEC-01',
          contactNumber: '+92-51-2233445',
          assignedGateId: selectedGateId,
          shift: 'MORNING',
          dutyStatus: 'ON_DUTY',
          identityVerified: true,
          identityDocName: 'OWNER_EXECUTIVE_CREDENTIALS.enc',
          attendanceRate: 100,
          incidentsReported: 0,
          shiftStartTime: 'Executive Session'
        };
        onSuccess(supervisorGuard, 'OWNER', 'Col. (Retd) R. Jamali (Executive Owner)');
      } else {
        setError('Invalid Owner password credentials');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Management Supervisor login into Guard Portal
  const handleMgmtSupervisorLogin = async () => {
    if (!mgmtPassword) {
      setError('Management Master Password is required');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const res = await api.loginManagement(mgmtPassword);
      if (res.success) {
        soundEngine.playSuccessChime();
        const supervisorGuard: Guard = {
          id: `guard_mgmt_audit`,
          societyId: 'soc_grand_horizon',
          name: 'Management Auditor (Engr. Asif Rizvi)',
          badgeNumber: 'SUP-MGMT-02',
          contactNumber: '+92-300-8889900',
          assignedGateId: selectedGateId,
          shift: 'MORNING',
          dutyStatus: 'ON_DUTY',
          identityVerified: true,
          identityDocName: 'MANAGEMENT_AUDIT_CREDENTIALS.enc',
          attendanceRate: 100,
          incidentsReported: 0,
          shiftStartTime: 'Management Audit Session'
        };
        onSuccess(supervisorGuard, 'MANAGEMENT', 'Engr. Asif Rizvi (Management Audit)');
      } else {
        setError(res.error || 'Invalid Management password credentials');
      }
    } catch {
      if (mgmtPassword === 'SecureMgmt2026!') {
        soundEngine.playSuccessChime();
        const supervisorGuard: Guard = {
          id: `guard_mgmt_audit`,
          societyId: 'soc_grand_horizon',
          name: 'Management Auditor (Engr. Asif Rizvi)',
          badgeNumber: 'SUP-MGMT-02',
          contactNumber: '+92-300-8889900',
          assignedGateId: selectedGateId,
          shift: 'MORNING',
          dutyStatus: 'ON_DUTY',
          identityVerified: true,
          identityDocName: 'MANAGEMENT_AUDIT_CREDENTIALS.enc',
          attendanceRate: 100,
          incidentsReported: 0,
          shiftStartTime: 'Management Audit Session'
        };
        onSuccess(supervisorGuard, 'MANAGEMENT', 'Engr. Asif Rizvi (Management Audit)');
      } else {
        setError('Invalid Management password credentials');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              loginMode === 'OWNER'
                ? 'bg-amber-950 border border-amber-800 text-amber-400'
                : loginMode === 'MANAGEMENT'
                ? 'bg-blue-950 border border-blue-800 text-blue-400'
                : 'bg-cyan-950 border border-cyan-800 text-cyan-400'
            }`}>
              {loginMode === 'OWNER' ? <Crown className="w-5 h-5" /> : loginMode === 'MANAGEMENT' ? <Building2 className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                {loginMode === 'OWNER'
                  ? 'OWNER EXECUTIVE GUARD AUDIT'
                  : loginMode === 'MANAGEMENT'
                  ? 'MANAGEMENT GUARD AUDIT ACCESS'
                  : 'GUARD VERIFICATION PORTAL'}
              </h2>
              <p className="text-xs text-slate-400">
                {loginMode === 'OWNER'
                  ? 'Enter with Owner password to supervise guards & inspect permissions'
                  : loginMode === 'MANAGEMENT'
                  ? 'Enter with Management password to audit live gate clearances'
                  : 'Identity Credential & Gate Assignment'}
              </p>
            </div>
          </div>
          <button
            id="close-guard-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access Mode Switcher Tabs */}
        <div className="grid grid-cols-3 bg-slate-950 border-b border-slate-800 p-1.5 gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setLoginMode('GUARD');
              setError('');
            }}
            className={`py-2 px-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              loginMode === 'GUARD'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Guard Duty</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('OWNER');
              setError('');
            }}
            className={`py-2 px-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              loginMode === 'OWNER'
                ? 'bg-amber-950 text-amber-300 border border-amber-600 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>👑 Owner Access</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('MANAGEMENT');
              setError('');
            }}
            className={`py-2 px-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              loginMode === 'MANAGEMENT'
                ? 'bg-blue-950 text-blue-300 border border-blue-600 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>🏢 Mgmt Audit</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: GUARD DUTY LOGIN */}
          {loginMode === 'GUARD' && (
            <div className="space-y-4">
              {/* Quick Roster Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Authorized On-Roster Guard:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {guards.slice(0, 4).map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleSelectPreloadedGuard(g)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                        selectedGuardName === g.name
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-semibold shadow-sm shadow-cyan-900/40'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate font-medium">{g.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {g.badgeNumber} • {g.shift}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Guard Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Guard Full Name</label>
                  <input
                    id="input-guard-name"
                    type="text"
                    value={selectedGuardName}
                    onChange={e => setSelectedGuardName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                    placeholder="e.g. Tariq Mehmood"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Badge ID</label>
                  <input
                    id="input-guard-badge"
                    type="text"
                    value={badgeNumber}
                    onChange={e => setBadgeNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono font-medium"
                    placeholder="e.g. SEC-042"
                  />
                </div>
              </div>

              {/* Gate & Shift Assignment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Assigned Gate</label>
                  <select
                    id="select-guard-gate"
                    value={selectedGateId}
                    onChange={e => setSelectedGateId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    {gates.map(gate => (
                      <option key={gate.id} value={gate.id}>
                        {gate.name} ({gate.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Duty Shift</label>
                  <select
                    id="select-guard-shift"
                    value={selectedShift}
                    onChange={e => setSelectedShift(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    <option value="MORNING">Morning (06:00 - 14:00)</option>
                    <option value="EVENING">Evening (14:00 - 22:00)</option>
                    <option value="NIGHT">Night (22:00 - 06:00)</option>
                  </select>
                </div>
              </div>

              {/* Identity Document Verification Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Authorized Identity Document / National Badge Verification:
                </label>
                <div className="border-2 border-dashed border-slate-800 hover:border-cyan-600/80 rounded-xl p-4 text-center bg-slate-950/50 transition-colors">
                  <input
                    id="guard-doc-upload"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="guard-doc-upload"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                      {docUploaded ? <FileCheck className="w-5 h-5 text-emerald-400" /> : <Upload className="w-5 h-5" />}
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-cyan-400">Click to upload document</span>
                      <span className="text-slate-500"> or drag and drop</span>
                    </div>
                    <p className="text-[10px] text-slate-500">PNG, JPG, PDF up to 10MB</p>
                  </label>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setDocUploaded(true);
                      setDocFileName(`OFFICIAL_VERIFIED_BADGE_${badgeNumber}.enc`);
                      setError('');
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
                  >
                    Use Pre-Verified Official Department Credentials
                  </button>
                  {docUploaded && (
                    <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Credential Attached ({docFileName.slice(0, 18)}...)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OWNER SUPERVISOR LOGIN */}
          {loginMode === 'OWNER' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-amber-300">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Executive Owner Supervision Mode</span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Enter your Owner Master Password to access the Guard Portal with full executive oversight. You can monitor live duty status, see if guards are performing their duties, and audit which guard authorized which person or vehicle.
                </p>
              </div>

              {/* Owner Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Owner Master Password
                </label>
                <div className="relative">
                  <input
                    id="input-owner-guard-password"
                    type={showPassword ? 'text' : 'password'}
                    value={ownerPassword}
                    onChange={e => setOwnerPassword(e.target.value)}
                    placeholder="Enter Owner Master Password..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Gate to Supervise */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Gate Console to Supervise:
                </label>
                <select
                  value={selectedGateId}
                  onChange={e => setSelectedGateId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  {gates.map(gate => (
                    <option key={gate.id} value={gate.id}>
                      {gate.name} ({gate.type} • {gate.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Password Hint */}
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/40 text-[11px] text-amber-300/80 flex items-center justify-between">
                <span>Default Owner Master Secret:</span>
                <code className="bg-amber-950/80 px-2 py-0.5 rounded text-amber-200 font-mono text-[10px]">
                  OwnerMaster2026!
                </code>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGEMENT SUPERVISOR LOGIN */}
          {loginMode === 'MANAGEMENT' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-blue-300">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Society Management Audit Mode</span>
                </div>
                <p className="text-[11px] text-blue-200/80 leading-relaxed">
                  Enter your Society Management Password to inspect guard shifts, track guard activity responsiveness, and view which guard granted permission to which person or vehicle.
                </p>
              </div>

              {/* Management Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Management Master Password
                </label>
                <div className="relative">
                  <input
                    id="input-mgmt-guard-password"
                    type={showPassword ? 'text' : 'password'}
                    value={mgmtPassword}
                    onChange={e => setMgmtPassword(e.target.value)}
                    placeholder="Enter Management Master Password..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Gate to Supervise */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Gate Console to Supervise:
                </label>
                <select
                  value={selectedGateId}
                  onChange={e => setSelectedGateId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  {gates.map(gate => (
                    <option key={gate.id} value={gate.id}>
                      {gate.name} ({gate.type} • {gate.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Password Hint */}
              <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/40 text-[11px] text-blue-300/80 flex items-center justify-between">
                <span>Default Management Secret:</span>
                <code className="bg-blue-950/80 px-2 py-0.5 rounded text-blue-200 font-mono text-[10px]">
                  SecureMgmt2026!
                </code>
              </div>
            </div>
          )}

          {/* Compliance notice */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>Full Audit Trail &amp; Electronic Guard Accountability</span>
            </div>
            <p>
              Every access permission granted, barrier opened, or vehicle cleared is permanently recorded with guard identity, timestamp, and verification evidence.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950/80 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          {loginMode === 'GUARD' && (
            <button
              id="btn-verify-guard"
              type="button"
              onClick={handleVerifyGuard}
              disabled={isVerifying}
              className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-950/60 border border-cyan-400/40 transition-all disabled:opacity-50"
            >
              <span>{isVerifying ? 'Verifying Credentials...' : 'Verify & Open Guard Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {loginMode === 'OWNER' && (
            <button
              id="btn-owner-guard-enter"
              type="button"
              onClick={handleOwnerSupervisorLogin}
              disabled={isVerifying}
              className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-amber-950/60 border border-amber-400/40 transition-all disabled:opacity-50"
            >
              <Crown className="w-4 h-4" />
              <span>{isVerifying ? 'Validating Owner Secret...' : 'Authenticate & Enter Guard Portal as Owner'}</span>
            </button>
          )}

          {loginMode === 'MANAGEMENT' && (
            <button
              id="btn-mgmt-guard-enter"
              type="button"
              onClick={handleMgmtSupervisorLogin}
              disabled={isVerifying}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-blue-950/60 border border-blue-400/40 transition-all disabled:opacity-50"
            >
              <Building2 className="w-4 h-4" />
              <span>{isVerifying ? 'Validating Management Secret...' : 'Authenticate & Enter Guard Portal as Management'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
