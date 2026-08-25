import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { logAuditEvent } from './auditService';

export interface MaintenanceReportDocument {
  id: string;
  busId: string;
  busNumber: string;
  driverId?: string;
  driverName?: string;
  reportedById?: string;
  reportedByName?: string;
  issueType: 'Breakdown' | 'Fuel Issue' | 'Tyre Problem' | 'Accident' | 'Mechanical' | 'Other';
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  currentLocation?: { lat: number; lng: number };
  status: 'Reported' | 'In Progress' | 'Resolved';
  resolutionNotes?: string;
  createdAt: number;
  resolvedAt?: number;
}

const LOCAL_MAINTENANCE_KEY = 'eroute_local_maintenance_reports';

const getLocalReports = (): MaintenanceReportDocument[] => {
  try {
    const saved = localStorage.getItem(LOCAL_MAINTENANCE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveLocalReport = (report: MaintenanceReportDocument) => {
  try {
    const list = getLocalReports().filter(r => r.id !== report.id);
    list.unshift(report);
    localStorage.setItem(LOCAL_MAINTENANCE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }
};

export const reportBusIssue = async (
  data: Omit<MaintenanceReportDocument, 'id' | 'status' | 'createdAt'>
): Promise<string> => {
  const reportId = `MAINT-${Date.now().toString().slice(-6)}`;
  const now = Date.now();

  const payload: MaintenanceReportDocument = {
    ...data,
    id: reportId,
    status: 'Reported',
    createdAt: now
  };

  saveLocalReport(payload);

  try {
    await setDoc(doc(db, 'maintenanceReports', reportId), payload);
  } catch (e) {
    console.warn('Firestore maintenance remote write notice:', e);
  }

  await logAuditEvent(
    data.reportedById || data.driverId || 'system',
    data.reportedByName || data.driverName || 'Staff Member',
    'staff',
    'REPORT_BUS_DEFECT',
    'maintenanceReports',
    reportId,
    { issueType: data.issueType, busNumber: data.busNumber }
  );

  return reportId;
};

export const getMaintenanceReports = async (): Promise<MaintenanceReportDocument[]> => {
  try {
    const snap = await getDocs(collection(db, 'maintenanceReports'));
    const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as MaintenanceReportDocument));
    const local = getLocalReports();

    const mergedMap = new Map<string, MaintenanceReportDocument>();
    remote.forEach(r => mergedMap.set(r.id, r));
    local.forEach(l => mergedMap.set(l.id, l));

    return Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
  } catch (e) {
    console.warn('Using local maintenance fallback:', e);
    return getLocalReports();
  }
};

export const updateMaintenanceStatus = async (
  reportId: string,
  status: 'In Progress' | 'Resolved',
  resolutionNotes?: string
): Promise<void> => {
  const now = Date.now();
  const updatePayload: Partial<MaintenanceReportDocument> = {
    status,
    ...(resolutionNotes ? { resolutionNotes } : {}),
    ...(status === 'Resolved' ? { resolvedAt: now } : {})
  };

  const localList = getLocalReports();
  const index = localList.findIndex(r => r.id === reportId);
  if (index !== -1) {
    localList[index] = { ...localList[index], ...updatePayload };
    localStorage.setItem(LOCAL_MAINTENANCE_KEY, JSON.stringify(localList));
  }

  try {
    await updateDoc(doc(db, 'maintenanceReports', reportId), updatePayload);
  } catch (e) {
    console.warn('Remote update maintenance notice:', e);
  }
};
