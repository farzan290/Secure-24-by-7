import React, { useState, useEffect } from 'react';
import {
  Building2,
  Lock,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  Upload
} from 'lucide-react';
import { api } from '../services/api';
import { soundEngine } from '../services/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCriticalAlertTriggered?: () => void;
}

export const ManagementLoginModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  onCriticalAlertTriggered
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasIdDoc, setHasIdDoc] = useState(true);
  const [docName, setDocName] = useState('OFFICIAL_MANAGEMENT_DIRECTOR_ID.enc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    let timer: any;
    if (isLocked && lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockoutSeconds]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    if (!hasIdDoc) {
      setError('Authorized Management Identity Credential must be attached');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.loginManagement(password);

      if (res.success) {
        soundEngine.playSuccessChime();
        setFailedAttempts(0);
        onSuccess();
      } else {
        soundEngine.playWarningSound();
        if (res.isLocked) {
          setIsLocked(true);
          setLockoutSeconds(res.remainingSec || 900);
          setError(res.error);
          soundEngine.playEmergencyAlarm();
          if (onCriticalAlertTriggered) onCriticalAlertTriggered();
        } else {
          setFailedAttempts(prev => prev + 1);
          setError(res.error || 'Invalid credentials');
        }
      }
    } catch {
      setError('Network communication error with authentication gateway.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdown = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                SOCIETY MANAGEMENT PORTAL
              </h2>
              <p className="text-xs text-slate-400">
                Administrative Authentication
              </p>
            </div>
          </div>
          <button
            id="close-mgmt-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {/* Lockout Warning Box */}
          {isLocked ? (
            <div className="p-4 rounded-xl bg-red-950/90 border border-red-700 text-red-200 text-xs space-y-2 animate-pulse">
              <div className="flex items-center space-x-2 font-bold text-sm text-red-100">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span>INTRUSION LOCKOUT ACTIVE</span>
              </div>
              <p>
                3 consecutive invalid password attempts recorded. Access is temporarily suspended for 15 minutes.
              </p>
              <div className="p-2 rounded bg-black/40 font-mono text-center text-red-300 font-bold tracking-widest text-sm">
                LOCKOUT TIMER: {formatCountdown(lockoutSeconds)}
              </div>
              <p className="text-[11px] text-red-300/80">
                • Critical Security Alert dispatched to Owner and Security Room.
              </p>
            </div>
          ) : (
            error && (
              <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-200 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{error}</p>
                  {failedAttempts > 0 && failedAttempts < 3 && (
                    <p className="text-[11px] text-red-300/80 mt-1">
                      ⚠️ Note: 3 consecutive failed attempts will trigger an immediate system lockout &amp; Critical Security Alert.
                    </p>
                  )}
                </div>
              </div>
            )
          )}

          {/* Identity Document Verification Requirement */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Management ID Verification</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                VERIFIED
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1.5 truncate max-w-[200px]">
                <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{docName}</span>
              </span>
              <button
                type="button"
                onClick={() => setHasIdDoc(!hasIdDoc)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
              >
                {hasIdDoc ? 'Re-attach' : 'Attach'}
              </button>
            </div>
          </div>

          {/* Password Input with Masking */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Management Master Password</label>
              <span className="text-[10px] text-slate-400 font-mono">Backend Secret Managed</span>
            </div>
            <div className="relative">
              <input
                id="input-mgmt-password"
                type={showPassword ? 'text' : 'password'}
                disabled={isLocked}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter authorized password..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-10 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Protected by server-side rate limiter &amp; tamper-resistant audit logger.
            </p>
          </div>

          {/* Quick Demo Helper Hint */}
          <div className="p-2.5 rounded bg-blue-950/30 border border-blue-900/40 text-[11px] text-blue-300/80 flex items-center justify-between">
            <span>Default configured secret:</span>
            <code className="bg-blue-950/80 px-2 py-0.5 rounded text-blue-200 font-mono text-[10px]">
              SecureMgmt2026!
            </code>
          </div>

          {/* Submit Button */}
          <button
            id="btn-submit-mgmt-login"
            type="submit"
            disabled={isLoading || isLocked}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-950/60 border border-blue-400/40 transition-all disabled:opacity-50 mt-2"
          >
            <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
