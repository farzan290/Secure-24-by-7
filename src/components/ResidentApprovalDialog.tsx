import React from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Car,
  UserCheck,
  Shield,
  Clock,
  Home
} from 'lucide-react';
import { ResidentApprovalRequest } from '../types';
import { soundEngine } from '../services/audio';

interface Props {
  requests: ResidentApprovalRequest[];
  onRespond: (requestId: string, decision: 'APPROVED' | 'DENIED') => void;
}

export const ResidentApprovalDialog: React.FC<Props> = ({ requests, onRespond }) => {
  if (requests.length === 0) return null;

  const currentReq = requests[0]; // Show first pending

  const handleAction = (decision: 'APPROVED' | 'DENIED') => {
    if (decision === 'APPROVED') {
      soundEngine.playSuccessChime();
    } else {
      soundEngine.playWarningSound();
    }
    onRespond(currentReq.id, decision);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border-2 border-cyan-500 rounded-2xl shadow-2xl shadow-cyan-950/80 overflow-hidden animate-slideUp">
      {/* Resident Phone Simulation Header */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 border-b border-cyan-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center text-white shadow-sm">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="text-xs font-bold text-white font-mono flex items-center space-x-1.5">
              <span>RESIDENT NOTIFICATION</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <p className="text-[10px] text-cyan-300">
              {currentReq.destinationHouse} ({currentReq.hostName})
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
          LIVE PROMPT
        </span>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        <div className="text-center pb-2 border-b border-slate-800">
          <p className="text-xs text-slate-400">Visitor Requesting Gate Access</p>
          <h3 className="text-base font-extrabold text-white mt-0.5">
            {currentReq.visitorName}
          </h3>
          <p className="text-xs text-cyan-400 font-medium mt-0.5">
            Purpose: {currentReq.purpose}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-500 flex items-center space-x-1">
              <Car className="w-3 h-3" />
              <span>Vehicle Plate</span>
            </div>
            <div className="font-mono font-bold text-slate-200 truncate">
              {currentReq.vehiclePlate || 'Pedestrian'}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-500 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Arrival</span>
            </div>
            <div className="font-mono font-bold text-slate-200">
              {currentReq.timestamp}
            </div>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Shield className="w-3 h-3 text-cyan-400" />
            <span>Gate: {currentReq.gateName}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Home className="w-3 h-3 text-cyan-400" />
            <span>{currentReq.destinationHouse}</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleAction('DENIED')}
            className="py-2.5 px-3 rounded-xl bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>❌ Deny Entry</span>
          </button>
          <button
            type="button"
            onClick={() => handleAction('APPROVED')}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-950 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>✅ Allow Entry</span>
          </button>
        </div>
      </div>
    </div>
  );
};
