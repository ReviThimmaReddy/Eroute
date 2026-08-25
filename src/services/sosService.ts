import { 
  collection, doc, getDocs, setDoc, updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import type { SosAlertDocument, UserRole } from '../types';
import { logAuditEvent } from './auditService';

const LOCAL_SOS_KEY = 'eroute_local_sos_alerts';

const getLocalAlerts = (): SosAlertDocument[] => {
  try {
    const saved = localStorage.getItem(LOCAL_SOS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveLocalAlert = (alert: SosAlertDocument) => {
  try {
    const list = getLocalAlerts().filter(a => a.id !== alert.id);
    list.unshift(alert);
    localStorage.setItem(LOCAL_SOS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }
};

export const triggerEmergencySOS = async (
  sosData: {
    userId: string;
    userName: string;
    userPhone: string;
    role: UserRole;
    busId?: string | null;
    routeId?: string | null;
    latitude: number;
    longitude: number;
    emergencyType: 'Medical' | 'Accident' | 'Breakdown' | 'Security / Harassment' | 'Other';
  }
): Promise<string> => {
  const sosId = `SOS-${Date.now().toString().slice(-6)}`;
  const now = Date.now();

  const payload: SosAlertDocument = {
    ...sosData,
    busId: sosData.busId || null,
    routeId: sosData.routeId || null,
    id: sosId,
    status: 'Active',
    createdAt: now
  };

  saveLocalAlert(payload);

  try {
    await setDoc(doc(db, 'sosAlerts', sosId), payload);
    await setDoc(doc(db, 'emergencyRequests', sosId), payload).catch(() => null);
  } catch (e) {
    console.warn('Firestore SOS notice:', e);
  }

  await logAuditEvent(
    sosData.userId,
    sosData.userName,
    sosData.role,
    'TRIGGER_EMERGENCY_SOS',
    'sosAlerts',
    sosId,
    { emergencyType: sosData.emergencyType, lat: sosData.latitude, lng: sosData.longitude }
  );

  return sosId;
};

export const getSosAlerts = async (statusFilter?: 'Active' | 'Investigating' | 'Resolved'): Promise<SosAlertDocument[]> => {
  try {
    const q = collection(db, 'sosAlerts');
    const snap = await getDocs(q);
    if (!snap.empty) {
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SosAlertDocument));
      if (statusFilter) {
        list = list.filter(s => s.status === statusFilter);
      }
      list.sort((a, b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
      return list;
    }
  } catch (e) {
    console.warn('Firestore SOS fetch note:', e);
  }

  const local = getLocalAlerts();
  return statusFilter ? local.filter(s => s.status === statusFilter) : local;
};

export const resolveSosAlert = async (
  sosId: string,
  resolutionNotes: string,
  adminUser: { id: string; email: string; role: string }
): Promise<void> => {
  const now = Date.now();
  const list = getLocalAlerts();
  const target = list.find(a => a.id === sosId);
  if (target) {
    target.status = 'Resolved';
    target.resolutionNotes = resolutionNotes;
    target.resolvedAt = now;
    saveLocalAlert(target);
  }

  try {
    await updateDoc(doc(db, 'sosAlerts', sosId), {
      status: 'Resolved',
      resolutionNotes,
      resolvedAt: now
    });
  } catch (e) {
    console.warn('Firestore resolve SOS note:', e);
  }

  await logAuditEvent(
    adminUser.id,
    adminUser.email,
    adminUser.role,
    'RESOLVE_SOS_ALERT',
    'sosAlerts',
    sosId,
    { resolutionNotes }
  );
};
