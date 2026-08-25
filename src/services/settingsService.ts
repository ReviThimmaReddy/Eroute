import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { SystemSettingsDocument } from '../types';
import { logAuditEvent } from './auditService';

const LOCAL_SETTINGS_KEY = 'eroute_system_settings';

const DEFAULT_SETTINGS: SystemSettingsDocument = {
  id: 'global_config',
  systemName: 'eRoute University Transit Management',
  contactEmail: 'transport.admin@saveetha.com',
  supportPhone: '+91 94440 12345',
  maxPassengersPerBus: 55,
  enableNotifications: true,
  maintenanceMode: false,
  academicYear: '2026 - 2027',
  passApplicationOpen: true,
  passFees: {
    monthly: 2000,
    quarterly: 5500,
    semestral: 10000,
    annual: 18000,
    Annual: 18000,
    Semester: 10000,
    Monthly: 2000
  },
  emergencyHelpline: '+91 94440 12345 / 044-2680 1999',
  sosNotificationEmails: ['transport.admin@saveetha.com', 'security@saveetha.com'],
  maxBusCapacityThreshold: 55,
  updatedAt: Date.now(),
  updatedBy: 'system'
};

export const getSystemSettings = async (): Promise<SystemSettingsDocument> => {
  try {
    const docRef = doc(db, 'systemSettings', 'global_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SystemSettingsDocument;
    }
  } catch (err) {
    console.warn('Firestore settings fetch note:', err);
  }

  try {
    const saved = localStorage.getItem(LOCAL_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSystemSettings = async (
  settings: SystemSettingsDocument,
  actor: { id: string; email: string; role: string }
): Promise<void> => {
  const payload = {
    ...settings,
    updatedAt: Date.now(),
    updatedBy: actor.email
  };

  try {
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn(e);
  }

  try {
    const docRef = doc(db, 'systemSettings', 'global_config');
    await setDoc(docRef, payload, { merge: true });
  } catch (e) {
    console.warn('Firestore settings update note:', e);
  }

  await logAuditEvent(actor.id, actor.email, actor.role, 'UPDATE_SYSTEM_SETTINGS', 'systemSettings', 'global_config', settings);
};
