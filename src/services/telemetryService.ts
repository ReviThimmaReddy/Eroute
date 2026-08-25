import { 
  collection, doc, getDocs, setDoc, updateDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import type { LocationDocument, TripDocument } from '../types';
import { logAuditEvent } from './auditService';

export type { TripDocument, LocationDocument };

export interface TripSummaryDocument {
  id: string;
  tripId: string;
  busId: string;
  busNumber: string;
  routeId: string;
  routeName: string;
  conductorId: string;
  conductorName: string;
  driverId: string;
  driverName: string;
  totalRegistered: number;
  totalBoarded: number;
  totalAbsent: number;
  invalidScans: number;
  attendanceRate: number;
  durationMinutes: number;
  startLocation: string;
  endLocation: string;
  submittedAt: number;
}

const LOCAL_TRIPS_KEY = 'eroute_local_trips';
const LOCAL_SUMMARIES_KEY = 'eroute_local_trip_summaries';

const getLocalTrips = (): TripDocument[] => {
  try {
    const saved = localStorage.getItem(LOCAL_TRIPS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveLocalTrip = (trip: TripDocument) => {
  try {
    const list = getLocalTrips().filter(t => t.id !== trip.id);
    list.unshift(trip);
    localStorage.setItem(LOCAL_TRIPS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }
};

export const subscribeToBusLocation = (_busId: string, onUpdate: (loc: LocationDocument | null) => void) => {
  onUpdate(null);
  return () => {};
};

export const subscribeToAllActiveBuses = (onUpdate: (locs: LocationDocument[]) => void) => {
  onUpdate([]);
  return () => {};
};

export const publishGPSLocation = async (location: LocationDocument): Promise<void> => {
  const now = Date.now();
  const payload = {
    ...location,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'liveLocations', location.id), payload, { merge: true });
    await setDoc(doc(db, 'locations', location.id), payload, { merge: true });
  } catch (e) {
    console.warn('GPS publish note:', e);
  }
};

export const startTrip = async (
  tripData: {
    busId: string;
    busNumber: string;
    routeId: string;
    routeName: string;
    driverId: string;
    driverName: string;
    conductorId?: string;
    conductorName?: string;
    tripType: 'Pickup (Morning)' | 'Drop (Evening)' | 'Special';
    startLat: number;
    startLng: number;
  }
): Promise<string> => {
  const tripId = `TRIP-${Date.now().toString().slice(-6)}`;
  const now = Date.now();

  const newTrip: TripDocument = {
    ...tripData,
    id: tripId,
    status: 'In Progress',
    startTime: now,
    passengerCount: 0,
    lastLatitude: tripData.startLat,
    lastLongitude: tripData.startLng,
    lastUpdated: now,
    createdAt: now
  };

  saveLocalTrip(newTrip);

  try {
    await setDoc(doc(db, 'trips', tripId), newTrip);

    const locationDoc: LocationDocument = {
      id: tripData.busId,
      busNumber: tripData.busNumber,
      routeId: tripData.routeId,
      routeName: tripData.routeName,
      tripId: tripId,
      latitude: tripData.startLat,
      longitude: tripData.startLng,
      speed: 0,
      bearing: 0,
      active: true,
      updatedAt: now
    };

    await setDoc(doc(db, 'liveLocations', tripData.busId), locationDoc);
    await setDoc(doc(db, 'locations', tripData.busId), locationDoc);
    await updateDoc(doc(db, 'buses', tripData.busId), {
      currentTripId: tripId,
      status: 'In Service',
      updatedAt: now
    }).catch(() => null);
  } catch (err) {
    console.warn('Firestore startTrip notice:', err);
  }

  await logAuditEvent(
    tripData.driverId,
    tripData.driverName,
    'driver',
    'START_TRIP',
    'trips',
    tripId,
    { busNumber: tripData.busNumber, routeName: tripData.routeName }
  );

  return tripId;
};

export const pauseTrip = async (tripId: string, busId: string, driverId: string, driverName: string): Promise<void> => {
  const now = Date.now();
  const list = getLocalTrips();
  const target = list.find(t => t.id === tripId);
  if (target) {
    target.status = 'Scheduled';
    target.lastUpdated = now;
    saveLocalTrip(target);
  }

  try {
    await updateDoc(doc(db, 'trips', tripId), { status: 'Scheduled', lastUpdated: now });
    await updateDoc(doc(db, 'liveLocations', busId), { speed: 0, updatedAt: now });
  } catch (e) {
    console.warn('pauseTrip notice:', e);
  }

  await logAuditEvent(driverId, driverName, 'driver', 'PAUSE_TRIP', 'trips', tripId, { busId });
};

export const resumeTrip = async (tripId: string, busId: string, driverId: string, driverName: string): Promise<void> => {
  const now = Date.now();
  const list = getLocalTrips();
  const target = list.find(t => t.id === tripId);
  if (target) {
    target.status = 'In Progress';
    target.lastUpdated = now;
    saveLocalTrip(target);
  }

  try {
    await updateDoc(doc(db, 'trips', tripId), { status: 'In Progress', lastUpdated: now });
    await updateDoc(doc(db, 'liveLocations', busId), { active: true, updatedAt: now });
  } catch (e) {
    console.warn('resumeTrip notice:', e);
  }

  await logAuditEvent(driverId, driverName, 'driver', 'RESUME_TRIP', 'trips', tripId, { busId });
};

export const endTrip = async (
  tripId: string,
  busId: string,
  driverId: string,
  driverName: string
): Promise<void> => {
  const now = Date.now();
  const list = getLocalTrips();
  const target = list.find(t => t.id === tripId);
  if (target) {
    target.status = 'Completed';
    target.endTime = now;
    target.lastUpdated = now;
    saveLocalTrip(target);
  }

  try {
    await updateDoc(doc(db, 'trips', tripId), {
      status: 'Completed',
      endTime: now,
      lastUpdated: now
    });

    await setDoc(doc(db, 'liveLocations', busId), {
      active: false,
      speed: 0,
      updatedAt: now
    }, { merge: true });

    await setDoc(doc(db, 'locations', busId), {
      active: false,
      speed: 0,
      updatedAt: now
    }, { merge: true });

    await updateDoc(doc(db, 'buses', busId), {
      currentTripId: null,
      updatedAt: now
    }).catch(() => null);
  } catch (err) {
    console.warn('endTrip notice:', err);
  }

  await logAuditEvent(
    driverId,
    driverName,
    'driver',
    'END_TRIP',
    'trips',
    tripId,
    { busId }
  );
};

export const getTripHistory = async (filter?: { busId?: string; driverId?: string; conductorId?: string }): Promise<TripDocument[]> => {
  try {
    const q = collection(db, 'trips');
    const snap = await getDocs(q);
    if (!snap.empty) {
      let trips = snap.docs.map(d => ({ id: d.id, ...d.data() } as TripDocument));
      if (filter?.busId) trips = trips.filter(t => t.busId === filter.busId);
      if (filter?.driverId) trips = trips.filter(t => t.driverId === filter.driverId);
      if (filter?.conductorId) trips = trips.filter(t => t.conductorId === filter.conductorId);
      trips.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
      return trips;
    }
  } catch (e) {
    console.warn('Firestore trip fetch note:', e);
  }

  let local = getLocalTrips();
  if (filter?.busId) local = local.filter(t => t.busId === filter.busId);
  if (filter?.driverId) local = local.filter(t => t.driverId === filter.driverId);
  if (filter?.conductorId) local = local.filter(t => t.conductorId === filter.conductorId);
  return local;
};

export const submitTripSummary = async (summary: Omit<TripSummaryDocument, 'id' | 'submittedAt'>): Promise<string> => {
  const summaryId = `SUM-${Date.now().toString().slice(-6)}`;
  const now = Date.now();

  const payload: TripSummaryDocument = {
    ...summary,
    id: summaryId,
    submittedAt: now
  };

  try {
    const list: TripSummaryDocument[] = JSON.parse(localStorage.getItem(LOCAL_SUMMARIES_KEY) || '[]');
    list.unshift(payload);
    localStorage.setItem(LOCAL_SUMMARIES_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }

  try {
    await setDoc(doc(db, 'tripSummaries', summaryId), payload);
  } catch (e) {
    console.warn('Firestore trip summary notice:', e);
  }

  await logAuditEvent(
    summary.conductorId,
    summary.conductorName,
    'conductor',
    'SUBMIT_TRIP_SUMMARY',
    'tripSummaries',
    summaryId,
    { busNumber: summary.busNumber, boardedCount: summary.totalBoarded }
  );

  return summaryId;
};
