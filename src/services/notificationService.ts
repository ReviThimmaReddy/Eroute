import { 
  collection, doc, getDocs, setDoc, updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import type { NotificationDocument, UserRole } from '../types';
import { logAuditEvent } from './auditService';

const LOCAL_NOTIFS_KEY = 'eroute_local_notifications';

const SEED_NOTIFICATIONS: NotificationDocument[] = [
  {
    id: 'NOTIF-101',
    title: 'Academic Semester 2026-2027 Transit Active',
    message: 'Welcome to eRoute. Official digital bus passes are now open for new registrations and renewals.',
    targetType: 'ALL',
    priority: 'HIGH',
    createdBy: 'Transport Office Directorate',
    createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
    readBy: []
  },
  {
    id: 'NOTIF-102',
    title: 'Route 101 Morning Schedule Advisory',
    message: 'Morning pickup for Central Station starts promptly at 07:00 AM. Please arrive 5 minutes prior to pickup time.',
    targetType: 'ROUTE',
    targetRouteId: 'ROUTE-101',
    priority: 'NORMAL',
    createdBy: 'Fleet Coordinator',
    createdAt: Date.now() - (1 * 24 * 60 * 60 * 1000),
    readBy: []
  },
  {
    id: 'NOTIF-103',
    title: 'Digital QR Boarding Verification',
    message: 'Students are requested to have their Digital QR Pass ready on their smartphones before boarding.',
    targetType: 'ROLE',
    targetRole: 'student',
    priority: 'LOW',
    createdBy: 'Ticketing Division',
    createdAt: Date.now() - (12 * 60 * 60 * 1000),
    readBy: []
  }
];

const getLocalNotifs = (): NotificationDocument[] => {
  try {
    const saved = localStorage.getItem(LOCAL_NOTIFS_KEY);
    return saved ? JSON.parse(saved) : SEED_NOTIFICATIONS;
  } catch {
    return SEED_NOTIFICATIONS;
  }
};

const saveLocalNotif = (notif: NotificationDocument) => {
  try {
    const list = getLocalNotifs().filter(n => n.id !== notif.id);
    list.unshift(notif);
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }
};

export const broadcastNotification = async (
  notification: Omit<NotificationDocument, 'id' | 'createdAt' | 'readBy'>,
  actor: { id: string; email: string; role: string }
): Promise<string> => {
  const notifId = `NOTIF-${Date.now().toString().slice(-6)}`;
  const now = Date.now();

  const cleanPayload: Record<string, any> = {
    ...notification,
    id: notifId,
    readBy: [],
    createdAt: now
  };
  Object.keys(cleanPayload).forEach(k => {
    if (cleanPayload[k] === undefined) delete cleanPayload[k];
  });

  // Always save locally first for instant real-time access
  saveLocalNotif(cleanPayload as NotificationDocument);

  try {
    await setDoc(doc(db, 'notifications', notifId), cleanPayload);
  } catch (err) {
    console.warn('Firestore notification remote write notice:', err);
  }

  logAuditEvent(actor.id, actor.email, actor.role, 'BROADCAST_NOTIFICATION', 'notifications', notifId, {
    title: notification.title,
    targetType: notification.targetType
  }).catch(() => null);

  return notifId;
};

export const getAllNotifications = async (): Promise<NotificationDocument[]> => {
  try {
    const snap = await getDocs(collection(db, 'notifications'));
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificationDocument));
      list.sort((a, b) => b.createdAt - a.createdAt);
      return list;
    }
  } catch (e) {
    console.warn('Firestore notifications fetch note:', e);
  }

  return getLocalNotifs();
};

export const getNotificationsForUser = async (userRole: UserRole, userId: string, routeId?: string): Promise<NotificationDocument[]> => {
  const all = await getAllNotifications();
  
  // Filter for matching targets
  const filtered = all.filter(n => {
    if (n.targetType === 'ALL') return true;
    if (n.targetType === 'ROLE' && n.targetRole === userRole) return true;
    if (n.targetType === 'ROUTE' && routeId && n.targetRouteId === routeId) return true;
    if (n.targetType === 'INDIVIDUAL' && n.targetUserId === userId) return true;
    return false;
  });

  filtered.sort((a, b) => b.createdAt - a.createdAt);
  return filtered;
};

export const markNotificationRead = async (notifId: string, userId: string): Promise<void> => {
  const list = getLocalNotifs();
  const target = list.find(n => n.id === notifId);
  if (target && !target.readBy.includes(userId)) {
    target.readBy.push(userId);
    try {
      localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn(e);
    }
  }

  try {
    const ref = doc(db, 'notifications', notifId);
    if (target) {
      await updateDoc(ref, {
        readBy: target.readBy
      });
    }
  } catch (e) {
    console.warn('Firestore update read note:', e);
  }
};
