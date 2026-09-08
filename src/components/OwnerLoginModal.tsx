import React, { useState, useEffect } from 'react';
import {
  Crown,
  Lock,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { soundEngine } from '../services/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCriticalAlertTriggered?: () => void;
}

export const OwnerLoginModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  onCriticalAlertTriggered
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);

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
      setError('Owner password is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.loginOwner(password);

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
      setError('Connection error with master authentication node.');
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
            <div className="w-9 h-9 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                OWNER MASTER PORTAL
              </h2>
              <p className="text-xs text-slate-400">
                Executive Society Governance
              </p>
            </div>
          </div>
          <button
            id="close-owner-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {/* Lockout Notification */}
          {isLocked ? (
            <div className="p-4 rounded-xl bg-red-950/90 border border-red-700 text-red-200 text-xs space-y-2 animate-pulse">
              <div className="flex items-center space-x-2 font-bold text-sm text-red-100">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span>SECURITY LOCKOUT ACTIVATED</span>
              </div>
              <p>
                3 failed attempts entered for Owner portal. All further attempts temporarily locked for 15 minutes.
              </p>
              <div className="p-2 rounded bg-black/40 font-mono text-center text-red-300 font-bold tracking-widest text-sm">
                LOCKOUT TIMER: {formatCountdown(lockoutSeconds)}
              </div>
              <p className="text-[11px] text-red-300/80">
                • Critical Security Alert dispatched to Owner device and registered email.
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
                      ⚠️ 3 consecutive failed attempts will trigger an immediate system lockout &amp; Critical Security Alert.
                    </p>
                  )}
                </div>
              </div>
            )
          )}

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Owner Master Password</label>
              <span className="text-[10px] text-slate-400 font-mono">Backend Secret Managed</span>
            </div>
            <div className="relative">
              <input
                id="input-owner-password"
                type={showPassword ? 'text' : 'password'}
                disabled={isLocked}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter owner master password..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-10 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono disabled:opacity-50"
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
          </div>

          {/* Quick Demo Helper Hint */}
          <div className="p-2.5 rounded bg-amber-950/30 border border-amber-900/40 text-[11px] text-amber-300/80 flex items-center justify-between">
            <span>Default configured secret:</span>
            <code className="bg-amber-950/80 px-2 py-0.5 rounded text-amber-200 font-mono text-[10px]">
              OwnerMaster2026!
            </code>
          </div>

          {/* Submit */}
          <button
            id="btn-submit-owner-login"
            type="submit"
            disabled={isLoading || isLocked}
            className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-950/60 border border-amber-400/40 transition-all disabled:opacity-50 mt-2"
          >
            <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Open Master Suite'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
