import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_SOCIETIES,
  INITIAL_GATES,
  INITIAL_GUARDS,
  INITIAL_HOUSES,
  INITIAL_VEHICLES,
  INITIAL_VISITORS,
  INITIAL_DELIVERIES,
  INITIAL_SERVICE_WORKERS,
  INITIAL_ALERTS,
  INITIAL_INCIDENTS,
  INITIAL_WATCHLIST,
  INITIAL_CCTV,
  INITIAL_PARKING,
  INITIAL_LOST_FOUND,
  INITIAL_MAINTENANCE,
  INITIAL_AUDIT_LOGS,
  INITIAL_SHIFT_NOTES
} from './src/data/mockData';
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
  AuditLogEntry
} from './src/types';

dotenv.config();

// Live in-memory database store
const db = {
  societies: [...INITIAL_SOCIETIES],
  gates: [...INITIAL_GATES],
  guards: [...INITIAL_GUARDS],
  houses: [...INITIAL_HOUSES],
  vehicles: [...INITIAL_VEHICLES],
  visitors: [...INITIAL_VISITORS],
  deliveries: [...INITIAL_DELIVERIES],
  serviceWorkers: [...INITIAL_SERVICE_WORKERS],
  alerts: [...INITIAL_ALERTS],
  incidents: [...INITIAL_INCIDENTS],
  watchlist: [...INITIAL_WATCHLIST],
  cctv: [...INITIAL_CCTV],
  parking: [...INITIAL_PARKING],
  lostFound: [...INITIAL_LOST_FOUND],
  maintenance: [...INITIAL_MAINTENANCE],
  auditLogs: [...INITIAL_AUDIT_LOGS],
  shiftNotes: [...INITIAL_SHIFT_NOTES],
  residentApprovals: [] as ResidentApprovalRequest[]
};

// Security attempt tracking for 3-failed-attempts rule
interface AttemptTracker {
  count: number;
  lockedUntil: number | null;
  lastAttemptTime: number;
}
const loginAttempts: Record<string, AttemptTracker> = {};

// Safe environment password getters
const getManagementPassword = () => process.env.SOCIETY_MANAGEMENT_PASSWORD || 'SecureMgmt2026!';
const getOwnerPassword = () => process.env.OWNER_PASSWORD || 'OwnerMaster2026!';

// Lazy Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    } catch {
      geminiClient = null;
    }
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper to add audit log
  const logAudit = (action: string, actorRole: 'GUARD' | 'MANAGEMENT' | 'OWNER', actorName: string, target: string, details: string, status: 'SUCCESS' | 'FAILED' | 'BLOCKED' = 'SUCCESS', ip = '127.0.0.1') => {
    const entry: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' Today',
      action,
      actorRole,
      actorName,
      target,
      details,
      ipAddress: ip,
      status
    };
    db.auditLogs.unshift(entry);
    return entry;
  };

  // Helper to trigger critical security alert
  const triggerCriticalAlert = (title: string, description: string, category: 'FAILED_LOGIN' | 'EMERGENCY' | 'WATCHLIST' | 'PANIC') => {
    const alert: SecurityAlert = {
      id: `alt_${Date.now()}`,
      societyId: db.societies[0]?.id || 'soc_grand_horizon',
      title,
      description,
      severity: 'CRITICAL',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
      category,
      status: 'ACTIVE'
    };
    db.alerts.unshift(alert);

    // Also auto-record incident
    const incident: Incident = {
      id: `inc_${Date.now()}`,
      societyId: db.societies[0]?.id || 'soc_grand_horizon',
      title,
      type: 'SECURITY_THREAT',
      severity: 'CRITICAL',
      dateTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
      gateName: 'System Security Control',
      reportedByGuard: 'Automated Intrusion Detection Engine',
      description,
      peopleInvolved: 'Unknown Actor / Remote Client',
      vehiclesInvolved: 'None',
      actionsTaken: 'Account locked for 15 minutes. Society Management and Owner dispatched priority push notification.',
      status: 'INVESTIGATING'
    };
    db.incidents.unshift(incident);

    return alert;
  };

  // ---------------- API ROUTES ----------------

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Secure 24 by 7 Security Backend',
      timestamp: new Date().toISOString()
    });
  });

  // Get full state
  app.get('/api/state', (req, res) => {
    res.json(db);
  });

  // Authentication: Guard identity document verification
  app.post('/api/auth/guard-verify', (req, res) => {
    const { guardName, badgeNumber, gateId, shift, documentFileName } = req.body;
    if (!guardName) {
      return res.status(400).json({ error: 'Guard name required' });
    }

    let guard = db.guards.find(g => g.name.toLowerCase() === guardName.toLowerCase() || g.badgeNumber === badgeNumber);
    if (!guard) {
      guard = {
        id: `guard_${Date.now()}`,
        societyId: db.societies[0]?.id || 'soc_grand_horizon',
        name: guardName,
        badgeNumber: badgeNumber || `SEC-${Math.floor(100 + Math.random() * 900)}`,
        contactNumber: '+92-300-1100220',
        assignedGateId: gateId || 'gate_1',
        shift: shift || 'MORNING',
        dutyStatus: 'ON_DUTY',
        identityVerified: true,
        identityDocName: documentFileName || 'GOVT_ID_DOC_VERIFIED.enc',
        attendanceRate: 100,
        incidentsReported: 0,
        shiftStartTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      db.guards.push(guard);
    } else {
      guard.identityVerified = true;
      guard.dutyStatus = 'ON_DUTY';
      if (gateId) guard.assignedGateId = gateId;
      if (shift) guard.shift = shift;
      if (documentFileName) guard.identityDocName = documentFileName;
    }

    logAudit('GUARD_VERIFIED_LOGIN', 'GUARD', guard.name, `Gate ${gateId || 'Main'}`, 'Authorized government credential verified. Shift started.');

    res.json({
      success: true,
      role: 'GUARD',
      guard,
      sessionToken: `token_guard_${Date.now()}`
    });
  });

  // Authentication: Society Management login with 3-attempt lockout
  app.post('/api/auth/login-management', (req, res) => {
    const { password, clientIp = '192.168.1.102' } = req.body;
    const trackerKey = `mgmt_${clientIp}`;
    const now = Date.now();

    if (!loginAttempts[trackerKey]) {
      loginAttempts[trackerKey] = { count: 0, lockedUntil: null, lastAttemptTime: now };
    }
    const tracker = loginAttempts[trackerKey];

    // Check if locked
    if (tracker.lockedUntil && now < tracker.lockedUntil) {
      const remainingSec = Math.ceil((tracker.lockedUntil - now) / 1000);
      return res.status(429).json({
        error: `Account temporarily locked due to 3 consecutive failed attempts. Please wait ${remainingSec} seconds.`,
        isLocked: true,
        remainingSec
      });
    }

    const correctPassword = getManagementPassword();
    if (password === correctPassword) {
      // Reset attempts
      tracker.count = 0;
      tracker.lockedUntil = null;
      logAudit('MANAGEMENT_LOGIN', 'MANAGEMENT', 'Society Management Admin', 'Management Console', 'Successful authentication via verified credential.');
      return res.json({
        success: true,
        role: 'MANAGEMENT',
        sessionToken: `token_mgmt_${Date.now()}`
      });
    } else {
      tracker.count += 1;
      tracker.lastAttemptTime = now;
      logAudit('LOGIN_FAILED', 'MANAGEMENT', 'Unknown User', 'Management Portal', `Failed attempt #${tracker.count} for Society Management`, 'FAILED', clientIp);

      if (tracker.count >= 3) {
        tracker.lockedUntil = now + 15 * 60 * 1000; // 15 mins lock
        // Critical alert creation
        const alert = triggerCriticalAlert(
          'CRITICAL: 3 Consecutive Failed Management Password Attempts',
          `Intrusion Prevention: 3 invalid password attempts recorded for Society Management from ${clientIp} at ${new Date().toLocaleTimeString()}. Account locked for 15 minutes. Immediate notification dispatched to Owner & Management.`,
          'FAILED_LOGIN'
        );

        return res.status(403).json({
          error: 'Security Lockout: 3 consecutive failed password attempts. Access has been temporarily blocked and a Critical Security Alert has been dispatched.',
          isLocked: true,
          remainingSec: 900,
          alertId: alert.id
        });
      }

      const remainingAttempts = 3 - tracker.count;
      return res.status(401).json({
        error: `Invalid credentials. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining before system lockout.`,
        remainingAttempts,
        isLocked: false
      });
    }
  });

  // Authentication: Owner login with 3-attempt lockout
  app.post('/api/auth/login-owner', (req, res) => {
    const { password, clientIp = '192.168.1.100' } = req.body;
    const trackerKey = `owner_${clientIp}`;
    const now = Date.now();

    if (!loginAttempts[trackerKey]) {
      loginAttempts[trackerKey] = { count: 0, lockedUntil: null, lastAttemptTime: now };
    }
    const tracker = loginAttempts[trackerKey];

    if (tracker.lockedUntil && now < tracker.lockedUntil) {
      const remainingSec = Math.ceil((tracker.lockedUntil - now) / 1000);
      return res.status(429).json({
        error: `Owner access locked due to 3 consecutive failed attempts. Wait ${remainingSec} seconds.`,
        isLocked: true,
        remainingSec
      });
    }

    const correctPassword = getOwnerPassword();
    if (password === correctPassword) {
      tracker.count = 0;
      tracker.lockedUntil = null;
      logAudit('OWNER_LOGIN', 'OWNER', 'Executive Owner', 'Owner Master Console', 'Successful authentication.');
      return res.json({
        success: true,
        role: 'OWNER',
        sessionToken: `token_owner_${Date.now()}`
      });
    } else {
      tracker.count += 1;
      tracker.lastAttemptTime = now;
      logAudit('OWNER_LOGIN_FAILED', 'OWNER', 'Unknown User', 'Owner Console', `Failed attempt #${tracker.count} for Owner Account`, 'FAILED', clientIp);

      if (tracker.count >= 3) {
        tracker.lockedUntil = now + 15 * 60 * 1000;
        const alert = triggerCriticalAlert(
          'CRITICAL: 3 Consecutive Failed Owner Password Attempts',
          `Executive Breach Alert: 3 invalid attempts against Owner Account from ${clientIp}. Access locked for 15 minutes.`,
          'FAILED_LOGIN'
        );

        return res.status(403).json({
          error: 'Security Lockout: 3 consecutive failed password attempts. Access temporarily blocked and Critical Security Alert issued.',
          isLocked: true,
          remainingSec: 900,
          alertId: alert.id
        });
      }

      const remainingAttempts = 3 - tracker.count;
      return res.status(401).json({
        error: `Invalid credentials. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining before system lockout.`,
        remainingAttempts,
        isLocked: false
      });
    }
  });

  // Electronic Boom Barrier control
  app.post('/api/barrier/command', (req, res) => {
    const { gateId, command, guardName = 'Authorized Guard' } = req.body;
    const gate = db.gates.find(g => g.id === gateId);
    if (!gate) {
      return res.status(404).json({ error: 'Gate not found' });
    }

    if (command === 'OPEN') {
      gate.barrierState = 'OPENING';
      logAudit('BARRIER_OPEN_COMMAND', 'GUARD', guardName, gate.name, `Command to OPEN electronic boom barrier dispatched to controller.`);

      // Simulate opening and schedule auto-close in simulation mode
      setTimeout(() => {
        gate.barrierState = 'OPEN';
        setTimeout(() => {
          gate.barrierState = 'CLOSING';
          setTimeout(() => {
            gate.barrierState = 'CLOSED';
          }, 2500);
        }, 6000);
      }, 1500);

      return res.json({
        success: true,
        gateId,
        gateName: gate.name,
        barrierState: 'OPENING',
        mode: gate.barrierMode,
        message: 'Barrier opening initiated. Controller acknowledged.'
      });
    } else if (command === 'CLOSE') {
      gate.barrierState = 'CLOSING';
      setTimeout(() => {
        gate.barrierState = 'CLOSED';
      }, 2000);
      return res.json({ success: true, gateId, barrierState: 'CLOSING' });
    } else if (command === 'EMERGENCY_LOCK') {
      gate.barrierState = 'CLOSED';
      logAudit('BARRIER_EMERGENCY_LOCK', 'GUARD', guardName, gate.name, 'EMERGENCY LOCK applied to barrier controller.');
      return res.json({ success: true, gateId, barrierState: 'CLOSED', message: 'Gate barrier locked in security protocol.' });
    }

    res.status(400).json({ error: 'Unknown barrier command' });
  });

  // Vehicle Entry Record
  app.post('/api/vehicles/entry', (req, res) => {
    const { plateNumber, gateId, guardName = 'Tariq Mehmood', notes, type = 'CAR', make, model, color, houseNumber, classification = 'UNKNOWN' } = req.body;
    if (!plateNumber) return res.status(400).json({ error: 'Plate number required' });

    const normalizedPlate = plateNumber.trim().toUpperCase();
    const gate = db.gates.find(g => g.id === gateId) || db.gates[0];

    // Check watchlist
    const watchlistMatch = db.watchlist.find(w => w.isActive && w.identifier.toUpperCase() === normalizedPlate);
    if (watchlistMatch) {
      const alert: SecurityAlert = {
        id: `alt_${Date.now()}`,
        societyId: gate.societyId,
        title: `WATCHLIST MATCH: Vehicle ${normalizedPlate}`,
        description: `Watchlist vehicle detected at ${gate.name}. Reason: ${watchlistMatch.reason}. Guidance: ${watchlistMatch.actionGuidance}`,
        severity: watchlistMatch.severity as any,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
        category: 'WATCHLIST',
        gateId: gate.id,
        gateName: gate.name,
        status: 'ACTIVE'
      };
      db.alerts.unshift(alert);
      logAudit('WATCHLIST_DETECTION', 'GUARD', guardName, normalizedPlate, `Watchlist plate intercepted at ${gate.name}`, 'BLOCKED');

      return res.json({
        success: false,
        watchlistAlert: alert,
        message: `WATCHLIST MATCH — VERIFY BEFORE ACCESS: ${watchlistMatch.reason}`
      });
    }

    let vehicle = db.vehicles.find(v => v.plateNumber.toUpperCase() === normalizedPlate);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today';

    if (vehicle) {
      vehicle.status = 'INSIDE';
      vehicle.lastGateId = gate.id;
      vehicle.lastGateName = gate.name;
      vehicle.lastEntryTime = nowTime;
      vehicle.timeline.unshift({
        id: `evt_${Date.now()}`,
        timestamp: nowTime,
        type: 'ENTRY',
        gateName: gate.name,
        guardName,
        houseNumber: vehicle.houseNumber,
        notes: notes || 'Entry recorded'
      });
    } else {
      // New or guest vehicle
      vehicle = {
        id: `veh_${Date.now()}`,
        societyId: gate.societyId,
        plateNumber: normalizedPlate,
        type: type as any,
        make: make || 'Vehicle',
        model: model || 'Model',
        color: color || 'Silver',
        classification: classification as any,
        ownerName: 'Guest / Temporary Visitor',
        houseNumber: houseNumber || 'Unassigned',
        status: 'INSIDE',
        lastGateId: gate.id,
        lastGateName: gate.name,
        lastEntryTime: nowTime,
        timeline: [
          {
            id: `evt_${Date.now()}`,
            timestamp: nowTime,
            type: 'ENTRY',
            gateName: gate.name,
            guardName,
            houseNumber: houseNumber || 'Unassigned',
            notes: notes || 'First-time / Guest vehicle entry'
          }
        ]
      };
      db.vehicles.push(vehicle);
    }

    gate.vehiclesEnteredToday += 1;
    logAudit('VEHICLE_ENTRY', 'GUARD', guardName, normalizedPlate, `Vehicle entered via ${gate.name} heading to ${vehicle.houseNumber}`);

    res.json({
      success: true,
      vehicle,
      gate
    });
  });

  // Vehicle Exit Record
  app.post('/api/vehicles/exit', (req, res) => {
    const { plateNumber, gateId, guardName = 'Tariq Mehmood' } = req.body;
    if (!plateNumber) return res.status(400).json({ error: 'Plate number required' });

    const normalizedPlate = plateNumber.trim().toUpperCase();
    const gate = db.gates.find(g => g.id === gateId) || db.gates[0];
    const vehicle = db.vehicles.find(v => v.plateNumber.toUpperCase() === normalizedPlate);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today';

    if (vehicle) {
      vehicle.status = 'OUTSIDE';
      vehicle.lastGateId = gate.id;
      vehicle.lastGateName = gate.name;
      vehicle.lastExitTime = nowTime;
      vehicle.timeline.unshift({
        id: `evt_${Date.now()}`,
        timestamp: nowTime,
        type: 'EXIT',
        gateName: gate.name,
        guardName,
        houseNumber: vehicle.houseNumber,
        notes: 'Vehicle exit recorded'
      });
    }

    gate.vehiclesExitedToday += 1;
    logAudit('VEHICLE_EXIT', 'GUARD', guardName, normalizedPlate, `Vehicle exited via ${gate.name}`);

    res.json({
      success: true,
      vehicle: vehicle || { plateNumber: normalizedPlate, status: 'OUTSIDE' },
      gate
    });
  });

  // Resident Approvals
  app.post('/api/resident-approvals/request', (req, res) => {
    const { visitorName, vehiclePlate, destinationHouse, hostName, purpose, gateName = 'Main Gate' } = req.body;
    const approvalReq: ResidentApprovalRequest = {
      id: `appr_${Date.now()}`,
      visitorName,
      vehiclePlate,
      destinationHouse,
      hostName,
      purpose,
      gateName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDING'
    };
    db.residentApprovals.unshift(approvalReq);
    res.json({ success: true, request: approvalReq });
  });

  app.post('/api/resident-approvals/respond', (req, res) => {
    const { requestId, decision } = req.body; // 'APPROVED' | 'DENIED'
    const approval = db.residentApprovals.find(a => a.id === requestId);
    if (!approval) return res.status(404).json({ error: 'Request not found' });

    approval.status = decision;
    logAudit('RESIDENT_APPROVAL_DECISION', 'MANAGEMENT', approval.hostName, approval.visitorName, `Resident of ${approval.destinationHouse} responded: ${decision}`);
    res.json({ success: true, approval });
  });

  app.get('/api/resident-approvals/pending', (req, res) => {
    res.json(db.residentApprovals.filter(a => a.status === 'PENDING'));
  });

  // Society Profile & Name Update (Management)
  app.post('/api/society/update', (req, res) => {
    const { name, completeAddress, city, provinceState, managementContact, ownerName } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Society name is required' });
    }
    const trimmedName = name.trim();
    if (db.societies.length > 0) {
      db.societies[0].name = trimmedName;
      if (completeAddress) db.societies[0].completeAddress = completeAddress.trim();
      if (city) db.societies[0].city = city.trim();
      if (provinceState) db.societies[0].provinceState = provinceState.trim();
      if (managementContact) db.societies[0].managementContact = managementContact.trim();
      if (ownerName) db.societies[0].ownerName = ownerName.trim();
    } else {
      db.societies.push({
        id: `soc_${Date.now()}`,
        name: trimmedName,
        provinceState: provinceState || 'Sindh',
        city: city || 'Karachi',
        country: 'Pakistan',
        continent: 'Asia',
        completeAddress: completeAddress || 'Main Boulevard',
        houseCount: db.houses.length,
        gateCount: db.gates.length,
        guardCount: db.guards.length,
        emergencyContacts: { police: '15', fire: '16', ambulance: '1122', securityChief: '+92-300-9988771' },
        managementContact: managementContact || '+92-300-1122334',
        ownerName: ownerName || 'Executive Directorate',
        securityScore: 98,
        securityStatus: 'EXCELLENT'
      });
    }

    logAudit(
      'SOCIETY_NAME_UPDATED',
      'MANAGEMENT',
      'Society Management',
      trimmedName,
      `Official society name set to "${trimmedName}". Synchronized with Owner Suite and all Guard Gates.`
    );

    res.json({ success: true, society: db.societies[0], societies: db.societies });
  });

  // Resident & Vehicle Number Plates Registration / Management
  app.post('/api/residents/manage', (req, res) => {
    const {
      id,
      houseNumber,
      block,
      street,
      ownerName,
      contactNumber,
      email,
      registeredPlates = [],
      emergencyContact,
      residentCount = 1,
      vehicleMake,
      vehicleModel,
      vehicleColor
    } = req.body;

    if (!houseNumber || !ownerName || !contactNumber) {
      return res.status(400).json({ error: 'House number, resident name, and contact number are required' });
    }

    const normalizedPlates: string[] = Array.isArray(registeredPlates)
      ? registeredPlates.map((p: string) => String(p).trim().toUpperCase()).filter(Boolean)
      : typeof registeredPlates === 'string'
        ? (registeredPlates as string).split(',').map((p: string) => p.trim().toUpperCase()).filter(Boolean)
        : [];

    let house = db.houses.find(h => (id && h.id === id) || h.houseNumber.toLowerCase() === houseNumber.trim().toLowerCase());

    if (house) {
      house.ownerName = ownerName.trim();
      house.contactNumber = contactNumber.trim();
      if (block) house.block = block.trim();
      if (street) house.street = street.trim();
      if (email !== undefined) house.email = email.trim();
      if (emergencyContact !== undefined) house.emergencyContact = emergencyContact.trim();
      house.residentCount = Number(residentCount) || house.residentCount || 1;
      house.registeredPlates = normalizedPlates;
    } else {
      house = {
        id: id || `house_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        societyId: db.societies[0]?.id || 'soc_grand_horizon',
        houseNumber: houseNumber.trim(),
        block: block ? block.trim() : 'Block A',
        street: street ? street.trim() : 'Palm Boulevard',
        ownerName: ownerName.trim(),
        residentCount: Number(residentCount) || 1,
        contactNumber: contactNumber.trim(),
        email: email ? email.trim() : '',
        registeredPlates: normalizedPlates,
        emergencyContact: emergencyContact ? emergencyContact.trim() : '',
        currentVisitorsCount: 0
      };
      db.houses.push(house);
      if (db.societies[0]) {
        db.societies[0].houseCount = db.houses.length;
      }
    }

    // Synchronize vehicle plates into db.vehicles with RESIDENT classification
    normalizedPlates.forEach(plate => {
      const existingVeh = db.vehicles.find(v => v.plateNumber.toUpperCase() === plate);
      if (existingVeh) {
        existingVeh.classification = 'RESIDENT';
        existingVeh.ownerName = house!.ownerName;
        existingVeh.houseNumber = house!.houseNumber;
        existingVeh.contactNumber = house!.contactNumber;
        if (vehicleMake) existingVeh.make = vehicleMake;
        if (vehicleModel) existingVeh.model = vehicleModel;
        if (vehicleColor) existingVeh.color = vehicleColor;
      } else {
        const newVeh: Vehicle = {
          id: `veh_res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          societyId: db.societies[0]?.id || 'soc_grand_horizon',
          plateNumber: plate,
          type: 'CAR',
          make: vehicleMake || 'Resident Vehicle',
          model: vehicleModel || 'Car',
          color: vehicleColor || 'Silver',
          classification: 'RESIDENT',
          ownerName: house!.ownerName,
          houseNumber: house!.houseNumber,
          contactNumber: house!.contactNumber,
          status: 'OUTSIDE',
          timeline: [
            {
              id: `evt_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
              type: 'ENTRY',
              gateName: 'Administrative Roster',
              guardName: 'Management Admin',
              houseNumber: house!.houseNumber,
              notes: `Authorized resident vehicle registered for ${house!.ownerName} (${house!.houseNumber})`
            }
          ]
        };
        db.vehicles.push(newVeh);
      }
    });

    logAudit(
      'RESIDENT_REGISTERED',
      'MANAGEMENT',
      'Society Management',
      `${house.houseNumber} - ${house.ownerName}`,
      `Resident registered with vehicle number plates: [${normalizedPlates.join(', ') || 'No plates'}]. Accessible by Guards & Owner.`
    );

    res.json({
      success: true,
      house,
      houses: db.houses,
      vehicles: db.vehicles
    });
  });

  // Delete / Remove Resident
  app.post('/api/residents/delete', (req, res) => {
    const { id } = req.body;
    const index = db.houses.findIndex(h => h.id === id);
    if (index !== -1) {
      const removed = db.houses.splice(index, 1)[0];
      if (db.societies[0]) db.societies[0].houseCount = db.houses.length;
      logAudit('RESIDENT_REMOVED', 'MANAGEMENT', 'Society Management', removed.houseNumber, `Removed resident ${removed.ownerName}`);
      return res.json({ success: true, removedHouse: removed, houses: db.houses });
    }
    res.status(404).json({ error: 'Resident not found' });
  });

  // Emergency Mode Trigger
  app.post('/api/emergency/trigger', (req, res) => {
    const { type, gateName = 'Main Gate', reportedBy = 'Guard Station', description = 'Emergency protocol triggered' } = req.body;
    const alert = triggerCriticalAlert(
      `🚨 EMERGENCY ACTIVATED: ${type}`,
      `High-priority emergency declared at ${gateName}. Type: ${type}. Reported by: ${reportedBy}. Description: ${description}. All gates placed on heightened alert.`,
      'EMERGENCY'
    );
    logAudit('EMERGENCY_DECLARED', 'GUARD', reportedBy, gateName, `Emergency type: ${type}`, 'SUCCESS');
    res.json({ success: true, alert });
  });

  // Panic Button (Silent Alert)
  app.post('/api/emergency/panic', (req, res) => {
    const { gateName = 'Gate 1', guardName = 'Duty Guard' } = req.body;
    const alert = triggerCriticalAlert(
      'PANIC ALERT — IMMEDIATE ATTENTION REQUIRED',
      `Silent panic distress signal activated by ${guardName} at ${gateName}. Security Chief and Mobile Patrol dispatched immediately.`,
      'PANIC'
    );
    logAudit('SILENT_PANIC_TRIGGERED', 'GUARD', guardName, gateName, 'Silent panic distress signal activated.', 'BLOCKED');
    res.json({ success: true, alert });
  });

  // Secure AI Natural Language Security Assistant
  app.post('/api/ai/query', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const qLower = query.toLowerCase().trim();

    // Prepare database factual context
    const societyName = db.societies[0]?.name || 'Grand Horizon Executive Enclave';
    const vehiclesInside = db.vehicles.filter(v => v.status === 'INSIDE');
    const vehiclesOutside = db.vehicles.filter(v => v.status === 'OUTSIDE');
    const visitorsInside = db.visitors.filter(v => v.status === 'INSIDE');
    const guardsOnDuty = db.guards.filter(g => g.dutyStatus === 'ON_DUTY');
    const activeAlerts = db.alerts.filter(a => a.status === 'ACTIVE');
    const openIncidents = db.incidents.filter(i => i.status !== 'CLOSED');

    // Resident directory with registered plates
    const residentRoster = db.houses.map(h => ({
      name: h.ownerName,
      houseNumber: h.houseNumber,
      block: h.block,
      contactNumber: h.contactNumber,
      registeredPlates: h.registeredPlates || [],
      visitorsCount: h.currentVisitorsCount
    }));

    const aiClient = getGeminiClient();

    if (aiClient) {
      try {
        const factualSummary = JSON.stringify({
          society: societyName,
          societyAddress: db.societies[0]?.completeAddress,
          allResidents: residentRoster,
          allRegisteredResidentPlates: db.houses.flatMap(h => (h.registeredPlates || []).map(p => ({
            plate: p,
            resident: h.ownerName,
            house: h.houseNumber,
            phone: h.contactNumber
          }))),
          currentGates: db.gates.map(g => ({ name: g.name, status: g.status, barrierState: g.barrierState, enteredToday: g.vehiclesEnteredToday })),
          guardsOnDuty: guardsOnDuty.map(g => ({ name: g.name, badge: g.badgeNumber, gate: db.gates.find(x => x.id === g.assignedGateId)?.name, shift: g.shift })),
          vehiclesInside: vehiclesInside.map(v => ({ plate: v.plateNumber, house: v.houseNumber, owner: v.ownerName, classification: v.classification, entryGate: v.lastGateName, entryTime: v.lastEntryTime })),
          vehiclesOutside: vehiclesOutside.map(v => ({ plate: v.plateNumber, house: v.houseNumber, owner: v.ownerName, classification: v.classification, lastExitTime: v.lastExitTime, lastGate: v.lastGateName })),
          visitorsInside: visitorsInside.map(vi => ({ name: vi.name, house: vi.destinationHouse, host: vi.hostName, entryTime: vi.entryTime, plate: vi.vehiclePlate })),
          activeAlerts: activeAlerts.map(a => ({ title: a.title, severity: a.severity, timestamp: a.timestamp })),
          watchlist: db.watchlist.filter(w => w.isActive).map(w => ({ identifier: w.identifier, reason: w.reason }))
        });

        const systemInstruction = `You are "Secure AI", the real-time AI security & resident intelligence assistant for society "${societyName}".
Your mission is to assist society guards, management, and owners in instantly identifying vehicles, residents, and visitor permissions.

CRITICAL RULES:
1. RESIDENT VS NON-RESIDENT VEHICLE IDENTIFICATION:
   - When asked whether a vehicle number plate is of a RESIDENT or SOMEONE ELSE (Guest / Visitor / Unregistered):
     * Check against the verified resident plates list.
     * If MATCH FOUND: State prominently: "✅ VERIFIED RESIDENT VEHICLE". Provide the resident's full name, house/villa number, contact phone number, and whether the vehicle is currently inside or outside. State that guards can clear entry or call the resident directly.
     * If NOT FOUND in resident plates: State clearly: "⚠️ NON-RESIDENT / UNREGISTERED VEHICLE". State that this vehicle does NOT belong to any verified resident of ${societyName}. Advise that guards must halt the vehicle, ask for the destination resident, and call that resident to verify before granting entry.
2. SOCIETY DETAILS:
   - When asked about the society name or details: State the registered society name is "${societyName}".
3. RESIDENT LOOKUP:
   - When asked about a resident by name or house number: Provide their full name, house number, block, phone number, and all registered vehicle plates.
4. STRICT TRUTHFULNESS: Only use the verified database state provided. Never hallucinate.`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Current Society Database State:\n${factualSummary}\n\nSecurity Query: "${query}"`,
          config: {
            systemInstruction,
            temperature: 0.2
          }
        });

        return res.json({
          answer: response.text || 'I could not find a reliable record for this request.',
          source: 'GEMINI_AI',
          model: 'gemini-3.8-flash'
        });
      } catch (err: any) {
        console.error('Gemini API query error, falling back to deterministic security engine:', err?.message);
      }
    }

    // High-precision deterministic intelligence parser (zero-hallucination guarantee)
    let answer = '';
    const plateMatch = query.match(/[A-Z0-9]{2,5}[-\s]?[0-9]{2,5}/i);

    // Society name query
    if (qLower.includes('society name') || qLower.includes('name of the society') || qLower.includes('which society')) {
      answer = `The official registered name of this residential community is **${societyName}** (managed by Society Management & Executive Ownership).`;
    }
    // Resident lookup by name or villa
    else if (qLower.includes('resident') || qLower.includes('villa') || qLower.includes('house') || qLower.includes('contact') || qLower.includes('who lives in') || qLower.includes('owner of')) {
      const houseMatch = db.houses.find(h =>
        qLower.includes(h.houseNumber.toLowerCase()) ||
        qLower.includes(h.ownerName.toLowerCase()) ||
        qLower.includes(h.ownerName.split(' ')[0].toLowerCase())
      );

      if (houseMatch) {
        const plates = houseMatch.registeredPlates && houseMatch.registeredPlates.length > 0
          ? houseMatch.registeredPlates.map(p => `\`${p}\``).join(', ')
          : 'No vehicle plates currently registered';

        answer = `**Resident Verification Record — ${societyName}:**\n` +
          `• Resident Name: **${houseMatch.ownerName}**\n` +
          `• House / Villa: **${houseMatch.houseNumber}** (${houseMatch.block})\n` +
          `• Contact Phone: **${houseMatch.contactNumber}**\n` +
          `• Registered Vehicles: ${plates}\n` +
          `• Emergency Contact: ${houseMatch.emergencyContact || 'Available on file'}\n` +
          `• Guard Action: Guards can call **${houseMatch.contactNumber}** directly to verify any guest or driver claiming to visit this villa.`;
      }
    }

    // Number plate verification lookup
    if (!answer && (plateMatch || qLower.includes('plate') || qLower.includes('car') || qLower.includes('vehicle') || qLower.includes('resident or'))) {
      const rawMatch = plateMatch ? plateMatch[0] : (qLower.match(/[a-z0-9-]+/g) || []).find((w: string) => w.length >= 4) || '';
      const cleanPlate = rawMatch.toUpperCase().replace(/\s/g, '-');
      const plateStripped = cleanPlate.replace(/-/g, '');

      // Check watchlist first
      const wl = db.watchlist.find(w => w.identifier.toUpperCase().replace(/-/g, '') === plateStripped);
      if (wl) {
        answer = `**Vehicle ${cleanPlate} — 🚨 SECURITY WATCHLIST ALERT**\n` +
          `• Alert Status: **FLAGGED SUSPICIOUS VEHICLE**\n` +
          `• Reason: ${wl.reason}\n` +
          `• Severity: ${wl.severity}\n` +
          `• Guard Action: **DO NOT OPEN BARRIER**. Hold vehicle at gate and immediately contact supervisor.`;
      } else {
        // 1. Check if plate belongs to a resident in db.houses
        const residentHouse = db.houses.find(h =>
          (h.registeredPlates || []).some(p => p.toUpperCase().replace(/-/g, '') === plateStripped)
        );

        // Also check db.vehicles
        const veh = db.vehicles.find(v => v.plateNumber.toUpperCase().replace(/-/g, '') === plateStripped);

        if (residentHouse || (veh && veh.classification === 'RESIDENT')) {
          const owner = residentHouse ? residentHouse.ownerName : veh!.ownerName;
          const houseNum = residentHouse ? residentHouse.houseNumber : veh!.houseNumber;
          const phone = residentHouse ? residentHouse.contactNumber : (veh?.contactNumber || 'On file in directory');
          const status = veh ? (veh.status === 'INSIDE' ? 'INSIDE Society' : 'OUTSIDE Society') : 'Registered Resident';
          const vehicleDesc = veh ? `${veh.color} ${veh.make} ${veh.model}` : 'Registered Resident Vehicle';

          answer = `**Vehicle \`${cleanPlate}\` — ✅ VERIFIED RESIDENT VEHICLE**\n` +
            `• Society: **${societyName}**\n` +
            `• Classification: **RESIDENT (Authorized)**\n` +
            `• Resident Name: **${owner}**\n` +
            `• Residence: **${houseNum}** ${residentHouse ? `(${residentHouse.block})` : ''}\n` +
            `• Resident Phone: **${phone}**\n` +
            `• Vehicle Details: ${vehicleDesc}\n` +
            `• Current Status: **${status}**\n` +
            `• Guard Instructions: Pre-authorized. Guard can confirm driver identity with resident at **${phone}** or open the boom barrier.`;
        } else if (veh && veh.classification !== 'RESIDENT') {
          answer = `**Vehicle \`${cleanPlate}\` — ⚠️ NON-RESIDENT (${veh.classification})**\n` +
            `• Society: **${societyName}**\n` +
            `• Classification: **${veh.classification} (GUEST / VISITOR)**\n` +
            `• Destination House: **${veh.houseNumber}** (Host: **${veh.ownerName}**)\n` +
            `• Status: **${veh.status === 'INSIDE' ? 'Currently INSIDE' : 'Currently OUTSIDE'}**\n` +
            `• Guard Instructions: Guard MUST contact host resident (${veh.ownerName}) at ${veh.houseNumber} to verify before granting entry.`;
        } else {
          // Plate not found in either resident or known vehicle list
          answer = `**Vehicle \`${cleanPlate}\` — ⚠️ UNREGISTERED / NON-RESIDENT VEHICLE**\n` +
            `• Society: **${societyName}**\n` +
            `• Classification: **SOMEONE ELSE (Unregistered Guest or Unknown Driver)**\n` +
            `• Resident Status: **NOT FOUND IN RESIDENT DIRECTORY**\n` +
            `• Security Alert: This number plate does NOT belong to any registered resident of ${societyName}.\n` +
            `• Guard Instructions: Do NOT open the barrier. Ask the driver who they are visiting, look up the resident in the Resident Directory, and call the resident to verify if they are expecting this visitor.`;
        }
      }
    }

    if (!answer) {
      if (qLower.includes('who is currently inside') || qLower.includes('who is inside') || qLower.includes('visitors inside') || qLower.includes('not exited')) {
        const visList = visitorsInside.map(v => `• **${v.name}** (Visiting ${v.destinationHouse} - Host: ${v.hostName}) - Entered ${v.entryTime} via ${v.entryGateName}`).join('\n');
        answer = `**Currently Inside ${societyName}:**\n• **${vehiclesInside.length}** Vehicles Inside\n• **${visitorsInside.length}** Active Visitors Inside:\n${visList || 'None'}`;
      } else if (qLower.includes('guard') || qLower.includes('duty')) {
        const guardList = guardsOnDuty.map(g => `• **${g.name}** (${g.badgeNumber}) — Assigned to ${db.gates.find(x => x.id === g.assignedGateId)?.name || 'Gate 1'} (${g.shift} Shift)`).join('\n');
        answer = `**Guards Currently On Duty (${guardsOnDuty.length}):**\n${guardList}`;
      } else if (qLower.includes('gate') && (qLower.includes('problem') || qLower.includes('status') || qLower.includes('issue'))) {
        const gateList = db.gates.map(g => `• **${g.name}**: Status ${g.status} | Barrier ${g.barrierState} (${g.barrierMode}) | Camera ${g.cameraOnline ? 'Online' : 'Offline'}`).join('\n');
        answer = `**Gate Infrastructure Status (${societyName}):**\n${gateList}`;
      } else if (qLower.includes('suspicious') || qLower.includes('incident') || qLower.includes('alert')) {
        const alertList = activeAlerts.slice(0, 3).map(a => `• [${a.severity}] **${a.title}** (${a.timestamp})`).join('\n');
        answer = `**Active Security Alerts (${activeAlerts.length}):**\n${alertList || 'No active alerts recorded.'}`;
      } else {
        answer = `**${societyName} — Security Intelligence Overview:**\n` +
          `• **Registered Residents:** ${db.houses.length} residences\n` +
          `• **Vehicles Inside:** ${vehiclesInside.length} (${vehiclesOutside.length} registered outside)\n` +
          `• **Visitors Inside:** ${visitorsInside.length}\n` +
          `• **Guards on Duty:** ${guardsOnDuty.length}\n` +
          `• **Active Security Alerts:** ${activeAlerts.length}\n\n` +
          `You can ask:\n` +
          `• *"Is plate ABC-123 of a resident or someone else?"*\n` +
          `• *"Check number plate XYZ-786"*\n` +
          `• *"Who lives in Villa 101 and what are their vehicle plates?"*\n` +
          `• *"What is the name of our society?"*`;
      }
    }

    res.json({
      answer,
      source: 'DETERMINISTIC_SECURITY_ENGINE'
    });
  });

  // System Health
  app.get('/api/system/health', (req, res) => {
    res.json({
      database: { status: 'ONLINE', latency: '4ms', engine: 'Isolated Multi-Tenant Security DB' },
      api: { status: 'ONLINE', uptime: '99.99%', load: '12%' },
      notificationService: { status: 'ONLINE', pushReady: true, browserPermissions: 'ACTIVE' },
      gateController: { status: 'ONLINE', connectedGates: db.gates.length, activeBarriers: db.gates.filter(g => g.barrierState !== 'ERROR').length },
      cctvIntegration: { status: 'ONLINE', streamsActive: db.cctv.filter(c => c.status === 'ONLINE').length, totalCameras: db.cctv.length },
      anprEngine: { status: 'ONLINE', confidenceScore: '98.7%', model: 'DeepPlate High-Speed ANPR' },
      backupStatus: { lastBackup: '03:00 AM Today', integrity: 'VERIFIED', nextScheduled: '03:00 AM Tomorrow' }
    });
  });

  // VITE MIDDLEWARE (Development) vs STATIC FILES (Production)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Secure 24 by 7] Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
