import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  HeartPulse,
  Zap,
  Car,
  Lock,
  PhoneCall,
  X,
  Radio,
  CheckCircle2
} from 'lucide-react';
import { Society, Gate, Guard } from '../types';
import { api } from '../services/api';
import { soundEngine } from '../services/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  society: Society;
  currentGate?: Gate;
  currentGuard?: Guard;
  onEmergencyTriggered: (alertTitle: string) => void;
}

export const EmergencyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  society,
  currentGate,
  currentGuard,
  onEmergencyTriggered
}) => {
  const [selectedType, setSelectedType] = useState<string>('Security Threat');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const emergencyTypes = [
    { label: 'Security Threat', icon: AlertTriangle, color: 'text-red-400 bg-red-950/60 border-red-700' },
    { label: 'Fire Emergency', icon: Flame, color: 'text-orange-400 bg-orange-950/60 border-orange-700' },
    { label: 'Medical Emergency', icon: HeartPulse, color: 'text-rose-400 bg-rose-950/60 border-rose-700' },
    { label: 'Electrical Hazard', icon: Zap, color: 'text-amber-400 bg-amber-950/60 border-amber-700' },
    { label: 'Vehicle Accident', icon: Car, color: 'text-yellow-400 bg-yellow-950/60 border-yellow-700' },
    { label: 'Unauthorized Access', icon: Lock, color: 'text-purple-400 bg-purple-950/60 border-purple-700' }
  ];

  const handleTriggerEmergency = async () => {
    setIsSubmitting(true);
    soundEngine.playEmergencyAlarm();

    try {
      await api.triggerEmergency({
        type: selectedType,
        gateName: currentGate?.name || 'Central Command',
        reportedBy: currentGuard?.name || 'Command Room Dispatcher',
        description: description || `Urgent ${selectedType} declared.`
      });

      setSuccessMessage(`CRITICAL EMERGENCY DECLARED: ${selectedType}`);
      onEmergencyTriggered(selectedType);

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage('');
        onClose();
      }, 2000);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-red-600 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-black/20 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-wider font-mono">
                SOCIETY EMERGENCY BROADCAST
              </h2>
              <p className="text-xs text-red-100 font-medium">
                Instant Multi-Gate Alert &amp; Emergency Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-red-700 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {successMessage ? (
            <div className="p-6 rounded-xl bg-red-950 border border-red-500 text-center space-y-2 animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-red-400 mx-auto" />
              <h3 className="text-lg font-bold text-white font-mono">{successMessage}</h3>
              <p className="text-xs text-red-200">
                All gate boom barriers locked down. Sirens and notifications dispatched.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">
                  1. Select Emergency Classification:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {emergencyTypes.map(type => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.label;
                    return (
                      <button
                        key={type.label}
                        type="button"
                        onClick={() => setSelectedType(type.label)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'bg-red-950 border-red-500 text-white shadow-lg shadow-red-950/80 scale-[1.02]'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-red-400' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wide">
                  2. Urgent Dispatch Notes (Optional):
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Smoke observed near Block A Transformer, evacuation advised..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-red-500 resize-none h-20"
                />
              </div>

              {/* Emergency Contacts Hotlines */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                  <PhoneCall className="w-3.5 h-3.5 text-red-400" />
                  <span>Immediate Emergency Contacts</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">POLICE HOTLINE</span>
                    <span className="text-red-400 font-bold">{society.emergencyContacts.police}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">AMBULANCE RESCUE</span>
                    <span className="text-rose-400 font-bold">{society.emergencyContacts.ambulance}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">FIRE BRIGADE</span>
                    <span className="text-orange-400 font-bold">{society.emergencyContacts.fire}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">SECURITY CHIEF</span>
                    <span className="text-cyan-400 font-bold">{society.emergencyContacts.securityChief}</span>
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                id="btn-confirm-emergency"
                type="button"
                onClick={handleTriggerEmergency}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-extrabold text-sm uppercase tracking-wider shadow-2xl shadow-red-950 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span>{isSubmitting ? 'BROADCASTING EMERGENCY...' : `DECLARE ${selectedType.toUpperCase()}`}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
