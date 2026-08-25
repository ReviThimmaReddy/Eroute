import { 
  collection, doc, getDocs, setDoc, updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import type { FeedbackDocument } from '../types';
import { logAuditEvent } from './auditService';

const LOCAL_FEEDBACK_KEY = 'eroute_local_feedback';

const getLocalFeedback = (): FeedbackDocument[] => {
  try {
    const saved = localStorage.getItem(LOCAL_FEEDBACK_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveLocalFeedbackItem = (item: FeedbackDocument) => {
  try {
    const list = getLocalFeedback().filter(f => f.id !== item.id);
    list.unshift(item);
    localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }
};

// Clean undefined fields to avoid Firestore setDoc errors
const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const cleaned = { ...obj } as any;
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      cleaned[key] = null;
    }
  });
  return cleaned;
};

export const submitFeedback = async (
  feedback: Omit<FeedbackDocument, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const feedbackId = `FB-${Date.now().toString().slice(-6)}`;
  const now = Date.now();

  const payload: FeedbackDocument = sanitizeObject({
    ...feedback,
    busId: feedback.busId || null,
    routeId: feedback.routeId || 'ROUTE-101',
    id: feedbackId,
    status: 'Open',
    createdAt: now,
    updatedAt: now
  });

  // Always save locally first for instant reliability
  saveLocalFeedbackItem(payload);

  try {
    await setDoc(doc(db, 'feedback', feedbackId), payload);
  } catch (e) {
    console.warn('Firestore feedback remote write notice:', e);
  }

  await logAuditEvent(
    feedback.userId,
    feedback.studentName,
    'student',
    'SUBMIT_FEEDBACK',
    'feedback',
    feedbackId,
    { category: feedback.category, rating: feedback.rating }
  );

  return feedbackId;
};

export const getAllFeedback = async (): Promise<FeedbackDocument[]> => {
  try {
    const snap = await getDocs(collection(db, 'feedback'));
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as FeedbackDocument));
      list.sort((a, b) => b.createdAt - a.createdAt);
      return list;
    }
  } catch (e) {
    console.warn('Firestore feedback fetch notice:', e);
  }

  return getLocalFeedback();
};

export const updateFeedbackStatus = async (
  feedbackId: string,
  status: 'Open' | 'Under Review' | 'Resolved',
  adminNotes?: string,
  actor?: { id: string; email: string; role: string }
): Promise<void> => {
  const list = getLocalFeedback();
  const target = list.find(f => f.id === feedbackId);
  const now = Date.now();

  if (target) {
    target.status = status;
    target.adminNotes = adminNotes || '';
    target.updatedAt = now;
    saveLocalFeedbackItem(target);
  }

  try {
    await updateDoc(doc(db, 'feedback', feedbackId), {
      status,
      adminNotes: adminNotes || '',
      updatedAt: now
    });
  } catch (e) {
    console.warn('Firestore update feedback notice:', e);
  }

  if (actor) {
    await logAuditEvent(actor.id, actor.email, actor.role, 'UPDATE_FEEDBACK_STATUS', 'feedback', feedbackId, { status });
  }
};
