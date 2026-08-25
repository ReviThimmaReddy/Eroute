import { 
  collection, doc, getDocs, setDoc, deleteDoc, query, where 
} from 'firebase/firestore';
import { db } from './firebase';
import type { BusDocument, RouteDocument, BusStopDocument } from '../types';
import { logAuditEvent } from './auditService';

const SEED_BUSES: BusDocument[] = [];
const SEED_ROUTES: RouteDocument[] = [];
const SEED_STOPS: BusStopDocument[] = [];

const getLocal = <T>(key: string, seed: T[]): T[] => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : seed;
  } catch {
    return seed;
  }
};

const setLocal = <T>(key: string, items: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.warn(e);
  }
};

// Buses
export const getBuses = async (): Promise<BusDocument[]> => {
  try {
    const snap = await getDocs(collection(db, 'buses'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as BusDocument));
    }
  } catch (e) {
    console.warn('Firestore buses fetch note:', e);
  }
  return getLocal('eroute_buses', []);
};

export const getBusById = async (busId: string): Promise<BusDocument | null> => {
  const list = await getBuses();
  return list.find(b => b.id === busId) || null;
};

export const saveBus = async (bus: Omit<BusDocument, 'id'> & { id?: string }, actor: { id: string; email: string; role: string }): Promise<string> => {
  const busId = bus.id || (bus.busNumber.replace(/\s+/g, '-').toUpperCase() || `BUS-${Date.now()}`);
  const now = Date.now();
  const payload: BusDocument = {
    ...bus,
    id: busId,
    createdAt: bus.createdAt || now,
    updatedAt: now
  };

  const list = getLocal('eroute_buses', SEED_BUSES).filter(b => b.id !== busId);
  list.unshift(payload);
  setLocal('eroute_buses', list);

  try {
    const busRef = doc(db, 'buses', busId);
    await setDoc(busRef, payload, { merge: true });
  } catch (e) {
    console.warn('Firestore bus save note:', e);
  }

  await logAuditEvent(actor.id, actor.email, actor.role, bus.id ? 'UPDATE_BUS' : 'CREATE_BUS', 'buses', busId, { busNumber: bus.busNumber });
  return busId;
};

export const deleteBus = async (busId: string, actor: { id: string; email: string; role: string }): Promise<void> => {
  const list = getLocal('eroute_buses', SEED_BUSES).filter(b => b.id !== busId);
  setLocal('eroute_buses', list);
  try {
    await deleteDoc(doc(db, 'buses', busId));
  } catch (e) {
    console.warn(e);
  }
  await logAuditEvent(actor.id, actor.email, actor.role, 'DELETE_BUS', 'buses', busId, {});
};

// Routes
export const getRoutes = async (): Promise<RouteDocument[]> => {
  try {
    const snap = await getDocs(collection(db, 'routes'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as RouteDocument));
    }
  } catch (e) {
    console.warn('Firestore routes fetch note:', e);
  }
  return getLocal('eroute_routes', SEED_ROUTES);
};

export const getRouteById = async (routeId: string): Promise<RouteDocument | null> => {
  const list = await getRoutes();
  return list.find(r => r.id === routeId) || list[0] || null;
};

export const saveRoute = async (route: Omit<RouteDocument, 'id'> & { id?: string }, actor: { id: string; email: string; role: string }): Promise<string> => {
  const routeId = route.id || `ROUTE-${Date.now().toString().slice(-6)}`;
  const now = Date.now();
  const payload: RouteDocument = {
    ...route,
    id: routeId,
    totalStops: route.stops ? route.stops.length : 0,
    createdAt: route.createdAt || now,
    updatedAt: now
  };

  const list = getLocal('eroute_routes', SEED_ROUTES).filter(r => r.id !== routeId);
  list.unshift(payload);
  setLocal('eroute_routes', list);

  try {
    const routeRef = doc(db, 'routes', routeId);
    await setDoc(routeRef, payload, { merge: true });
  } catch (e) {
    console.warn('Firestore route save note:', e);
  }

  await logAuditEvent(actor.id, actor.email, actor.role, route.id ? 'UPDATE_ROUTE' : 'CREATE_ROUTE', 'routes', routeId, { routeName: route.routeName });
  return routeId;
};

export const deleteRoute = async (routeId: string, actor: { id: string; email: string; role: string }): Promise<void> => {
  const list = getLocal('eroute_routes', SEED_ROUTES).filter(r => r.id !== routeId);
  setLocal('eroute_routes', list);
  try {
    await deleteDoc(doc(db, 'routes', routeId));
  } catch (e) {
    console.warn(e);
  }
  await logAuditEvent(actor.id, actor.email, actor.role, 'DELETE_ROUTE', 'routes', routeId, {});
};

// Bus Stops
export const getBusStops = async (routeId?: string): Promise<BusStopDocument[]> => {
  try {
    const q = collection(db, 'busStops');
    if (routeId) {
      const queryConstraint = query(q, where('routeId', '==', routeId));
      const snap = await getDocs(queryConstraint);
      if (!snap.empty) return snap.docs.map(d => ({ id: d.id, ...d.data() } as BusStopDocument));
    } else {
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs.map(d => ({ id: d.id, ...d.data() } as BusStopDocument));
    }
  } catch (e) {
    console.warn('Firestore stops fetch note:', e);
  }

  const list = getLocal('eroute_bus_stops', SEED_STOPS);
  return routeId ? list.filter(s => s.routeId === routeId) : list;
};

export const saveBusStop = async (stop: Omit<BusStopDocument, 'id'> & { id?: string }, actor: { id: string; email: string; role: string }): Promise<string> => {
  const stopId = stop.id || `STOP-${Date.now().toString().slice(-6)}`;
  const now = Date.now();
  const payload: BusStopDocument = {
    ...stop,
    id: stopId,
    createdAt: stop.createdAt || now,
    updatedAt: now
  };

  const list = getLocal('eroute_bus_stops', SEED_STOPS).filter(s => s.id !== stopId);
  list.unshift(payload);
  setLocal('eroute_bus_stops', list);

  try {
    const stopRef = doc(db, 'busStops', stopId);
    await setDoc(stopRef, payload, { merge: true });
  } catch (e) {
    console.warn('Firestore stop save note:', e);
  }

  await logAuditEvent(actor.id, actor.email, actor.role, stop.id ? 'UPDATE_BUS_STOP' : 'CREATE_BUS_STOP', 'busStops', stopId, { stopName: stop.stopName });
  return stopId;
};

export const deleteBusStop = async (stopId: string, actor: { id: string; email: string; role: string }): Promise<void> => {
  const list = getLocal('eroute_bus_stops', SEED_STOPS).filter(s => s.id !== stopId);
  setLocal('eroute_bus_stops', list);
  try {
    await deleteDoc(doc(db, 'busStops', stopId));
  } catch (e) {
    console.warn(e);
  }
  await logAuditEvent(actor.id, actor.email, actor.role, 'DELETE_BUS_STOP', 'busStops', stopId, {});
};
