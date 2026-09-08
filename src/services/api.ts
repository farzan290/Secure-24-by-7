import {
  Vehicle,
  Visitor,
  Delivery,
  ServiceWorker,
  SecurityAlert,
  Incident,
  Gate,
  Guard,
  House,
  Society,
  WatchlistEntry,
  ResidentApprovalRequest,
  ShiftHandoverNote,
  AuditLogEntry,
  CCTVCamera,
  ParkingSlot,
  LostFoundItem,
  MaintenanceItem
} from '../types';

export interface FullAppState {
  societies: Society[];
  gates: Gate[];
  guards: Guard[];
  houses: House[];
  vehicles: Vehicle[];
  visitors: Visitor[];
  deliveries: Delivery[];
  serviceWorkers: ServiceWorker[];
  alerts: SecurityAlert[];
  incidents: Incident[];
  watchlist: WatchlistEntry[];
  cctv: CCTVCamera[];
  parking: ParkingSlot[];
  lostFound: LostFoundItem[];
  maintenance: MaintenanceItem[];
  auditLogs: AuditLogEntry[];
  shiftNotes: ShiftHandoverNote[];
  residentApprovals: ResidentApprovalRequest[];
}

export const api = {
  async getState(): Promise<FullAppState> {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('Failed to fetch state');
    return res.json();
  },

  async verifyGuard(payload: {
    guardName: string;
    badgeNumber?: string;
    gateId?: string;
    shift?: string;
    documentFileName?: string;
  }) {
    const res = await fetch('/api/auth/guard-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async loginManagement(password: string) {
    const res = await fetch('/api/auth/login-management', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    return res.json();
  },

  async loginOwner(password: string) {
    const res = await fetch('/api/auth/login-owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    return res.json();
  },

  async sendBarrierCommand(gateId: string, command: 'OPEN' | 'CLOSE' | 'EMERGENCY_LOCK', guardName?: string) {
    const res = await fetch('/api/barrier/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gateId, command, guardName })
    });
    return res.json();
  },

  async recordVehicleEntry(payload: {
    plateNumber: string;
    gateId?: string;
    guardName?: string;
    notes?: string;
    type?: string;
    make?: string;
    model?: string;
    color?: string;
    houseNumber?: string;
    classification?: string;
  }) {
    const res = await fetch('/api/vehicles/entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async recordVehicleExit(payload: {
    plateNumber: string;
    gateId?: string;
    guardName?: string;
  }) {
    const res = await fetch('/api/vehicles/exit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async requestResidentApproval(payload: {
    visitorName: string;
    vehiclePlate?: string;
    destinationHouse: string;
    hostName: string;
    purpose: string;
    gateName?: string;
  }) {
    const res = await fetch('/api/resident-approvals/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async respondResidentApproval(requestId: string, decision: 'APPROVED' | 'DENIED') {
    const res = await fetch('/api/resident-approvals/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, decision })
    });
    return res.json();
  },

  async triggerEmergency(payload: {
    type: string;
    gateName?: string;
    reportedBy?: string;
    description?: string;
  }) {
    const res = await fetch('/api/emergency/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async triggerPanic(gateName?: string, guardName?: string) {
    const res = await fetch('/api/emergency/panic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gateName, guardName })
    });
    return res.json();
  },

  async updateSociety(payload: {
    name: string;
    completeAddress?: string;
    city?: string;
    provinceState?: string;
    managementContact?: string;
    ownerName?: string;
  }) {
    const res = await fetch('/api/society/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async manageResident(payload: {
    id?: string;
    houseNumber: string;
    block?: string;
    street?: string;
    ownerName: string;
    contactNumber: string;
    email?: string;
    registeredPlates: string[];
    emergencyContact?: string;
    residentCount?: number;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleColor?: string;
  }) {
    const res = await fetch('/api/residents/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async deleteResident(id: string) {
    const res = await fetch('/api/residents/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return res.json();
  },

  async askSecureAI(query: string): Promise<{ answer: string; source: string }> {
    const res = await fetch('/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    return res.json();
  },

  async askAI(query: string, societyId?: string): Promise<{ answer: string; source: string }> {
    return this.askSecureAI(query);
  },

  async getInitialState(societyId?: string): Promise<FullAppState> {
    return this.getState();
  },

  async getSystemHealth() {
    const res = await fetch('/api/system/health');
    return res.json();
  }
};
