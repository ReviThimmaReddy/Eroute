import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { BusDocument, RouteDocument, BusStopDocument, BusPassDocument, UserProfile, PassPricingDocument } from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user_admin',
    email: 'admin@eroute.com',
    fullName: 'System Administrator (Transport Office)',
    role: 'admin',
    photoUrl: null,
    registerNumber: null,
    college: 'Saveetha School of Engineering (SIMATS)',
    department: 'Central Transport Directorate',
    phoneNumber: '9876543200',
    assignedRouteId: 'ROUTE-101',
    status: 'Active',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'user_student',
    email: 'student@eroute.com',
    fullName: 'Thimma Reddy K C',
    role: 'student',
    photoUrl: null,
    registerNumber: 'REG-192325025',
    college: 'Saveetha School of Engineering (SIMATS)',
    department: 'Computer Science & Engineering',
    phoneNumber: '9876543210',
    assignedRouteId: 'ROUTE-101',
    status: 'Active',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'user_conductor',
    email: 'conductor@eroute.com',
    fullName: 'Suresh Mani (Conductor)',
    role: 'conductor',
    photoUrl: null,
    registerNumber: null,
    college: 'Saveetha Transport Division',
    department: 'Ticketing & Boarding',
    phoneNumber: '9876543230',
    assignedRouteId: 'ROUTE-101',
    status: 'Active',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export const INITIAL_BUSES: BusDocument[] = [
  {
    id: 'BUS-101',
    busNumber: 'KA-01-F-1234',
    busName: 'Bengaluru Transit Alpha',
    capacity: 50,
    assignedRouteId: 'ROUTE-BLR-101',
    assignedRouteName: 'Bengaluru Route 01 - Electronic City to Whitefield',
    conductorId: 'user_conductor',
    conductorName: 'Suresh Mani (Conductor)',
    status: 'In Service',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'BUS-102',
    busNumber: 'KA-04-F-5678',
    busName: 'Bengaluru Shuttle Beta',
    capacity: 45,
    assignedRouteId: 'ROUTE-BLR-102',
    assignedRouteName: 'Bengaluru Route 02 - Yelahanka to Jayanagar',
    conductorId: null,
    conductorName: null,
    status: 'In Service',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export const INITIAL_ROUTES: RouteDocument[] = [
  {
    id: 'ROUTE-BLR-101',
    routeName: 'Bengaluru Route 01 - Electronic City to Whitefield',
    startPoint: 'Electronic City Phase 1',
    endPoint: 'Whitefield ITPL',
    totalDistanceKm: 28.5,
    estimatedDurationMins: 45,
    totalStops: 6,
    stops: [
      { stopId: 'STOP-B1', stopName: 'Electronic City', orderIndex: 1, latitude: 12.8452, longitude: 77.6602, pickupTime: '07:00 AM', dropTime: '05:45 PM' },
      { stopId: 'STOP-B2', stopName: 'Silk Board Junction', orderIndex: 2, latitude: 12.9172, longitude: 77.6228, pickupTime: '07:20 AM', dropTime: '05:25 PM' },
      { stopId: 'STOP-B3', stopName: 'BTM Layout', orderIndex: 3, latitude: 12.9166, longitude: 77.6101, pickupTime: '07:35 AM', dropTime: '05:10 PM' },
      { stopId: 'STOP-B4', stopName: 'Koramangala', orderIndex: 4, latitude: 12.9352, longitude: 77.6245, pickupTime: '07:50 AM', dropTime: '04:55 PM' },
      { stopId: 'STOP-B5', stopName: 'Indiranagar', orderIndex: 5, latitude: 12.9784, longitude: 77.6408, pickupTime: '08:10 AM', dropTime: '04:35 PM' },
      { stopId: 'STOP-B6', stopName: 'Whitefield ITPL', orderIndex: 6, latitude: 12.9698, longitude: 77.7499, pickupTime: '08:30 AM', dropTime: '04:15 PM' }
    ],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'ROUTE-BLR-102',
    routeName: 'Bengaluru Route 02 - Yelahanka to Jayanagar',
    startPoint: 'Yelahanka New Town',
    endPoint: 'Jayanagar 4th Block',
    totalDistanceKm: 24.2,
    estimatedDurationMins: 40,
    totalStops: 5,
    stops: [
      { stopId: 'STOP-B11', stopName: 'Yelahanka', orderIndex: 1, latitude: 13.1007, longitude: 77.5963, pickupTime: '07:15 AM', dropTime: '05:30 PM' },
      { stopId: 'STOP-B12', stopName: 'Hebbal', orderIndex: 2, latitude: 13.0358, longitude: 77.5970, pickupTime: '07:30 AM', dropTime: '05:15 PM' },
      { stopId: 'STOP-B13', stopName: 'Manyata Tech Park', orderIndex: 3, latitude: 13.0475, longitude: 77.6200, pickupTime: '07:45 AM', dropTime: '05:00 PM' },
      { stopId: 'STOP-B14', stopName: 'Majestic (KSR Station)', orderIndex: 4, latitude: 12.9767, longitude: 77.5713, pickupTime: '08:05 AM', dropTime: '04:40 PM' },
      { stopId: 'STOP-B15', stopName: 'Jayanagar', orderIndex: 5, latitude: 12.9299, longitude: 77.5824, pickupTime: '08:25 AM', dropTime: '04:20 PM' }
    ],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export const INITIAL_STOPS: BusStopDocument[] = [
  { id: 'STOP-B1', stopName: 'Electronic City', routeId: 'ROUTE-BLR-101', routeName: 'Bengaluru Route 01', orderIndex: 1, latitude: 12.8452, longitude: 77.6602, landmark: 'Near Toll Plaza', pickupTime: '07:00 AM', dropTime: '05:45 PM', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'STOP-B2', stopName: 'Silk Board Junction', routeId: 'ROUTE-BLR-101', routeName: 'Bengaluru Route 01', orderIndex: 2, latitude: 12.9172, longitude: 77.6228, landmark: 'Flyover Ramp', pickupTime: '07:20 AM', dropTime: '05:25 PM', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'STOP-B3', stopName: 'BTM Layout', routeId: 'ROUTE-BLR-101', routeName: 'Bengaluru Route 01', orderIndex: 3, latitude: 12.9166, longitude: 77.6101, landmark: 'Outer Ring Road Bus Bay', pickupTime: '07:35 AM', dropTime: '05:10 PM', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'STOP-B4', stopName: 'Koramangala', routeId: 'ROUTE-BLR-101', routeName: 'Bengaluru Route 01', orderIndex: 4, latitude: 12.9352, longitude: 77.6245, landmark: 'Sony World Signal', pickupTime: '07:50 AM', dropTime: '04:55 PM', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'STOP-B5', stopName: 'Indiranagar', routeId: 'ROUTE-BLR-101', routeName: 'Bengaluru Route 01', orderIndex: 5, latitude: 12.9784, longitude: 77.6408, landmark: '100ft Road Metro Station', pickupTime: '08:10 AM', dropTime: '04:35 PM', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'STOP-B6', stopName: 'Whitefield ITPL', routeId: 'ROUTE-BLR-101', routeName: 'Bengaluru Route 01', orderIndex: 6, latitude: 12.9698, longitude: 77.7499, landmark: 'Main Gate Gate 2', pickupTime: '08:30 AM', dropTime: '04:15 PM', createdAt: Date.now(), updatedAt: Date.now() }
];

export const INITIAL_PASSES: BusPassDocument[] = [
  {
    id: 'PASS-125912',
    userId: 'user_student',
    studentName: 'Thimma Reddy K C',
    registerNumber: 'REG-192325025',
    department: 'Computer Science & Engineering',
    college: 'SIMATS Engineering (Bengaluru Center)',
    phoneNumber: '9876543210',
    fromLocation: {
      placeId: 'ChIJbU60yYAWrjsR5x6e0m8n9Yg',
      name: 'Electronic City',
      address: 'Electronic City, Bengaluru, Karnataka 560100',
      latitude: 12.8452,
      longitude: 77.6602
    },
    toLocation: {
      placeId: 'ChIJKRx82OIVrjsR8OQ6_9b8wXY',
      name: 'Whitefield',
      address: 'Whitefield, Bengaluru, Karnataka 560066',
      latitude: 12.9698,
      longitude: 77.7499
    },
    routeId: 'ROUTE-BLR-101',
    routeName: 'Electronic City ➔ Whitefield Transit',
    stopId: 'STOP-B1',
    stopName: 'Electronic City',
    fromStopName: 'Electronic City',
    toStopName: 'Whitefield',
    passType: 'Monthly',
    amount: 893,
    paymentRef: 'UPI/2026/982374829',
    status: 'Issued',
    qrPayload: JSON.stringify({ passId: 'PASS-125912', userId: 'user_student', qrVersion: 1 }),
    issueDate: Date.now() - (2 * 24 * 60 * 60 * 1000),
    validUntil: Date.now() + (28 * 24 * 60 * 60 * 1000),
    approvedBy: 'admin@eroute.com',
    roadDistanceKm: 18.6,
    estimatedTimeMins: 32,
    oneWayDistanceKm: 18.6,
    roundTripDistanceKm: 37.2,
    monthlyDistanceKm: 1116,
    normalFarePerKm: 1.0,
    normalMonthlyFare: 1116,
    discountPercentage: 20.0,
    discountAmount: 223,
    monthlyPassPrice: 893,
    durationMonths: 1,
    totalFare: 893,
    fareVersion: Date.now(),
    createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
    updatedAt: Date.now()
  }
];

export const INITIAL_PRICING: PassPricingDocument[] = [
  {
    id: 'PRICING_ROUTE101_ELECTRONIC_CITY_WHITEFIELD',
    routeId: 'ROUTE-BLR-101',
    routeName: 'Bengaluru Route 01',
    fromStopId: 'STOP-B1',
    fromStopName: 'Electronic City',
    toStopId: 'STOP-B6',
    toStopName: 'Whitefield',
    oneWayDistanceKm: 18.6,
    roundTripDistanceKm: 37.2,
    dailyDistanceKm: 37.2,
    monthlyDistanceKm: 1116,
    normalFarePerKm: 1,
    normalMonthlyFare: 1116,
    monthlyPassPrice: 893,
    discountAmount: 223,
    currency: '₹',
    status: 'Active',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export const syncAllDataToFirebaseCloud = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  let count = 0;
  try {
    // 1. Sync Users
    for (const u of INITIAL_USERS) {
      await setDoc(doc(db, 'users', u.id), u, { merge: true });
      count++;
    }

    // 2. Sync Buses
    for (const b of INITIAL_BUSES) {
      await setDoc(doc(db, 'buses', b.id), b, { merge: true });
      count++;
    }

    // 3. Sync Routes
    for (const r of INITIAL_ROUTES) {
      await setDoc(doc(db, 'routes', r.id), r, { merge: true });
      count++;
    }

    // 4. Sync Bus Stops
    for (const s of INITIAL_STOPS) {
      await setDoc(doc(db, 'busStops', s.id), s, { merge: true });
      count++;
    }

    // 5. Sync Passes
    for (const p of INITIAL_PASSES) {
      await setDoc(doc(db, 'busPasses', p.id), p, { merge: true });
      count++;
    }

    // 6. Sync Pass Pricing Configurations
    for (const pr of INITIAL_PRICING) {
      await setDoc(doc(db, 'passPricing', pr.id), pr, { merge: true });
      count++;
    }

    // 7. Sync System Settings
    await setDoc(doc(db, 'systemSettings', 'globalConfig'), {
      id: 'globalConfig',
      academicYear: '2026 - 2027',
      passApplicationOpen: true,
      passFees: { Annual: 18000, Semester: 10000, Monthly: 2000 },
      emergencyHelpline: '1800-425-7890 / +91 9876543210',
      maxBusCapacityThreshold: 55,
      updatedAt: Date.now()
    }, { merge: true });
    count++;

    // 8. Sync Initial Notification
    await setDoc(doc(db, 'notifications', 'NOTIF-1'), {
      id: 'NOTIF-1',
      title: 'Academic Transit Services Live',
      message: 'SIMATS Transport division has officially activated the digital bus pass and tracking portal for semester 2026-2027.',
      targetRole: 'all',
      type: 'info',
      createdBy: 'admin@eroute.com',
      createdAt: Date.now(),
      readBy: []
    }, { merge: true });
    count++;

    return { success: true, count };
  } catch (err: any) {
    console.error('Firebase sync error:', err);
    return { success: false, count, error: err.message || 'Permission denied or network issue' };
  }
};
