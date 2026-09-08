export type Role = 'GUARD' | 'MANAGEMENT' | 'OWNER';

export type GateStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
export type BarrierState = 'CLOSED' | 'OPENING' | 'OPEN' | 'CLOSING' | 'ERROR' | 'OFFLINE';
export type GateDirection = 'TWO_WAY' | 'ENTRY_ONLY' | 'EXIT_ONLY';

export interface Gate {
  id: string;
  societyId: string;
  name: string;
  gateNumber: number;
  location: string;
  type: 'MAIN' | 'SECONDARY' | 'SERVICE' | 'VIP' | 'EMERGENCY';
  assignedGuardIds: string[];
  status: GateStatus;
  barrierState: BarrierState;
  barrierMode: 'SIMULATION' | 'LIVE_HARDWARE';
  cameraOnline: boolean;
  direction: GateDirection;
  vehiclesEnteredToday: number;
  vehiclesExitedToday: number;
}

export interface Guard {
  id: string;
  societyId: string;
  name: string;
  badgeNumber: string;
  contactNumber: string;
  assignedGateId: string;
  shift: 'MORNING' | 'EVENING' | 'NIGHT' | 'CUSTOM';
  dutyStatus: 'ON_DUTY' | 'OFF_DUTY' | 'ON_BREAK';
  identityVerified: boolean;
  identityDocName?: string;
  attendanceRate: number;
  incidentsReported: number;
  shiftStartTime: string;
}

export interface ShiftHandoverNote {
  id: string;
  societyId: string;
  gateId: string;
  guardId: string;
  guardName: string;
  timestamp: string;
  note: string;
  category: 'SUSPICIOUS_VEHICLE' | 'EXPECTED_VIP' | 'BARRIER_ISSUE' | 'CAMERA_ISSUE' | 'GENERAL';
  acknowledged: boolean;
}

export interface House {
  id: string;
  societyId: string;
  houseNumber: string;
  block: string;
  street: string;
  ownerName: string;
  residentCount: number;
  contactNumber: string;
  email: string;
  registeredPlates: string[];
  emergencyContact: string;
  currentVisitorsCount: number;
}

export type VehicleClassification = 'RESIDENT' | 'GUEST' | 'DELIVERY' | 'SERVICE' | 'UNKNOWN' | 'WATCHLIST';

export interface Vehicle {
  id: string;
  societyId: string;
  plateNumber: string;
  type: 'CAR' | 'SUV' | 'MOTORCYCLE' | 'VAN' | 'COMMERCIAL' | 'OTHER';
  make: string;
  model: string;
  color: string;
  classification: VehicleClassification;
  ownerName: string;
  houseNumber: string;
  contactNumber?: string;
  status: 'INSIDE' | 'OUTSIDE';
  lastGateId?: string;
  lastGateName?: string;
  lastEntryTime?: string;
  lastExitTime?: string;
  timeline: VehicleEvent[];
  isWatchlisted?: boolean;
}

export interface VehicleEvent {
  id: string;
  timestamp: string;
  type: 'ENTRY' | 'EXIT' | 'DENIED' | 'FLAGGED';
  gateName: string;
  guardName: string;
  houseNumber?: string;
  notes?: string;
}

export interface Visitor {
  id: string;
  societyId: string;
  name: string;
  phone: string;
  purpose: string;
  destinationHouse: string;
  hostName: string;
  vehiclePlate?: string;
  entryGateId: string;
  entryGateName: string;
  entryTime: string;
  exitTime?: string;
  status: 'INSIDE' | 'EXITED' | 'DENIED' | 'PENDING_APPROVAL';
  passCode: string;
  qrCodeData: string;
  approvalStatus: 'APPROVED' | 'DENIED' | 'PENDING';
  guardName: string;
}

export interface Delivery {
  id: string;
  societyId: string;
  company: 'UberEats' | 'DoorDash' | 'Amazon' | 'FedEx' | 'DHL' | 'FoodPanda' | 'Grocery' | 'Other';
  riderName: string;
  vehiclePlate: string;
  destinationHouse: string;
  residentName: string;
  entryTime: string;
  exitTime?: string;
  status: 'INSIDE' | 'EXITED';
  gateName: string;
  preAuthorized: boolean;
}

export interface ServiceWorker {
  id: string;
  societyId: string;
  name: string;
  category: 'Electrician' | 'Plumber' | 'Cleaner' | 'Gardener' | 'AC Tech' | 'Carpenter' | 'Internet Tech';
  company?: string;
  destinationHouse: string;
  phone: string;
  entryTime: string;
  exitTime?: string;
  status: 'INSIDE' | 'EXITED';
  validUntil: string;
  gateName: string;
}

export type AlertSeverity = 'INFORMATIONAL' | 'WARNING' | 'HIGH' | 'CRITICAL';

export interface SecurityAlert {
  id: string;
  societyId: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  timestamp: string;
  category: 'FAILED_LOGIN' | 'WATCHLIST' | 'UNKNOWN_VEHICLE' | 'BARRIER_ERROR' | 'CAMERA_OFFLINE' | 'PANIC' | 'EMERGENCY';
  gateId?: string;
  gateName?: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  assignedTo?: string;
  resolutionNotes?: string;
}

export interface Incident {
  id: string;
  societyId: string;
  title: string;
  type: 'SECURITY_THREAT' | 'UNAUTHORIZED_ACCESS' | 'ACCIDENT' | 'ALTERCATION' | 'PROPERTY_DAMAGE' | 'FIRE' | 'MEDICAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dateTime?: string;
  reportedAt?: string;
  gateName?: string;
  location?: string;
  reportedByGuard?: string;
  reportedBy?: string;
  description: string;
  peopleInvolved?: string;
  vehiclesInvolved?: string;
  actionsTaken?: string | string[];
  status: 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
}

export interface WatchlistEntry {
  id: string;
  societyId: string;
  type: 'VEHICLE_PLATE' | 'PERSON_NAME' | 'PHONE';
  identifier: string;
  reason: string;
  severity: 'WARNING' | 'HIGH' | 'CRITICAL';
  actionGuidance: string;
  addedBy: string;
  dateAdded: string;
  isActive: boolean;
}

export interface Society {
  id: string;
  name: string;
  provinceState: string;
  city: string;
  country: string;
  continent: string;
  completeAddress: string;
  houseCount: number;
  gateCount: number;
  guardCount: number;
  emergencyContacts: {
    police: string;
    fire: string;
    ambulance: string;
    securityChief: string;
  };
  managementContact: string;
  ownerName: string;
  logoUrl?: string;
  securityScore: number;
  securityStatus: 'EXCELLENT' | 'GOOD' | 'ATTENTION_NEEDED';
}

export interface CCTVCamera {
  id: string;
  name: string;
  location: string;
  gateId?: string;
  status: 'ONLINE' | 'OFFLINE';
  resolution: string;
  fps: number;
  lastMotionDetected?: string;
}

export interface ParkingSlot {
  id: string;
  slotNumber: string;
  type: 'RESIDENT' | 'GUEST' | 'RESERVED';
  isOccupied: boolean;
  occupiedByPlate?: string;
  assignedHouse?: string;
}

export interface LostFoundItem {
  id: string;
  title: string;
  type: 'LOST' | 'FOUND';
  description: string;
  location: string;
  dateReported: string;
  contactPerson: string;
  status: 'OPEN' | 'CLAIMED' | 'RESOLVED';
}

export interface MaintenanceItem {
  id: string;
  title: string;
  equipment: 'BARRIER' | 'CCTV' | 'LIGHTING' | 'GATE_MOTOR' | 'GENERATOR' | 'INTERCOM';
  location: string;
  status: 'REPORTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reportedAt: string;
  assignedTo?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actorRole: Role;
  actorName: string;
  target: string;
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
}

export interface ResidentApprovalRequest {
  id: string;
  visitorName: string;
  vehiclePlate?: string;
  destinationHouse: string;
  hostName: string;
  purpose: string;
  gateName: string;
  timestamp: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
}

export type AuditLog = AuditLogEntry;

export type AuditMode = 'OWNER' | 'MANAGEMENT' | null;

export interface GuardClearanceRecord {
  id: string;
  timestamp: string;
  guardId: string;
  guardName: string;
  guardBadge: string;
  gateId: string;
  gateName: string;
  recipientType: 'VISITOR' | 'VEHICLE' | 'DELIVERY' | 'SERVICE_WORKER' | 'MANUAL_OVERRIDE' | 'WATCHLIST_BLOCK';
  recipientName: string;
  recipientPhone?: string;
  vehiclePlate?: string;
  destinationHouse: string;
  hostName?: string;
  permissionStatus: 'GRANTED' | 'DENIED' | 'FLAGGED';
  verificationMethod: string;
  actionTaken: string;
  notes?: string;
}
