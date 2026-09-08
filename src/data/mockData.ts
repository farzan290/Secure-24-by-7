import {
  Society,
  Gate,
  Guard,
  House,
  Vehicle,
  Visitor,
  Delivery,
  ServiceWorker,
  SecurityAlert,
  Incident,
  WatchlistEntry,
  CCTVCamera,
  ParkingSlot,
  LostFoundItem,
  MaintenanceItem,
  AuditLogEntry,
  ShiftHandoverNote,
  GuardClearanceRecord
} from '../types';

export const INITIAL_SOCIETIES: Society[] = [
  {
    id: 'soc_grand_horizon',
    name: 'Grand Horizon Palm Residency',
    provinceState: 'Sindh / Southern District',
    city: 'Metropolis',
    country: 'Pakistan',
    continent: 'Asia',
    completeAddress: 'Sector 14-B, Palm Avenue, Executive Enclave',
    houseCount: 148,
    gateCount: 4,
    guardCount: 12,
    emergencyContacts: {
      police: '15 / +92-21-99201234',
      fire: '16 / +92-21-99205678',
      ambulance: '1122 / 115',
      securityChief: '+92-300-8877665'
    },
    managementContact: '+92-21-35889900 (Office Mon-Sat 9AM-6PM)',
    ownerName: 'Malik Zeeshan Tariq',
    securityScore: 94,
    securityStatus: 'EXCELLENT'
  },
  {
    id: 'soc_green_valley',
    name: 'Green Valley Luxury Estates',
    provinceState: 'Capital Territory',
    city: 'Pine Hills',
    country: 'Pakistan',
    continent: 'Asia',
    completeAddress: 'Hill View Corridor, Block D',
    houseCount: 92,
    gateCount: 3,
    guardCount: 8,
    emergencyContacts: {
      police: '15',
      fire: '16',
      ambulance: '1122',
      securityChief: '+92-321-4455667'
    },
    managementContact: '+92-51-2233445',
    ownerName: 'Col. (Retd) R. Jamali',
    securityScore: 89,
    securityStatus: 'GOOD'
  }
];

export const INITIAL_GATES: Gate[] = [
  {
    id: 'gate_1',
    societyId: 'soc_grand_horizon',
    name: 'Main Gate (North)',
    gateNumber: 1,
    location: 'North Perimeter - Main Boulevard',
    type: 'MAIN',
    assignedGuardIds: ['guard_1', 'guard_2'],
    status: 'ONLINE',
    barrierState: 'CLOSED',
    barrierMode: 'SIMULATION',
    cameraOnline: true,
    direction: 'TWO_WAY',
    vehiclesEnteredToday: 142,
    vehiclesExitedToday: 128
  },
  {
    id: 'gate_2',
    societyId: 'soc_grand_horizon',
    name: 'Gate 2 (West Commercial)',
    gateNumber: 2,
    location: 'West Access Road near Retail Hub',
    type: 'SECONDARY',
    assignedGuardIds: ['guard_3'],
    status: 'ONLINE',
    barrierState: 'CLOSED',
    barrierMode: 'SIMULATION',
    cameraOnline: true,
    direction: 'TWO_WAY',
    vehiclesEnteredToday: 68,
    vehiclesExitedToday: 61
  },
  {
    id: 'gate_3',
    societyId: 'soc_grand_horizon',
    name: 'Service Gate (East)',
    gateNumber: 3,
    location: 'East Boundary - Logistics & Contractors',
    type: 'SERVICE',
    assignedGuardIds: ['guard_4'],
    status: 'ONLINE',
    barrierState: 'CLOSED',
    barrierMode: 'SIMULATION',
    cameraOnline: true,
    direction: 'TWO_WAY',
    vehiclesEnteredToday: 45,
    vehiclesExitedToday: 39
  },
  {
    id: 'gate_4',
    societyId: 'soc_grand_horizon',
    name: 'VIP / Residents South Gate',
    gateNumber: 4,
    location: 'South Garden Entrance - RFID Fast Track',
    type: 'VIP',
    assignedGuardIds: ['guard_1'],
    status: 'ONLINE',
    barrierState: 'CLOSED',
    barrierMode: 'SIMULATION',
    cameraOnline: true,
    direction: 'TWO_WAY',
    vehiclesEnteredToday: 89,
    vehiclesExitedToday: 82
  }
];

export const INITIAL_GUARDS: Guard[] = [
  {
    id: 'guard_1',
    societyId: 'soc_grand_horizon',
    name: 'Tariq Mehmood',
    badgeNumber: 'SEC-042',
    contactNumber: '+92-301-5550192',
    assignedGateId: 'gate_1',
    shift: 'MORNING',
    dutyStatus: 'ON_DUTY',
    identityVerified: true,
    identityDocName: 'GOVT_NATIONAL_ID_VERIFIED_7719.enc',
    attendanceRate: 98.5,
    incidentsReported: 14,
    shiftStartTime: '06:00 AM'
  },
  {
    id: 'guard_2',
    societyId: 'soc_grand_horizon',
    name: 'David Harris',
    badgeNumber: 'SEC-088',
    contactNumber: '+92-302-5558911',
    assignedGateId: 'gate_1',
    shift: 'MORNING',
    dutyStatus: 'ON_DUTY',
    identityVerified: true,
    identityDocName: 'SECURITY_BADGE_DOC_8820.enc',
    attendanceRate: 96.0,
    incidentsReported: 9,
    shiftStartTime: '06:00 AM'
  },
  {
    id: 'guard_3',
    societyId: 'soc_grand_horizon',
    name: 'Rashid Khan',
    badgeNumber: 'SEC-104',
    contactNumber: '+92-304-5553322',
    assignedGateId: 'gate_2',
    shift: 'EVENING',
    dutyStatus: 'ON_DUTY',
    identityVerified: true,
    identityDocName: 'VERIFIED_LICENSED_GUARD_441.enc',
    attendanceRate: 99.1,
    incidentsReported: 6,
    shiftStartTime: '02:00 PM'
  },
  {
    id: 'guard_4',
    societyId: 'soc_grand_horizon',
    name: 'Elena Rostova',
    badgeNumber: 'SEC-112',
    contactNumber: '+92-306-5557766',
    assignedGateId: 'gate_3',
    shift: 'NIGHT',
    dutyStatus: 'ON_BREAK',
    identityVerified: true,
    identityDocName: 'OFFICIAL_GUARD_CREDENTIALS_112.enc',
    attendanceRate: 97.4,
    incidentsReported: 18,
    shiftStartTime: '10:00 PM'
  }
];

export const INITIAL_SHIFT_NOTES: ShiftHandoverNote[] = [
  {
    id: 'sn_1',
    societyId: 'soc_grand_horizon',
    gateId: 'gate_1',
    guardId: 'guard_4',
    guardName: 'Elena Rostova (Night Shift)',
    timestamp: '05:50 AM Today',
    note: 'Dark gray Toyota Fortuner (Plate SUS-999) circled twice at 3:15 AM without entering. ANPR flagged as watchlist. Stay vigilant.',
    category: 'SUSPICIOUS_VEHICLE',
    acknowledged: true
  },
  {
    id: 'sn_2',
    societyId: 'soc_grand_horizon',
    gateId: 'gate_1',
    guardId: 'guard_1',
    guardName: 'Tariq Mehmood',
    timestamp: '09:15 AM Today',
    note: 'VIP Delegation scheduled for Villa 101 at 4:30 PM. Fast-track through Gate 1 with prior clearance list.',
    category: 'EXPECTED_VIP',
    acknowledged: false
  },
  {
    id: 'sn_3',
    societyId: 'soc_grand_horizon',
    gateId: 'gate_3',
    guardId: 'guard_4',
    guardName: 'Elena Rostova',
    timestamp: '04:10 AM Today',
    note: 'East service boom barrier hydraulic pressure sensor displayed amber warning. Technicians notified.',
    category: 'BARRIER_ISSUE',
    acknowledged: true
  }
];

export const INITIAL_HOUSES: House[] = [
  {
    id: 'house_101',
    societyId: 'soc_grand_horizon',
    houseNumber: 'Villa 101',
    block: 'Block A (Executive)',
    street: 'Palm Boulevard North',
    ownerName: 'Syed Hamza Bukhari',
    residentCount: 4,
    contactNumber: '+92-300-1122334',
    email: 'h.bukhari@horizon.res',
    registeredPlates: ['ABC-123', 'LHR-5521'],
    emergencyContact: '+92-300-9988776 (Brother)',
    currentVisitorsCount: 1
  },
  {
    id: 'house_102',
    societyId: 'soc_grand_horizon',
    houseNumber: 'Villa 102',
    block: 'Block A (Executive)',
    street: 'Palm Boulevard North',
    ownerName: 'Dr. Ayesha Siddiqui',
    residentCount: 3,
    contactNumber: '+92-321-7788990',
    email: 'a.siddiqui@clinic.org',
    registeredPlates: ['KHI-9842'],
    emergencyContact: '+92-321-4455112 (Spouse)',
    currentVisitorsCount: 0
  },
  {
    id: 'house_104',
    societyId: 'soc_grand_horizon',
    houseNumber: 'Villa 104',
    block: 'Block A (Executive)',
    street: 'Palm Boulevard North',
    ownerName: 'Mr. Johnathan Vance',
    residentCount: 2,
    contactNumber: '+92-333-5566778',
    email: 'j.vance@techcorp.io',
    registeredPlates: ['XYZ-786'],
    emergencyContact: '+92-333-8899001 (Security Liaison)',
    currentVisitorsCount: 1
  },
  {
    id: 'house_205',
    societyId: 'soc_grand_horizon',
    houseNumber: 'Villa 205',
    block: 'Block B (Lake View)',
    street: 'Lake Crescent',
    ownerName: 'Chaudhry Nadeem Akram',
    residentCount: 5,
    contactNumber: '+92-345-6677889',
    email: 'nadeem.akram@textiles.pk',
    registeredPlates: ['ISB-2020', 'ISB-2021'],
    emergencyContact: '+92-345-1122998',
    currentVisitorsCount: 0
  },
  {
    id: 'house_301',
    societyId: 'soc_grand_horizon',
    houseNumber: 'Villa 301',
    block: 'Block C (Meadows)',
    street: 'Pine Crest Road',
    ownerName: 'Engr. Sarah Jenkins',
    residentCount: 3,
    contactNumber: '+92-312-3344556',
    email: 's.jenkins@buildenv.com',
    registeredPlates: ['DXB-4040'],
    emergencyContact: '+92-312-7788112',
    currentVisitorsCount: 0
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh_1',
    societyId: 'soc_grand_horizon',
    plateNumber: 'ABC-123',
    type: 'SUV',
    make: 'Toyota',
    model: 'Land Cruiser Prado',
    color: 'Pearl White',
    classification: 'RESIDENT',
    ownerName: 'Syed Hamza Bukhari',
    houseNumber: 'Villa 101',
    contactNumber: '+92-300-1122334',
    status: 'INSIDE',
    lastGateId: 'gate_1',
    lastGateName: 'Main Gate (North)',
    lastEntryTime: '08:21 AM Today',
    timeline: [
      {
        id: 'evt_1',
        timestamp: '08:21 AM Today',
        type: 'ENTRY',
        gateName: 'Main Gate (North)',
        guardName: 'Tariq Mehmood',
        houseNumber: 'Villa 101',
        notes: 'RFID Fast-Track verified automatically'
      },
      {
        id: 'evt_0',
        timestamp: '07:15 PM Yesterday',
        type: 'EXIT',
        gateName: 'Main Gate (North)',
        guardName: 'David Harris',
        houseNumber: 'Villa 101'
      }
    ]
  },
  {
    id: 'veh_2',
    societyId: 'soc_grand_horizon',
    plateNumber: 'KHI-9842',
    type: 'CAR',
    make: 'Honda',
    model: 'Civic RS Turbo',
    color: 'Sonic Gray',
    classification: 'RESIDENT',
    ownerName: 'Dr. Ayesha Siddiqui',
    houseNumber: 'Villa 102',
    contactNumber: '+92-321-7788990',
    status: 'INSIDE',
    lastGateId: 'gate_4',
    lastGateName: 'VIP / Residents South Gate',
    lastEntryTime: '07:45 AM Today',
    timeline: [
      {
        id: 'evt_2',
        timestamp: '07:45 AM Today',
        type: 'ENTRY',
        gateName: 'VIP / Residents South Gate',
        guardName: 'Tariq Mehmood',
        houseNumber: 'Villa 102',
        notes: 'Resident entry recorded'
      }
    ]
  },
  {
    id: 'veh_3',
    societyId: 'soc_grand_horizon',
    plateNumber: 'XYZ-786',
    type: 'CAR',
    make: 'Mercedes-Benz',
    model: 'E-Class 300',
    color: 'Obsidian Black',
    classification: 'RESIDENT',
    ownerName: 'Mr. Johnathan Vance',
    houseNumber: 'Villa 104',
    contactNumber: '+92-333-5566778',
    status: 'INSIDE',
    lastGateId: 'gate_1',
    lastGateName: 'Main Gate (North)',
    lastEntryTime: '09:05 AM Today',
    timeline: [
      {
        id: 'evt_3',
        timestamp: '09:05 AM Today',
        type: 'ENTRY',
        gateName: 'Main Gate (North)',
        guardName: 'David Harris',
        houseNumber: 'Villa 104',
        notes: 'ANPR plate match confirmed'
      }
    ]
  },
  {
    id: 'veh_4',
    societyId: 'soc_grand_horizon',
    plateNumber: 'LHR-5521',
    type: 'CAR',
    make: 'Hyundai',
    model: 'Sonata',
    color: 'Silver Metallic',
    classification: 'RESIDENT',
    ownerName: 'Syed Hamza Bukhari',
    houseNumber: 'Villa 101',
    status: 'OUTSIDE',
    lastGateId: 'gate_1',
    lastGateName: 'Main Gate (North)',
    lastExitTime: '06:40 AM Today',
    timeline: [
      {
        id: 'evt_4',
        timestamp: '06:40 AM Today',
        type: 'EXIT',
        gateName: 'Main Gate (North)',
        guardName: 'Tariq Mehmood',
        houseNumber: 'Villa 101',
        notes: 'Morning departure recorded'
      }
    ]
  },
  {
    id: 'veh_5',
    societyId: 'soc_grand_horizon',
    plateNumber: 'SUS-999',
    type: 'SUV',
    make: 'Toyota',
    model: 'Fortuner GR',
    color: 'Gunmetal Gray',
    classification: 'WATCHLIST',
    ownerName: 'Unknown / Flagged',
    houseNumber: 'Unassociated',
    status: 'OUTSIDE',
    isWatchlisted: true,
    timeline: [
      {
        id: 'evt_5',
        timestamp: '03:15 AM Today',
        type: 'DENIED',
        gateName: 'Main Gate (North)',
        guardName: 'Elena Rostova',
        notes: 'Watchlist triggered: Unauthorized perimeter loitering. Turned away.'
      }
    ]
  },
  {
    id: 'veh_6',
    societyId: 'soc_grand_horizon',
    plateNumber: 'GST-3411',
    type: 'CAR',
    make: 'Kia',
    model: 'Sportage',
    color: 'Clear White',
    classification: 'GUEST',
    ownerName: 'Bilal Farooq (Guest of Villa 104)',
    houseNumber: 'Villa 104',
    status: 'INSIDE',
    lastGateId: 'gate_1',
    lastGateName: 'Main Gate (North)',
    lastEntryTime: '09:40 AM Today',
    timeline: [
      {
        id: 'evt_6',
        timestamp: '09:40 AM Today',
        type: 'ENTRY',
        gateName: 'Main Gate (North)',
        guardName: 'Tariq Mehmood',
        houseNumber: 'Villa 104',
        notes: 'Host approved access via digital prompt'
      }
    ]
  }
];

export const INITIAL_VISITORS: Visitor[] = [
  {
    id: 'vis_1',
    societyId: 'soc_grand_horizon',
    name: 'Bilal Farooq',
    phone: '+92-300-8811223',
    purpose: 'Personal Guest / Lunch Meeting',
    destinationHouse: 'Villa 104',
    hostName: 'Mr. Johnathan Vance',
    vehiclePlate: 'GST-3411',
    entryGateId: 'gate_1',
    entryGateName: 'Main Gate (North)',
    entryTime: '09:40 AM Today',
    status: 'INSIDE',
    passCode: 'GP-849102',
    qrCodeData: 'SEC247-PASS-GP849102-VILLA104-BILAL',
    approvalStatus: 'APPROVED',
    guardName: 'Tariq Mehmood'
  },
  {
    id: 'vis_2',
    societyId: 'soc_grand_horizon',
    name: 'Mrs. Saira Kazmi',
    phone: '+92-321-9988771',
    purpose: 'Family Visit',
    destinationHouse: 'Villa 101',
    hostName: 'Syed Hamza Bukhari',
    vehiclePlate: 'None (Pedestrian / Cab)',
    entryGateId: 'gate_1',
    entryGateName: 'Main Gate (North)',
    entryTime: '10:15 AM Today',
    status: 'INSIDE',
    passCode: 'GP-312984',
    qrCodeData: 'SEC247-PASS-GP312984-VILLA101-SAIRA',
    approvalStatus: 'APPROVED',
    guardName: 'David Harris'
  }
];

export const INITIAL_DELIVERIES: Delivery[] = [
  {
    id: 'del_1',
    societyId: 'soc_grand_horizon',
    company: 'FoodPanda',
    riderName: 'Kamran Ali',
    vehiclePlate: 'MTR-7712',
    destinationHouse: 'Villa 205',
    residentName: 'Chaudhry Nadeem Akram',
    entryTime: '10:35 AM Today',
    status: 'INSIDE',
    gateName: 'Gate 2 (West Commercial)',
    preAuthorized: true
  },
  {
    id: 'del_2',
    societyId: 'soc_grand_horizon',
    company: 'Amazon',
    riderName: 'Waqas Bhatti',
    vehiclePlate: 'VAN-4491',
    destinationHouse: 'Villa 102',
    residentName: 'Dr. Ayesha Siddiqui',
    entryTime: '09:20 AM Today',
    exitTime: '09:38 AM Today',
    status: 'EXITED',
    gateName: 'Main Gate (North)',
    preAuthorized: true
  }
];

export const INITIAL_SERVICE_WORKERS: ServiceWorker[] = [
  {
    id: 'sw_1',
    societyId: 'soc_grand_horizon',
    name: 'Muhammad Asif',
    category: 'Electrician',
    company: 'VoltTech Power Solutions',
    destinationHouse: 'Villa 301',
    phone: '+92-334-1188229',
    entryTime: '08:50 AM Today',
    status: 'INSIDE',
    validUntil: '05:00 PM Today',
    gateName: 'Service Gate (East)'
  },
  {
    id: 'sw_2',
    societyId: 'soc_grand_horizon',
    name: 'Javed Iqbal',
    category: 'Gardener',
    company: 'Flora Gardeners Co.',
    destinationHouse: 'Villa 101',
    phone: '+92-342-9900114',
    entryTime: '07:30 AM Today',
    status: 'INSIDE',
    validUntil: '04:00 PM Today',
    gateName: 'Service Gate (East)'
  }
];

export const INITIAL_ALERTS: SecurityAlert[] = [
  {
    id: 'alt_1',
    societyId: 'soc_grand_horizon',
    title: 'Watchlist Vehicle Attempted Perimeter Approach',
    description: 'Vehicle SUS-999 (Toyota Fortuner) was detected near Main Gate perimeter at 03:15 AM. System prevented automated barrier opening.',
    severity: 'HIGH',
    timestamp: '03:15 AM Today',
    category: 'WATCHLIST',
    gateId: 'gate_1',
    gateName: 'Main Gate (North)',
    status: 'ACTIVE',
    assignedTo: 'Tariq Mehmood'
  },
  {
    id: 'alt_2',
    societyId: 'soc_grand_horizon',
    title: 'Electronic Barrier Pressure Sensor Alert',
    description: 'East Service Gate boom barrier hydraulic pressure variance detected. Maintenance scheduled.',
    severity: 'WARNING',
    timestamp: '04:10 AM Today',
    category: 'BARRIER_ERROR',
    gateId: 'gate_3',
    gateName: 'Service Gate (East)',
    status: 'ACKNOWLEDGED'
  },
  {
    id: 'alt_3',
    societyId: 'soc_grand_horizon',
    title: 'ANPR Camera Periodic Heartbeat Reconnect',
    description: 'Gate 2 secondary ANPR scanner successfully synchronized after network latency glitch.',
    severity: 'INFORMATIONAL',
    timestamp: '07:05 AM Today',
    category: 'CAMERA_OFFLINE',
    gateId: 'gate_2',
    gateName: 'Gate 2 (West Commercial)',
    status: 'RESOLVED'
  }
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc_1',
    societyId: 'soc_grand_horizon',
    title: 'Night Loitering & Watchlist Interception',
    type: 'UNAUTHORIZED_ACCESS',
    severity: 'HIGH',
    dateTime: 'Today 03:15 AM',
    gateName: 'Main Gate (North)',
    reportedByGuard: 'Elena Rostova (Badge SEC-112)',
    description: 'Unregistered dark gray Fortuner (SUS-999) stopped before barrier. Driver claimed to visit Villa 101, but resident was unaware. Vehicle reversed and sped off.',
    peopleInvolved: 'Driver of SUS-999 (unverified identity)',
    vehiclesInvolved: 'Toyota Fortuner SUS-999',
    actionsTaken: 'Entry denied. Guard Elena escalated to Security Chief. CCTV footage tagged for audit.',
    status: 'INVESTIGATING'
  }
];

export const INITIAL_WATCHLIST: WatchlistEntry[] = [
  {
    id: 'wl_1',
    societyId: 'soc_grand_horizon',
    type: 'VEHICLE_PLATE',
    identifier: 'SUS-999',
    reason: 'Suspicious perimeter reconnaissance during early hours. Unresponsive to resident verification.',
    severity: 'HIGH',
    actionGuidance: 'Hold barrier closed. Verify driver ID, dispatch supervisor immediately, do not grant access.',
    addedBy: 'Security Chief Farhan',
    dateAdded: 'Yesterday 11:30 PM',
    isActive: true
  },
  {
    id: 'wl_2',
    societyId: 'soc_grand_horizon',
    type: 'PERSON_NAME',
    identifier: 'Rehan Qureshi',
    reason: 'Dismissed contractor with revoked society access credentials.',
    severity: 'WARNING',
    actionGuidance: 'Access strictly revoked. Request departure immediately.',
    addedBy: 'Society Management Office',
    dateAdded: '3 Days Ago',
    isActive: true
  }
];

export const INITIAL_CCTV: CCTVCamera[] = [
  {
    id: 'cam_1',
    name: 'Gate 1 ANPR & Barrier Cam',
    location: 'Main Gate (North) Entry Lane',
    gateId: 'gate_1',
    status: 'ONLINE',
    resolution: '4K Ultra HD (3840x2160)',
    fps: 30,
    lastMotionDetected: '10 sec ago'
  },
  {
    id: 'cam_2',
    name: 'Gate 1 Exit & Pedestrian Feed',
    location: 'Main Gate (North) Exit Lane',
    gateId: 'gate_1',
    status: 'ONLINE',
    resolution: '1080p Full HD',
    fps: 30,
    lastMotionDetected: '45 sec ago'
  },
  {
    id: 'cam_3',
    name: 'Gate 2 Commercial Lane Cam',
    location: 'West Commercial Access',
    gateId: 'gate_2',
    status: 'ONLINE',
    resolution: '1080p Full HD',
    fps: 25,
    lastMotionDetected: '2 min ago'
  },
  {
    id: 'cam_4',
    name: 'Service Gate East Heavy Vehicle',
    location: 'East Boundary Logistics',
    gateId: 'gate_3',
    status: 'ONLINE',
    resolution: '1080p Full HD',
    fps: 25,
    lastMotionDetected: '5 min ago'
  },
  {
    id: 'cam_5',
    name: 'Central Boulevard & Clubhouse Cam',
    location: 'Central Roundabout',
    status: 'ONLINE',
    resolution: '4K Ultra HD (3840x2160)',
    fps: 30,
    lastMotionDetected: 'Just now'
  }
];

export const INITIAL_PARKING: ParkingSlot[] = [
  { id: 'p_101', slotNumber: 'A-01', type: 'RESIDENT', isOccupied: true, occupiedByPlate: 'ABC-123', assignedHouse: 'Villa 101' },
  { id: 'p_102', slotNumber: 'A-02', type: 'RESIDENT', isOccupied: true, occupiedByPlate: 'KHI-9842', assignedHouse: 'Villa 102' },
  { id: 'p_103', slotNumber: 'A-03', type: 'RESIDENT', isOccupied: true, occupiedByPlate: 'XYZ-786', assignedHouse: 'Villa 104' },
  { id: 'p_104', slotNumber: 'A-04', type: 'RESIDENT', isOccupied: false, assignedHouse: 'Villa 205' },
  { id: 'p_v01', slotNumber: 'V-01', type: 'GUEST', isOccupied: true, occupiedByPlate: 'GST-3411' },
  { id: 'p_v02', slotNumber: 'V-02', type: 'GUEST', isOccupied: false },
  { id: 'p_v03', slotNumber: 'V-03', type: 'GUEST', isOccupied: false },
  { id: 'p_r01', slotNumber: 'VIP-01', type: 'RESERVED', isOccupied: false }
];

export const INITIAL_LOST_FOUND: LostFoundItem[] = [
  {
    id: 'lf_1',
    title: 'Black Car Key Fob (Mercedes)',
    type: 'FOUND',
    description: 'Found near Central Park Jogging track near Villa 104.',
    location: 'Central Park Walkway',
    dateReported: 'Yesterday 06:30 PM',
    contactPerson: 'Security Office Desk Gate 1',
    status: 'OPEN'
  },
  {
    id: 'lf_2',
    title: 'Navy Leather Wallet',
    type: 'LOST',
    description: 'Contains national ID and cards of resident Villa 205.',
    location: 'Near West Gate Grocery',
    dateReported: '2 Days Ago',
    contactPerson: 'Chaudhry Nadeem Akram',
    status: 'CLAIMED'
  }
];

export const INITIAL_MAINTENANCE: MaintenanceItem[] = [
  {
    id: 'maint_1',
    title: 'Service Gate East Barrier Calibration',
    equipment: 'BARRIER',
    location: 'Gate 3',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    reportedAt: 'Today 04:15 AM',
    assignedTo: 'Engr. Tariq S.'
  },
  {
    id: 'maint_2',
    title: 'Clubhouse South Floodlight Bulb Replacement',
    equipment: 'LIGHTING',
    location: 'South Perimeter Fence',
    status: 'REPORTED',
    priority: 'LOW',
    reportedAt: 'Yesterday 08:00 PM'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_1',
    timestamp: '06:00 AM Today',
    action: 'GUARD_LOGIN_VERIFIED',
    actorRole: 'GUARD',
    actorName: 'Tariq Mehmood (SEC-042)',
    target: 'Gate 1 Console',
    details: 'Digital government identity document verified. Shift started on Morning schedule.',
    ipAddress: '10.0.1.42 (Internal Gate Network)',
    status: 'SUCCESS'
  },
  {
    id: 'aud_2',
    timestamp: '08:21 AM Today',
    action: 'VEHICLE_ENTRY_AUTHORIZED',
    actorRole: 'GUARD',
    actorName: 'Tariq Mehmood',
    target: 'Vehicle ABC-123 (Villa 101)',
    details: 'Automated RFID match. Boom barrier opened via command controller.',
    ipAddress: '10.0.1.42',
    status: 'SUCCESS'
  },
  {
    id: 'aud_3',
    timestamp: '09:40 AM Today',
    action: 'VISITOR_HOST_APPROVED',
    actorRole: 'GUARD',
    actorName: 'Tariq Mehmood',
    target: 'Guest Bilal Farooq (GST-3411)',
    details: 'Digital authorization request confirmed by House Villa 104 (Mr. Vance). Gate 1 opened.',
    ipAddress: '10.0.1.42',
    status: 'SUCCESS'
  }
];

export const INITIAL_CLEARANCE_RECORDS: GuardClearanceRecord[] = [
  {
    id: 'clr_1',
    timestamp: '09:40 AM Today',
    guardId: 'guard_1',
    guardName: 'Tariq Mehmood',
    guardBadge: 'SEC-042',
    gateId: 'gate_1',
    gateName: 'Main Gate (North)',
    recipientType: 'VISITOR',
    recipientName: 'Bilal Farooq (Guest)',
    recipientPhone: '+92-300-8811223',
    vehiclePlate: 'GST-3411',
    destinationHouse: 'Villa 104',
    hostName: 'Mr. Johnathan Vance',
    permissionStatus: 'GRANTED',
    verificationMethod: 'Host Resident Intercom Confirmation',
    actionTaken: 'Boom barrier opened, 6hr digital guest pass issued',
    notes: 'Cleared for lunch meeting at Villa 104'
  },
  {
    id: 'clr_2',
    timestamp: '08:21 AM Today',
    guardId: 'guard_1',
    guardName: 'Tariq Mehmood',
    guardBadge: 'SEC-042',
    gateId: 'gate_1',
    gateName: 'Main Gate (North)',
    recipientType: 'VEHICLE',
    recipientName: 'Syed Hamza Bukhari (Resident)',
    vehiclePlate: 'ABC-123',
    destinationHouse: 'Villa 101',
    hostName: 'Syed Hamza Bukhari',
    permissionStatus: 'GRANTED',
    verificationMethod: 'RFID Fast-Track Tag Auto-Match',
    actionTaken: 'Gate barrier opened automatically, logged in vehicle register',
    notes: 'Resident morning entry'
  },
  {
    id: 'clr_3',
    timestamp: '10:05 AM Today',
    guardId: 'guard_1',
    guardName: 'Tariq Mehmood',
    guardBadge: 'SEC-042',
    gateId: 'gate_1',
    gateName: 'Main Gate (North)',
    recipientType: 'DELIVERY',
    recipientName: 'Kamran Ali (FoodPanda Courier)',
    recipientPhone: '+92-311-9876543',
    vehiclePlate: 'KHI-4402',
    destinationHouse: 'Villa 102',
    hostName: 'Dr. Ayesha Siddiqui',
    permissionStatus: 'GRANTED',
    verificationMethod: 'Food Delivery Pre-Authorized Token (FP-8891)',
    actionTaken: 'Express delivery pass granted, 30m parking window',
    notes: 'Food order delivery drop-off'
  },
  {
    id: 'clr_4',
    timestamp: '07:15 AM Today',
    guardId: 'guard_1',
    guardName: 'Tariq Mehmood',
    guardBadge: 'SEC-042',
    gateId: 'gate_1',
    gateName: 'Main Gate (North)',
    recipientType: 'MANUAL_OVERRIDE',
    recipientName: 'Rescue 1122 City Emergency Medical Unit',
    vehiclePlate: 'AMB-1122',
    destinationHouse: 'Villa 103',
    hostName: 'Medical Emergency Dispatch',
    permissionStatus: 'GRANTED',
    verificationMethod: 'Emergency Siren & Flashing Beacon Verification',
    actionTaken: 'Emergency Barrier Override opened immediately by Guard',
    notes: 'Paramedic team responding to senior citizen health call'
  },
  {
    id: 'clr_5',
    timestamp: '03:15 AM Today',
    guardId: 'guard_4',
    guardName: 'Elena Rostova',
    guardBadge: 'SEC-112',
    gateId: 'gate_1',
    gateName: 'Main Gate (North)',
    recipientType: 'WATCHLIST_BLOCK',
    recipientName: 'Unknown Driver (Suspicious Vehicle)',
    vehiclePlate: 'SUS-999',
    destinationHouse: 'None / Perimeter Road',
    permissionStatus: 'DENIED',
    verificationMethod: 'ANPR Blacklist Interception',
    actionTaken: 'Entry refused, emergency lockout engaged, management notified',
    notes: 'Vehicle circled perimeter twice without resident invite'
  },
  {
    id: 'clr_6',
    timestamp: '10:15 AM Today',
    guardId: 'guard_2',
    guardName: 'David Harris',
    guardBadge: 'SEC-088',
    gateId: 'gate_1',
    gateName: 'Main Gate (North)',
    recipientType: 'VISITOR',
    recipientName: 'Mrs. Saira Kazmi (Family Guest)',
    recipientPhone: '+92-321-9988771',
    vehiclePlate: 'None (Pedestrian / Cab)',
    destinationHouse: 'Villa 101',
    hostName: 'Syed Hamza Bukhari',
    permissionStatus: 'GRANTED',
    verificationMethod: 'Physical CNIC Card Scan & Host Phone Confirmation',
    actionTaken: 'Walk-in visitor badge printed, pedestrian turnstile opened',
    notes: 'Family visit, verified with host on intercom'
  },
  {
    id: 'clr_7',
    timestamp: '09:05 AM Today',
    guardId: 'guard_2',
    guardName: 'David Harris',
    guardBadge: 'SEC-088',
    gateId: 'gate_1',
    gateName: 'Main Gate (North)',
    recipientType: 'VEHICLE',
    recipientName: 'Mr. Johnathan Vance (Resident)',
    vehiclePlate: 'XYZ-786',
    destinationHouse: 'Villa 104',
    hostName: 'Mr. Johnathan Vance',
    permissionStatus: 'GRANTED',
    verificationMethod: 'High-Resolution ANPR Optical License Match',
    actionTaken: 'Barrier opened, vehicle status changed to INSIDE',
    notes: 'Obsidian Black Mercedes-Benz E-Class'
  },
  {
    id: 'clr_8',
    timestamp: '08:45 AM Today',
    guardId: 'guard_2',
    guardName: 'David Harris',
    guardBadge: 'SEC-088',
    gateId: 'gate_1',
    gateName: 'Main Gate (North)',
    recipientType: 'SERVICE_WORKER',
    recipientName: 'Saleem Akhtar (Master Electrician)',
    recipientPhone: '+92-300-5544332',
    destinationHouse: 'Villa 105',
    hostName: 'Property Maintenance / Villa 105',
    permissionStatus: 'GRANTED',
    verificationMethod: 'Govt Technical Contractor License + Resident Job Card',
    actionTaken: 'Service contractor day-badge issued, valid till 5:00 PM',
    notes: 'Electrical short circuit repair job'
  },
  {
    id: 'clr_9',
    timestamp: '09:10 AM Today',
    guardId: 'guard_3',
    guardName: 'Rashid Khan',
    guardBadge: 'SEC-104',
    gateId: 'gate_2',
    gateName: 'Gate 2 (West Commercial)',
    recipientType: 'VEHICLE',
    recipientName: 'Fast-Trans Logistics (Cement & Steel Supply)',
    vehiclePlate: 'LES-8812',
    destinationHouse: 'Sector B Construction Zone',
    permissionStatus: 'GRANTED',
    verificationMethod: 'Commercial Weighbridge Slip & Society Gate Pass',
    actionTaken: 'Heavy vehicle barrier raised, safety escort briefed',
    notes: 'Approved construction material delivery'
  },
  {
    id: 'clr_10',
    timestamp: '10:30 AM Today',
    guardId: 'guard_3',
    guardName: 'Rashid Khan',
    guardBadge: 'SEC-104',
    gateId: 'gate_2',
    gateName: 'Gate 2 (West Commercial)',
    recipientType: 'DELIVERY',
    recipientName: 'Zeeshan Haider (DHL International Express)',
    recipientPhone: '+92-333-1122445',
    vehiclePlate: 'RWP-3100',
    destinationHouse: 'Villa 202',
    hostName: 'Chaudhry Nadeem Akram',
    permissionStatus: 'GRANTED',
    verificationMethod: 'Courier Dispatch Barcode Scanned',
    actionTaken: 'Gate 2 cleared, courier van permitted into residential zone',
    notes: 'Urgent legal documents delivery'
  },
  {
    id: 'clr_11',
    timestamp: '07:45 AM Today',
    guardId: 'guard_1',
    guardName: 'Tariq Mehmood',
    guardBadge: 'SEC-042',
    gateId: 'gate_4',
    gateName: 'VIP / Residents South Gate',
    recipientType: 'VEHICLE',
    recipientName: 'Dr. Ayesha Siddiqui (Resident)',
    vehiclePlate: 'KHI-9842',
    destinationHouse: 'Villa 102',
    hostName: 'Dr. Ayesha Siddiqui',
    permissionStatus: 'GRANTED',
    verificationMethod: 'RFID Long-Range Sensor Match',
    actionTaken: 'VIP Gate barrier raised automatically',
    notes: 'Civic RS Turbo return from hospital duty'
  }
];

export const mockSocieties = INITIAL_SOCIETIES;
export const mockGates = INITIAL_GATES;
export const mockGuards = INITIAL_GUARDS;
export const mockVehicles = INITIAL_VEHICLES;
export const mockVisitors = INITIAL_VISITORS;
export const mockDeliveries = INITIAL_DELIVERIES;
export const mockServiceWorkers = INITIAL_SERVICE_WORKERS;
export const mockSecurityAlerts = INITIAL_ALERTS;
export const mockIncidents = INITIAL_INCIDENTS;
export const mockHouses = INITIAL_HOUSES;
export const mockShiftNotes = INITIAL_SHIFT_NOTES;
export const mockAuditLogs = INITIAL_AUDIT_LOGS;
export const mockClearanceRecords = INITIAL_CLEARANCE_RECORDS;
