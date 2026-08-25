import { 
  collection, doc, getDocs, setDoc, updateDoc, query, where, onSnapshot
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { BusPassDocument, PassStatus } from '../types';
import { logAuditEvent } from './auditService';
import { validateFullName, validateRegisterNumber } from '../utils/studentValidation';
import QRCode from 'qrcode';

const LOCAL_PASSES_KEY = 'eroute_local_bus_passes';

export const generateQRCodeDataUrl = async (text: string): Promise<string> => {
  console.log('QR_GENERATION_START');
  try {
    const res = await QRCode.toDataURL(text, { margin: 1, width: 250 });
    if (res) console.log('QR_GENERATION_SUCCESS');
    return res;
  } catch (e) {
    console.warn('QR generation error:', e);
    return '';
  }
};

export const getLocalPasses = (): BusPassDocument[] => {
  try {
    const saved = localStorage.getItem(LOCAL_PASSES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveLocalPass = (pass: BusPassDocument) => {
  try {
    const list = getLocalPasses().filter(p => p.id !== pass.id);
    list.unshift(pass);
    localStorage.setItem(LOCAL_PASSES_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('eroute_pass_updated'));
  } catch (e) {
    console.warn(e);
  }
};

export const getBusPasses = async (statusFilter?: PassStatus): Promise<BusPassDocument[]> => {
  let cloud: BusPassDocument[] = [];
  try {
    const snap = await getDocs(collection(db, 'busPasses'));
    cloud = snap.docs.map(d => ({ id: d.id, ...d.data() } as BusPassDocument));
  } catch (e) {
    console.warn('Firestore pass fetch note:', e);
  }

  const local = getLocalPasses();
  const map = new Map<string, BusPassDocument>();
  local.forEach(p => map.set(p.id, p));
  cloud.forEach(p => map.set(p.id, p));
  let passes = Array.from(map.values());
  passes.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

  if (!statusFilter) return passes;
  const lowerFilter = statusFilter.toLowerCase();
  return passes.filter(p => {
    const st = (p.status || '').toLowerCase();
    if (lowerFilter === 'pending') return st === 'pending';
    if (lowerFilter === 'issued' || lowerFilter === 'approved') return st === 'approved' || st === 'issued';
    if (lowerFilter === 'rejected') return st === 'rejected';
    return st === lowerFilter;
  });
};

export const subscribeBusPasses = (
  callback: (passes: BusPassDocument[]) => void,
  statusFilter?: PassStatus
): Unsubscribe => {
  console.log('ADMIN_PENDING_QUERY');
  const q = collection(db, 'busPasses');
  
  const notify = (cloudDocs: BusPassDocument[]) => {
    const localPasses = getLocalPasses();
    const map = new Map<string, BusPassDocument>();
    localPasses.forEach(p => map.set(p.id, p));
    cloudDocs.forEach(p => map.set(p.id, p));
    let passes = Array.from(map.values());
    passes.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

    if (statusFilter) {
      const lower = statusFilter.toLowerCase();
      passes = passes.filter(p => {
        const st = (p.status || '').toLowerCase();
        if (lower === 'pending') return st === 'pending';
        if (lower === 'issued' || lower === 'approved') return st === 'approved' || st === 'issued';
        if (lower === 'rejected') return st === 'rejected';
        return st === lower;
      });
    }
    const pendingCount = passes.filter(p => (p.status || '').toLowerCase() === 'pending').length;
    if (pendingCount > 0) {
      console.log('ADMIN_PENDING_FOUND:', pendingCount);
    }
    callback(passes);
  };

  let currentCloudDocs: BusPassDocument[] = [];

  const handleLocalUpdate = () => {
    notify(currentCloudDocs);
  };
  window.addEventListener('eroute_pass_updated', handleLocalUpdate);

  const unsub = onSnapshot(q, (snap) => {
    currentCloudDocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as BusPassDocument));
    notify(currentCloudDocs);
  }, (err) => {
    console.warn('subscribeBusPasses error:', err);
    notify([]);
  });

  return () => {
    window.removeEventListener('eroute_pass_updated', handleLocalUpdate);
    unsub();
  };
};

export const getStudentPass = async (userId: string): Promise<BusPassDocument | null> => {
  console.log('STUDENT_APPROVED_PASS_QUERY');
  try {
    const q1 = query(collection(db, 'busPasses'), where('userId', '==', userId));
    const snap1 = await getDocs(q1);
    let passes: BusPassDocument[] = snap1.docs.map(d => ({ id: d.id, ...d.data() } as BusPassDocument));
    
    if (passes.length === 0) {
      const q2 = query(collection(db, 'busPasses'), where('studentUid', '==', userId));
      const snap2 = await getDocs(q2);
      passes = snap2.docs.map(d => ({ id: d.id, ...d.data() } as BusPassDocument));
    }

    if (passes.length > 0) {
      passes.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
      const latest = passes[0];
      const st = (latest.status || '').toLowerCase();
      if (st === 'approved' || st === 'issued') {
        console.log('STUDENT_APPROVED_PASS_FOUND');
      }
      return latest;
    }
  } catch (e) {
    console.warn('Firestore student pass note:', e);
  }

  const local = getLocalPasses().find(p => p.userId === userId || p.studentUid === userId);
  return local || null;
};

export const subscribeStudentPass = (
  userId: string,
  callback: (pass: BusPassDocument | null) => void
): Unsubscribe => {
  console.log('STUDENT_APPROVED_PASS_QUERY');
  try {
    const q = query(collection(db, 'busPasses'), where('userId', '==', userId));
    return onSnapshot(q, (snap) => {
      const userPasses = snap.docs.map(d => ({ id: d.id, ...d.data() } as BusPassDocument));
      if (userPasses.length > 0) {
        userPasses.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
        const latest = userPasses[0];
        const st = (latest.status || '').toLowerCase();
        if (st === 'approved' || st === 'issued') {
          console.log('STUDENT_APPROVED_PASS_FOUND');
        }
        callback(latest);
      } else {
        const local = getLocalPasses().find(p => p.userId === userId || p.studentUid === userId);
        callback(local || null);
      }
    }, (err) => {
      console.warn('subscribeStudentPass error:', err);
      const local = getLocalPasses().find(p => p.userId === userId || p.studentUid === userId);
      callback(local || null);
    });
  } catch (err) {
    console.warn('subscribeStudentPass setup error:', err);
    const local = getLocalPasses().find(p => p.userId === userId || p.studentUid === userId);
    callback(local || null);
    return () => {};
  }
};

export const uploadPassDocument = async (userId: string, file: File, docType: 'idProof' | 'receipt'): Promise<string> => {
  const readLocalBase64 = (): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `pass_documents/${userId}_${docType}_${Date.now()}.${fileExt}`;
    const fileRef = ref(storage, filePath);

    const uploadPromise = (async () => {
      await uploadBytes(fileRef, file);
      return await getDownloadURL(fileRef);
    })();

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Storage upload timeout')), 3000)
    );

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (err) {
    console.warn('Falling back to local base64 preview for document:', err);
    return await readLocalBase64();
  }
};

export const addCalendarMonths = (startDateMs: number, monthsCount: number): number => {
  const d = new Date(startDateMs);
  d.setMonth(d.getMonth() + (monthsCount || 1));
  return d.getTime();
};

export const applyForBusPass = async (
  passData: Omit<BusPassDocument, 'id' | 'status' | 'qrPayload' | 'issueDate' | 'validUntil' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  console.log('BUS_PASS_APPLICATION_START');

  // Duplicate Check: ensure student doesn't already have an active PENDING or APPROVED pass
  const existingPass = await getStudentPass(passData.userId);
  if (existingPass) {
    const st = (existingPass.status || '').toUpperCase();
    const isExpired = existingPass.validUntil ? Date.now() > existingPass.validUntil : false;
    if (st === 'PENDING') {
      throw new Error(`You already have a PENDING bus pass application (#${existingPass.id}) awaiting Transport Admin review.`);
    } else if ((st === 'APPROVED' || st === 'ISSUED') && !isExpired) {
      throw new Error(`You already have an active APPROVED bus pass (#${existingPass.id}). You can apply for a renewal after your current pass expires.`);
    }
  }

  // Backend Validation Guard
  const nameCheck = validateFullName(passData.studentName);
  if (!nameCheck.isValid) {
    throw new Error(nameCheck.error!);
  }

  const regCheck = validateRegisterNumber(passData.registerNumber);
  if (!regCheck.isValid) {
    throw new Error(regCheck.error!);
  }

  const passId = `PASS-${Date.now().toString().slice(-6)}`;
  const now = Date.now();
  
  const months = passData.durationMonths || 1;
  const validUntil = addCalendarMonths(now, months);

  const qrPayload = JSON.stringify({
    passId,
    userId: passData.userId,
    studentUid: passData.userId,
    regNo: regCheck.value,
    route: passData.routeName,
    stop: passData.stopName || passData.fromStopName || 'Origin',
    qrVersion: 1
  });

  const payload: BusPassDocument = {
    ...passData,
    studentUid: passData.userId,
    studentId: regCheck.value,
    studentName: nameCheck.value,
    studentEmail: passData.studentEmail || null,
    registerNumber: regCheck.value,
    route: passData.routeName,
    boardingPoint: passData.fromStopName || passData.stopName || 'Origin',
    destination: passData.toStopName || 'Destination',
    applicationDate: now,
    id: passId,
    status: 'PENDING',
    qrPayload,
    issueDate: now,
    validUntil,
    createdAt: now,
    updatedAt: now
  };

  // Convert undefined fields to null for Firestore setDoc compatibility
  const cleanPayload = Object.fromEntries(
    Object.entries(payload).map(([k, v]) => [k, v === undefined ? null : v])
  );

  saveLocalPass(payload);

  try {
    const firestorePromise = Promise.all([
      setDoc(doc(db, 'busPasses', passId), cleanPayload),
      updateDoc(doc(db, 'users', passData.userId), {
        activePassId: passId,
        assignedRouteId: passData.routeId,
        assignedStopId: passData.stopId,
        updatedAt: now
      }).catch(() => null)
    ]);
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000));
    await Promise.race([firestorePromise, timeoutPromise]);
  } catch (err) {
    console.warn('Firestore setDoc notice:', err);
  }

  console.log('BUS_PASS_APPLICATION_CREATED');
  console.log('BUS_PASS_ID:', passId);
  console.log('BUS_PASS_STATUS: PENDING');

  logAuditEvent(
    passData.userId, 
    regCheck.value, 
    'student', 
    'APPLY_BUS_PASS', 
    'busPasses', 
    passId, 
    { passType: passData.passType, route: passData.routeName }
  ).catch(() => null);

  return passId;
};

export const updatePassStatus = async (
  passId: string, 
  status: PassStatus, 
  adminUser: { id: string; email: string; role: string },
  rejectionReason?: string
): Promise<void> => {
  console.log('ADMIN_APPROVE_START');
  const now = Date.now();
  const normalizedStatus = (status === 'Issued' || status === 'Approved' || status === 'APPROVED') ? 'APPROVED' : (status === 'Rejected' || status === 'REJECTED') ? 'REJECTED' : status;

  const updateData: Partial<BusPassDocument> = {
    status: normalizedStatus,
    updatedAt: now,
    ...(normalizedStatus === 'APPROVED' ? { approvedAt: now, approvedBy: adminUser.id } : {}),
    ...(normalizedStatus === 'REJECTED' ? { rejectedAt: now, rejectedBy: adminUser.id, rejectionReason: rejectionReason || '' } : {})
  };

  const localList = getLocalPasses();
  const localIndex = localList.findIndex(p => p.id === passId);
  if (localIndex !== -1) {
    localList[localIndex] = { ...localList[localIndex], ...updateData };
    localStorage.setItem(LOCAL_PASSES_KEY, JSON.stringify(localList));
  }

  try {
    await updateDoc(doc(db, 'busPasses', passId), updateData);
  } catch (err) {
    console.warn('Firestore updateDoc pass status note:', err);
  }

  console.log('ADMIN_APPROVE_SUCCESS');

  logAuditEvent(
    adminUser.id,
    adminUser.email,
    'admin',
    normalizedStatus === 'APPROVED' ? 'APPROVE_BUS_PASS' : normalizedStatus === 'REJECTED' ? 'REJECT_BUS_PASS' : 'REVOKE_BUS_PASS',
    'busPasses',
    passId,
    { status: normalizedStatus, rejectionReason }
  ).catch(() => null);
};
