import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import type { AuditLogDocument } from '../types';

export const logAuditEvent = async (
  actorId: string,
  actorEmail: string,
  actorRole: string,
  action: string,
  targetCollection: string,
  targetDocId: string,
  details: Record<string, any> = {}
) => {
  try {
    const cleanedDetails: Record<string, any> = {};
    Object.keys(details).forEach(key => {
      cleanedDetails[key] = details[key] === undefined ? null : details[key];
    });

    const logData: Omit<AuditLogDocument, 'id'> = {
      actorId: actorId || 'system',
      actorEmail: actorEmail || 'system@eroute.com',
      actorRole: actorRole || 'system',
      action,
      targetCollection,
      targetDocId,
      details: cleanedDetails,
      timestamp: Date.now()
    };
    await addDoc(collection(db, 'auditLogs'), logData);
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

export const fetchAuditLogs = async (maxCount: number = 100): Promise<AuditLogDocument[]> => {
  try {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(maxCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLogDocument));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};
