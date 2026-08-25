import { 
  collection, doc, getDocs, getDoc, setDoc, query, where, runTransaction 
} from 'firebase/firestore';
import { db } from './firebase';
import type { AttendanceLogDocument, BusPassDocument } from '../types';
import { logAuditEvent } from './auditService';
import { getLocalPasses } from './passService';

export interface VerificationResult {
  valid: boolean;
  resultType: 'VALID' | 'INVALID' | 'ALREADY_SCANNED';
  message: string;
  reason?: string;
  student?: {
    name: string;
    regNo: string;
    route: string;
    stop: string;
    fromLocationName?: string;
    toLocationName?: string;
    department?: string;
    college?: string;
    phoneNumber?: string;
    passId?: string;
    passType?: string;
    amount?: number;
    paymentRef?: string;
    issueDate?: number;
    validUntil: number;
    formattedStartDate?: string;
    formattedExpiryDate?: string;
    daysRemaining?: number;
    durationText?: string;
    status: string;
  };
}

export const verifyAndLogAttendance = async (
  rawPayload: string,
  conductorInfo: { id: string; name: string; busId: string; busNumber: string; routeId: string; tripId?: string },
  scanMethod: 'QR_SCAN' | 'MANUAL_ENTRY' | 'CONDUCTOR_OVERRIDE' = 'QR_SCAN'
): Promise<VerificationResult> => {
  try {
    let targetPassId: string | null = null;
    let targetRegNo: string | null = null;

    const trimmed = rawPayload.trim();

    // Decode QR payload (Lightweight JSON or raw string reference)
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        targetPassId = parsed.passId || parsed.id || null;
        targetRegNo = parsed.regNo || parsed.registerNumber || null;
      } catch (e) {
        console.warn('JSON parse error in QR:', e);
      }
    } else if (trimmed.startsWith('PASS-')) {
      targetPassId = trimmed;
    } else if (trimmed.startsWith('REG-') || trimmed.length >= 4) {
      targetRegNo = trimmed;
    }

    // 1. Fetch pass from Firestore as Source of Truth
    let foundPass: BusPassDocument | null = null;

    if (targetPassId) {
      try {
        const passRef = doc(db, 'busPasses', targetPassId);
        const passSnap = await getDoc(passRef);
        if (passSnap.exists()) {
          foundPass = passSnap.data() as BusPassDocument;
        }
      } catch (e) {
        console.warn('Firestore pass lookup note:', e);
      }

      if (!foundPass) {
        const localList = getLocalPasses();
        foundPass = localList.find(p => p.id === targetPassId) || null;
      }
    }

    if (!foundPass && targetRegNo) {
      try {
        const passSnap = await getDocs(
          query(collection(db, 'busPasses'), where('registerNumber', '==', targetRegNo))
        );
        if (!passSnap.empty) {
          foundPass = passSnap.docs[0].data() as BusPassDocument;
        }
      } catch (e) {
        console.warn('Firestore regNo pass lookup note:', e);
      }

      if (!foundPass) {
        const localList = getLocalPasses();
        foundPass = localList.find(p => p.registerNumber.toLowerCase() === targetRegNo!.toLowerCase()) || null;
      }
    }

    // Pass Not Found
    if (!foundPass) {
      return { 
        valid: false,
        resultType: 'INVALID', 
        message: '✕ Invalid QR Code',
        reason: 'Please scan a valid eRoute student QR code.'
      };
    }

    // Dates formatting
    const startDate = foundPass.issueDate || foundPass.createdAt || Date.now();
    const expiryDate = foundPass.validUntil || (startDate + 30 * 24 * 60 * 60 * 1000);
    const now = Date.now();

    const formattedStartDate = new Date(startDate).toLocaleDateString('en-GB');
    const formattedExpiryDate = new Date(expiryDate).toLocaleDateString('en-GB');
    const daysRemaining = Math.max(0, Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)));
    const durationMonths = foundPass.durationMonths || 1;
    const durationText = `${durationMonths} Month${durationMonths > 1 ? 's' : ''}`;

    const fromLoc = foundPass.fromLocation?.name || foundPass.fromStopName || foundPass.stopName || 'Origin';
    const toLoc = foundPass.toLocation?.name || foundPass.toStopName || 'Destination';

    const studentInfo = {
      name: foundPass.studentName,
      regNo: foundPass.registerNumber,
      route: foundPass.routeName,
      stop: foundPass.stopName,
      fromLocationName: fromLoc,
      toLocationName: toLoc,
      department: foundPass.department,
      college: foundPass.college,
      phoneNumber: foundPass.phoneNumber,
      passId: foundPass.id,
      passType: foundPass.passType,
      amount: foundPass.totalFare || foundPass.amount,
      paymentRef: foundPass.paymentRef,
      issueDate: startDate,
      validUntil: expiryDate,
      formattedStartDate,
      formattedExpiryDate,
      daysRemaining,
      durationText,
      status: foundPass.status
    };

    // 2. Validate Status (Case-Insensitive)
    const passSt = (foundPass.status || '').toLowerCase();
    if (passSt === 'pending') {
      return {
        valid: false,
        resultType: 'INVALID',
        message: '✕ Pass Pending Approval',
        reason: 'Pass payment not verified / awaiting Admin approval.',
        student: studentInfo
      };
    }

    if (passSt === 'rejected') {
      return {
        valid: false,
        resultType: 'INVALID',
        message: '✕ Pass Rejected',
        reason: foundPass.rejectionReason 
          ? `Pass application rejected: ${foundPass.rejectionReason}`
          : 'Pass application rejected by Transport Office.',
        student: studentInfo
      };
    }

    if (passSt === 'cancelled') {
      return {
        valid: false,
        resultType: 'INVALID',
        message: '✕ Pass Cancelled',
        reason: 'This bus pass has been cancelled.',
        student: studentInfo
      };
    }

    if (passSt !== 'issued' && passSt !== 'approved') {
      return {
        valid: false,
        resultType: 'INVALID',
        message: '✕ Invalid Pass Status',
        reason: `Pass status is "${foundPass.status}". Boarding not authorized.`,
        student: studentInfo
      };
    }

    // 3. Validate Date / Expiry
    if (now > expiryDate) {
      return {
        valid: false,
        resultType: 'INVALID',
        message: '✕ Pass Expired',
        reason: `This bus pass expired on ${formattedExpiryDate}.`,
        student: { ...studentInfo, status: 'Expired' }
      };
    }

    if (now < startDate) {
      return {
        valid: false,
        resultType: 'INVALID',
        message: '✕ Pass Not Yet Active',
        reason: `Pass is not yet active (Active from ${formattedStartDate}).`,
        student: studentInfo
      };
    }

    // 4. Deterministic Trip Isolation & Atomic Transaction
    const activeTripId = conductorInfo.tripId || `TRIP-${new Date().toISOString().split('T')[0]}`;
    const studentUserId = foundPass.userId || foundPass.registerNumber || foundPass.id;
    const docId = `${activeTripId}_${studentUserId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const logRef = doc(db, 'attendanceLogs', docId);

    const attendanceRecord: AttendanceLogDocument = {
      id: docId,
      userId: studentUserId,
      studentName: foundPass.studentName,
      registerNumber: foundPass.registerNumber,
      passId: foundPass.id,
      tripId: activeTripId,
      busId: conductorInfo.busId,
      busNumber: conductorInfo.busNumber,
      routeId: conductorInfo.routeId,
      stopName: foundPass.stopName,
      scanTimestamp: now,
      scanMethod,
      conductorId: conductorInfo.id,
      status: 'Present',
      createdAt: now
    };

    let isAlreadyScanned = false;

    try {
      await runTransaction(db, async (transaction) => {
        const logSnap = await transaction.get(logRef);
        if (logSnap.exists()) {
          isAlreadyScanned = true;
          return;
        }
        transaction.set(logRef, attendanceRecord);
      });
    } catch (txErr) {
      console.warn('Transaction write note, falling back to deterministic setDoc:', txErr);
      try {
        const logSnap = await getDoc(logRef);
        if (logSnap.exists()) {
          isAlreadyScanned = true;
        } else {
          await setDoc(logRef, attendanceRecord);
        }
      } catch (e) {
        console.warn('Fallback setDoc error:', e);
      }
    }

    // Check local storage sync
    const LOCAL_ATT_KEY = 'eroute_local_attendance';
    try {
      const existingLogs: AttendanceLogDocument[] = JSON.parse(localStorage.getItem(LOCAL_ATT_KEY) || '[]');
      const alreadyInLocal = existingLogs.some(l => l.id === docId || (l.userId === studentUserId && l.tripId === activeTripId));
      if (alreadyInLocal) {
        isAlreadyScanned = true;
      } else if (!isAlreadyScanned) {
        existingLogs.unshift(attendanceRecord);
        localStorage.setItem(LOCAL_ATT_KEY, JSON.stringify(existingLogs));
      }
    } catch (e) {
      console.warn(e);
    }

    if (isAlreadyScanned) {
      return {
        valid: false,
        resultType: 'ALREADY_SCANNED',
        message: '! Already Scanned',
        reason: 'Attendance for this student has already been recorded for this trip.',
        student: studentInfo
      };
    }

    logAuditEvent(
      conductorInfo.id,
      conductorInfo.name,
      'conductor',
      'MARK_ATTENDANCE',
      'attendanceLogs',
      docId,
      { studentName: foundPass.studentName, regNo: foundPass.registerNumber, busNumber: conductorInfo.busNumber, tripId: activeTripId }
    ).catch(() => null);

    return {
      valid: true,
      resultType: 'VALID',
      message: '✓ Attendance Marked',
      student: studentInfo
    };
  } catch (err: any) {
    console.error('Error during pass verification:', err);
    return { 
      valid: false, 
      resultType: 'INVALID', 
      message: '✕ Invalid Pass',
      reason: `Verification error: ${err.message || 'Unknown error'}`
    };
  }
};

export const getStudentAttendanceHistory = async (userId: string): Promise<AttendanceLogDocument[]> => {
  const q = query(collection(db, 'attendanceLogs'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceLogDocument));
  logs.sort((a, b) => b.scanTimestamp - a.scanTimestamp);
  return logs;
};

export const getAllAttendanceLogs = async (filters?: { busId?: string; routeId?: string; dateStart?: number; dateEnd?: number }): Promise<AttendanceLogDocument[]> => {
  const snap = await getDocs(collection(db, 'attendanceLogs'));
  let logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceLogDocument));
  
  if (filters?.busId) logs = logs.filter(l => l.busId === filters.busId);
  if (filters?.routeId) logs = logs.filter(l => l.routeId === filters.routeId);
  if (filters?.dateStart) logs = logs.filter(l => l.scanTimestamp >= filters.dateStart!);
  if (filters?.dateEnd) logs = logs.filter(l => l.scanTimestamp <= filters.dateEnd!);

  logs.sort((a, b) => b.scanTimestamp - a.scanTimestamp);
  return logs;
};
