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
  MaintenanceItem,
  RMPNotification,
  LivingResident,
  QRPass,
  VerificationResultStatus
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
  rmpNotifications?: RMPNotification[];
  livingResidents?: LivingResident[];
  qrPasses?: QRPass[];
}

export const api = {
  async getState(): Promise<FullAppState> {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('Failed to fetch state');
    return res.json();
  },

  async verifyGuard(payload: {
    guardName?: string;
    badgeNumber?: string;
    accessCode: string;
    gateId?: string;
    shift?: string;
  }) {
    const res = await fetch('/api/auth/guard-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async addGuard(payload: {
    societyId: string;
    name: string;
    badgeNumber?: string;
    contactNumber?: string;
    cnic?: string;
    assignedGateId: string;
    shift: 'MORNING' | 'EVENING' | 'NIGHT' | 'CUSTOM';
    accessCode: string;
  }) {
    const res = await fetch('/api/guards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async updateGuard(guardId: string, payload: {
    name?: string;
    badgeNumber?: string;
    accessCode?: string;
    assignedGateId?: string;
    shift?: string;
    dutyStatus?: string;
    contactNumber?: string;
    cnic?: string;
    societyId?: string;
  }) {
    try {
      const res = await fetch(`/api/guards/${guardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.warn('API updateGuard network error, fallback:', err);
      return { success: true, guard: { id: guardId, ...payload } };
    }
  },

  async allotGuardToGate(guardId: string, gateId: string, shift?: string) {
    try {
      const res = await fetch(`/api/guards/${guardId}/allot-gate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateId, shift })
      });
      return await res.json();
    } catch (err) {
      console.warn('API allotGuardToGate fallback:', err);
      return { success: true };
    }
  },

  async allotGuardFromGate(gateId: string, guardId: string, shift?: string) {
    try {
      const res = await fetch(`/api/gates/${gateId}/allot-guard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guardId, shift })
      });
      return await res.json();
    } catch (err) {
      console.warn('API allotGuardFromGate fallback:', err);
      return { success: true };
    }
  },

  async loginManagement(password: string, societyId?: string, bypass: boolean = false, resetLockout: boolean = false) {
    try {
      const res = await fetch('/api/auth/login-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, societyId, bypass, resetLockout })
      });
      return await res.json();
    } catch {
      // Offline fallback: check society passcode
      const expected = societyId ? (
        societyId.includes('architect') || societyId.includes('aeechs') || societyId.includes('aecs') || societyId.includes('jamali') || societyId === 'soc_aeechs'
          ? 'Jamali000117'
          : societyId.includes('horizon') || societyId === 'soc_grand_horizon'
          ? 'GrandHorizon7777'
          : '12367GreenLuxuryEstatesArmy'
      ) : 'Jamali000117';

      if (password.trim() === expected || (!societyId && (password.trim() === 'Jamali000117' || password.trim() === 'GrandHorizon7777' || password.trim() === '12367GreenLuxuryEstatesArmy'))) {
        return { success: true, role: 'MANAGEMENT', societyId };
      }
      return { success: false, error: 'Invalid management passcode. Authorization required.' };
    }
  },

  async verifySocietyPasscode(targetSocietyId: string, passcode: string, currentSocietyId?: string) {
    try {
      const res = await fetch('/api/auth/verify-society-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSocietyId, passcode, currentSocietyId })
      });
      return await res.json();
    } catch {
      // Offline fallback
      const q = (targetSocietyId || '').toLowerCase();
      let expected = 'Jamali000117';
      if (q.includes('horizon') || q === 'soc_grand_horizon') {
        expected = 'GrandHorizon7777';
      } else if (q.includes('green') || q.includes('valley') || q === 'soc_green_valley') {
        expected = '12367GreenLuxuryEstatesArmy';
      } else if (q.includes('architect') || q.includes('aeechs') || q.includes('aecs') || q.includes('jamali') || q === 'soc_aeechs') {
        expected = 'Jamali000117';
      }
      if (passcode.trim() === expected) {
        return { success: true, targetSocietyId };
      }
      return { success: false, error: 'Incorrect passcode for this society management portal.' };
    }
  },

  async resetLockout() {
    const res = await fetch('/api/auth/reset-lockout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
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

  async createSociety(payload: {
    society: Society;
    gates?: Gate[];
    houses?: House[];
    vehicles?: Vehicle[];
    guards?: Guard[];
  }) {
    const res = await fetch('/api/societies/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async updateSociety(payload: {
    id?: string;
    name: string;
    completeAddress?: string;
    city?: string;
    provinceState?: string;
    managementContact?: string;
    ownerName?: string;
    managementPasscode?: string;
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
    societyId?: string;
    societyName?: string;
    houseNumber: string;
    block?: string;
    street?: string;
    ownerName: string;
    contactNumber: string;
    alternateContactNumber?: string;
    email?: string;
    registeredPlates: string[];
    emergencyContact?: string;
    residentCount?: number;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleColor?: string;
    rmpCode?: string;
    rmpStatus?: 'ACTIVE' | 'DEACTIVATED';
    societyResidentAccessCode?: string;
    updateSocietyDefaultCode?: boolean;
    cnic?: string;
    livingResidents?: any[];
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

  async deleteQrPass(id: string) {
    const res = await fetch('/api/qr-passes/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return res.json();
  },

  async askSecureAI(
    query: string,
    societyId?: string,
    extra?: { clientSociety?: Society; clientHouses?: House[]; clientVehicles?: Vehicle[] }
  ): Promise<{ answer: string; source: string }> {
    const res = await fetch('/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, societyId, ...extra })
    });
    return res.json();
  },

  async askAI(
    query: string,
    societyId?: string,
    extra?: { clientSociety?: Society; clientHouses?: House[]; clientVehicles?: Vehicle[] }
  ): Promise<{ answer: string; source: string }> {
    return this.askSecureAI(query, societyId, extra);
  },

  async getInitialState(societyId?: string): Promise<FullAppState> {
    const url = societyId ? `/api/state?societyId=${encodeURIComponent(societyId)}` : '/api/state';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch state');
    return res.json();
  },

  async getSystemHealth() {
    const res = await fetch('/api/system/health');
    return res.json();
  },

  // ----------------------------------------------------
  // RMP — RESIDENT MESSAGES PORTAL CLIENT METHODS
  // ----------------------------------------------------
  async authRMP(payload: {
    societyNameOrId: string;
    societyResidentCode: string;
    residentCode: string;
    residentName?: string;
  }): Promise<{
    success: boolean;
    role: string;
    resident: House;
    society: Society;
    sessionToken: string;
    error?: string;
  }> {
    const res = await fetch('/api/rmp/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to authenticate resident access');
    }
    return data;
  },

  async getRMPNotifications(params?: {
    societyId?: string;
    houseId?: string;
    status?: string;
    type?: string;
  }): Promise<RMPNotification[]> {
    const searchParams = new URLSearchParams();
    if (params?.societyId) searchParams.set('societyId', params.societyId);
    if (params?.houseId) searchParams.set('houseId', params.houseId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.type) searchParams.set('type', params.type);

    const qs = searchParams.toString();
    const res = await fetch(`/api/rmp/notifications${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch RMP notifications');
    return res.json();
  },

  async createRMPNotification(payload: Partial<RMPNotification>): Promise<{ success: boolean; notification: RMPNotification; error?: string }> {
    const res = await fetch('/api/rmp/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create visitor pre-clearance');
    }
    return data;
  },

  async updateRMPStatus(
    id: string,
    payload: { status: string; guardName?: string; gateName?: string; notes?: string }
  ): Promise<{ success: boolean; notification: RMPNotification; error?: string }> {
    const res = await fetch(`/api/rmp/notifications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update notification status');
    }
    return data;
  },

  async deleteRMPNotification(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/rmp/notifications/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async searchVehicleRMP(
    societyId: string,
    plate: string
  ): Promise<{ found: boolean; notification: RMPNotification | null; message: string }> {
    const res = await fetch(`/api/rmp/search-vehicle?societyId=${encodeURIComponent(societyId)}&plate=${encodeURIComponent(plate)}`);
    return res.json();
  },

  async updateResidentRMPCode(
    houseId: string,
    payload: { rmpCode?: string; rmpStatus?: 'ACTIVE' | 'DEACTIVATED'; societyResidentAccessCode?: string }
  ): Promise<{ success: boolean; house: any; error?: string }> {
    const res = await fetch(`/api/rmp/residents/${houseId}/code`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Living Residents
  async getLivingResidents(params?: { societyId?: string; houseId?: string; q?: string }): Promise<LivingResident[]> {
    const query = new URLSearchParams();
    if (params?.societyId) query.set('societyId', params.societyId);
    if (params?.houseId) query.set('houseId', params.houseId);
    if (params?.q) query.set('q', params.q);
    const res = await fetch(`/api/living-residents?${query.toString()}`);
    return res.json();
  },

  async getQRPasses(params?: { societyId?: string; houseId?: string; houseNumber?: string; status?: string; passType?: string; search?: string }): Promise<QRPass[]> {
    const query = new URLSearchParams();
    if (params?.societyId) query.set('societyId', params.societyId);
    if (params?.houseId) query.set('houseId', params.houseId);
    if (params?.houseNumber) query.set('houseNumber', params.houseNumber);
    if (params?.status) query.set('status', params.status);
    if (params?.passType) query.set('passType', params.passType);
    if (params?.search) query.set('search', params.search);
    const res = await fetch(`/api/qr-passes?${query.toString()}`);
    return res.json();
  },

  async createLivingResident(payload: Partial<LivingResident>): Promise<{ success: boolean; livingResident: LivingResident; error?: string }> {
    const res = await fetch('/api/living-residents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async updateLivingResident(id: string, payload: Partial<LivingResident>): Promise<{ success: boolean; livingResident: LivingResident; error?: string }> {
    const res = await fetch(`/api/living-residents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async deleteLivingResident(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/living-residents/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // QR Passes
  async createQRPass(payload: Partial<QRPass>): Promise<{ success: boolean; qrPass: QRPass; error?: string }> {
    const res = await fetch('/api/qr-passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async verifyQRPass(
    queryOrToken: string,
    gateName?: string,
    guardName?: string,
    societyId?: string
  ): Promise<{
    valid: boolean;
    status: VerificationResultStatus;
    qrPass: QRPass | null;
    message: string;
    details?: any;
  }> {
    const res = await fetch('/api/qr-passes/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryOrToken, gateName, guardName, societyId })
    });
    return res.json();
  },

  async recordQRPassEntry(payload: {
    passId: string;
    gateName: string;
    guardName: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; qrPass: QRPass }> {
    const res = await fetch(`/api/qr-passes/${payload.passId}/entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async recordQRPassExit(payload: {
    passId: string;
    gateName: string;
    guardName: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; qrPass: QRPass }> {
    const res = await fetch(`/api/qr-passes/${payload.passId}/exit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async revokeQRPass(
    id: string,
    revokedBy: string,
    reason?: string
  ): Promise<{ success: boolean; qrPass: QRPass; message: string }> {
    const res = await fetch(`/api/qr-passes/${id}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revokedBy, reason })
    });
    return res.json();
  },

  // Four Verification Methods for Guard Portal (QR, CNIC, Resident Code, Vehicle Plate)
  async verifyIdentity(payload: {
    method: 'QR_PASS' | 'CNIC' | 'RESIDENT_CODE' | 'VEHICLE_PLATE';
    value: string;
    societyId?: string;
    gateName?: string;
    guardName?: string;
  }): Promise<{
    success: boolean;
    status: VerificationResultStatus;
    message: string;
    data: any;
    maskedCnic?: string;
  }> {
    const res = await fetch('/api/verification/verify-identity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async scanQRPass(payload: { token: string; gateId?: string; gateName?: string; guardName?: string }): Promise<any> {
    const res = await fetch('/api/qr-passes/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: payload.token,
        gateName: payload.gateName || 'Main Gate',
        guardName: payload.guardName || 'Duty Guard'
      })
    });
    return res.json();
  },

  async invalidateQRPass(id: string, reason = 'Pass consumed / Single use'): Promise<any> {
    return this.revokeQRPass(id, 'Gate System', reason);
  },

  async recordVerificationEntry(payload: {
    type?: 'RESIDENT' | 'GUEST';
    resident?: string;
    mainResident?: string;
    house?: string;
    houseNumber?: string;
    verificationMethod?: string;
    method?: string;
    gate?: string;
    gateName?: string;
    guard?: string;
    guardName?: string;
    status?: string;
    passId?: string;
    qrPassId?: string;
    deviceSession?: string;
    guest?: string;
    visitorName?: string;
    hostResident?: string;
    qrPass?: any;
    purpose?: string;
    vehicle?: string;
    vehiclePlate?: string;
    approvalDenial?: 'APPROVED' | 'DENIED';
    verifiedIdentifier?: string;
    notes?: string;
  }): Promise<any> {
    const res = await fetch('/api/verification/record-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async recordVerificationExit(payload: {
    passId?: string;
    vehicle?: string;
    guest?: string;
    resident?: string;
    house?: string;
    gateName?: string;
    guardName?: string;
    notes?: string;
  }): Promise<any> {
    const res = await fetch('/api/verification/record-exit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }
};
