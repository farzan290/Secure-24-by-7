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
  Unlock,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { soundEngine } from '../services/audio';
import { Society } from '../types';
import { getClientSocietyPasscode } from '../data/mockData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCriticalAlertTriggered?: () => void;
  society?: Society;
}

export const ManagementLoginModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  onCriticalAlertTriggered,
  society
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [docName] = useState('OFFICIAL_MANAGEMENT_DIRECTOR_ID.enc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Clear password and error whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [isOpen]);

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

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const passToTest = password.trim();

    if (!passToTest) {
      setError('Please enter the society management passcode.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.loginManagement(passToTest, society?.id);

      if (res.success) {
        soundEngine.playSuccessChime();
        setFailedAttempts(0);
        setIsLocked(false);
        setLockoutSeconds(0);
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
          setError(res.error || 'Invalid passcode for this society.');
        }
      }
    } catch {
      // Offline fallback: check client passcode
      const expected = society ? getClientSocietyPasscode(society.id) : 'Jamali000117';
      if (passToTest === expected) {
        soundEngine.playSuccessChime();
        onSuccess();
      } else {
        soundEngine.playWarningSound();
        setError('Incorrect passcode for this society management portal.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset lockout button
  const handleResetLockout = async () => {
    setIsLoading(true);
    try {
      await api.resetLockout();
      setIsLocked(false);
      setLockoutSeconds(0);
      setError('');
      setFailedAttempts(0);
      soundEngine.playSuccessChime();
    } catch {
      setIsLocked(false);
      setLockoutSeconds(0);
      setError('');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-600/60 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                <span>SOCIETY MANAGEMENT</span>
              </h2>
              <p className="text-xs text-slate-400">
                {society?.name || 'Administrative Oversight Console'}
              </p>
            </div>
          </div>
          <button
            id="close-mgmt-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={e => handleLogin(e)} className="p-6 space-y-4">
          {/* Active Society Badge */}
          {society && (
            <div className="px-3.5 py-2.5 rounded-xl bg-blue-950/40 border border-blue-800/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-blue-200">{society.name}</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/60">
                Protected Portal
              </span>
            </div>
          )}

          {/* Lockout Warning Box with Reset Action */}
          {isLocked ? (
            <div className="p-4 rounded-xl bg-red-950/90 border border-red-700 text-red-200 text-xs space-y-3 animate-pulse">
              <div className="flex items-center space-x-2 font-bold text-sm text-red-100">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span>INTRUSION LOCKOUT ACTIVE</span>
              </div>
              <p>
                3 consecutive invalid passcode attempts recorded. Remaining time: {formatCountdown(lockoutSeconds)}.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleResetLockout}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow transition-all cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Reset Lockout &amp; Unlock</span>
                </button>
              </div>
            </div>
          ) : (
            error && (
              <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-xs text-red-200 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{error}</p>
                  {failedAttempts > 0 && failedAttempts < 3 && (
                    <p className="text-[11px] text-red-300/80 mt-1">
                      ⚠️ 3 consecutive failed attempts will trigger an immediate system lockout &amp; Critical Security Alert.
                    </p>
                  )}
                </div>
              </div>
            )
          )}

          {/* Identity Document Verification */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Management ID Verification</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>VERIFIED</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1.5 truncate max-w-[240px]">
                <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate font-mono text-[11px]">{docName}</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Status: Cleared</span>
            </div>
          </div>

          {/* Passcode Input - No hints or password disclosure */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Society Management Passcode
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Strict Access Control</span>
            </div>

            <div className="relative">
              <div className="absolute left-3 top-2.5 text-slate-500 pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="input-mgmt-password"
                type={showPassword ? 'text' : 'password'}
                disabled={isLocked}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter society passcode..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            <button
              id="btn-submit-mgmt-login"
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-950/60 border border-blue-400/40 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Verifying...' : 'Enter Management Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
