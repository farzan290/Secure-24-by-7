export type Role = 'GUARD' | 'MANAGEMENT' | 'OWNER' | 'RMP';

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
  cnic?: string;
  assignedGateId: string;
  shift: 'MORNING' | 'EVENING' | 'NIGHT' | 'CUSTOM';
  dutyStatus: 'ON_DUTY' | 'OFF_DUTY' | 'ON_BREAK';
  identityVerified: boolean;
  identityDocName?: string;
  attendanceRate: number;
  incidentsReported: number;
  shiftStartTime: string;
  accessCode: string;
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
  alternateContactNumber?: string;
  email: string;
  registeredPlates: string[];
  emergencyContact: string;
  currentVisitorsCount: number;
  cnic?: string;
  rmpCode?: string;
  rmpStatus?: 'ACTIVE' | 'DEACTIVATED';
  societyResidentAccessCode?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  livingResidents?: LivingResident[];
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
  alternateContactNumber?: string;
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
  cnic?: string;
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
  managementPasscode?: string;
  residentAccessCode?: string;
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

export type RMPNotificationType =
  | 'GUEST'
  | 'DELIVERY'
  | 'SERVICE_STAFF'
  | 'SOCIAL_WORKER'
  | 'RESIDENT'
  | 'OTHER';

export type RMPNotificationStatus =
  | 'UPCOMING'
  | 'ARRIVED'
  | 'INSIDE_SOCIETY'
  | 'EXITED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface RMPNotification {
  id: string;
  societyId: string;
  residentHouseId: string;
  residentHouseNumber: string;
  residentName: string;
  residentPhone: string;
  type: RMPNotificationType;
  status: RMPNotificationStatus;
  createdAt: string;
  updatedAt?: string;

  // Guest / Courier / Staff details
  fullName: string;
  nic?: string;
  phone?: string;
  vehiclePlate?: string;

  // Purpose / Categories
  purpose: string;
  subCategory?: string;
  orderReference?: string;

  // Scheduled timing
  expectedDate: string; // YYYY-MM-DD
  expectedTime: string; // e.g. "07:30 PM" or "19:30"
  additionalNotes?: string;

  // Gate check-in audit
  admittedAt?: string;
  exitedAt?: string;
  processedByGuardName?: string;
  processedGateName?: string;
}

export interface LivingResident {
  id: string;
  societyId: string;
  houseId: string;
  houseNumber: string;
  mainResidentId: string;
  mainResidentName: string;
  fullName: string;
  relationship: string;
  dateOfBirth: string; // YYYY-MM-DD
  age: number;
  isUnder18: boolean;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string;
  emergencyContact?: string;
  cnic?: string; // For 18+
  residentCode?: string; // For Under 18 e.g. "ZYG-48291"
  qrPassId?: string;
  qrToken?: string;
  qrStatus?: 'ACTIVE' | 'REVOKED' | 'SUSPENDED';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt?: string;
}

export type QRPassType =
  | 'GUEST'
  | 'DELIVERY'
  | 'SERVICE_STAFF'
  | 'SOCIAL_WORKER'
  | 'RESIDENT'
  | 'LIVING_RESIDENT'
  | 'OTHER';

export type QRPassStatus =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'REVOKED'
  | 'USED'
  | 'INACTIVE';

export interface QRPassHistoryEntry {
  timestamp: string;
  action: 'CREATED' | 'SCANNED' | 'APPROVED' | 'DENIED' | 'REVOKED' | 'EXPIRED' | 'EXITED';
  gate: string;
  guard: string;
  result: string;
  notes?: string;
}

export interface QRPass {
  id: string; // e.g. "SEC247-PASS-GP849102"
  secureToken: string;
  societyId: string;
  passType: QRPassType;
  entityType: 'VISITOR' | 'RESIDENT' | 'LIVING_RESIDENT' | 'DELIVERY' | 'SERVICE_STAFF' | 'SOCIAL_WORKER' | 'OTHER';
  entityId?: string;
  holderName: string;
  holderPhone?: string;
  hostResidentId?: string;
  hostResidentName?: string;
  houseId?: string;
  houseNumber: string;
  purpose: string;
  vehiclePlate?: string;
  validFrom: string; // YYYY-MM-DD or ISO
  validUntil: string; // YYYY-MM-DD or ISO
  expiryTime?: string; // e.g. "22:00"
  status: QRPassStatus;
  isSingleUse?: boolean;
  scanCount: number;
  lastScannedAt?: string;
  lastScannedGate?: string;
  lastScannedGuard?: string;
  createdAt: string;
  createdBy: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
  entryRecordedAt?: string;
  exitRecordedAt?: string;
  residentCode?: string;
  isUnder18?: boolean;
  age?: number;
  history?: QRPassHistoryEntry[];
}

export type VerificationResultStatus =
  | 'VERIFIED RESIDENT'
  | 'VERIFIED GUEST'
  | 'VERIFIED DELIVERY'
  | 'VERIFIED SERVICE STAFF'
  | 'VERIFICATION REQUIRED'
  | 'UNKNOWN PERSON'
  | 'UNKNOWN VEHICLE'
  | 'QR PASS EXPIRED'
  | 'QR PASS REVOKED'
  | 'INVALID RESIDENT CODE'
  | 'WATCHLIST MATCH — VERIFY BEFORE ACCESS';

