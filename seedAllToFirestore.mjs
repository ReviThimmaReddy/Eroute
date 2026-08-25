import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBbcV9dycSt8_T5ILbzDdmdxLankBU5X04",
  authDomain: "eroute-ed29d.firebaseapp.com",
  projectId: "eroute-ed29d",
  storageBucket: "eroute-ed29d.firebasestorage.app",
  messagingSenderId: "372127532296",
  appId: "1:372127532296:web:1b51e1c53443dbeb1698bd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const USERS = [
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
    id: 'user_driver',
    email: 'driver@eroute.com',
    fullName: 'Ramesh Kumar (Driver Captain)',
    role: 'driver',
    photoUrl: null,
    registerNumber: null,
    college: 'Saveetha Transport Division',
    department: 'Fleet Operations',
    phoneNumber: '9876543220',
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

const BUSES = [
  {
    id: 'BUS-101',
    busNumber: 'KA-01-F-1234',
    busName: 'Bengaluru Transit Alpha',
    capacity: 50,
    assignedRouteId: 'ROUTE-BLR-101',
    assignedRouteName: 'Bengaluru Route 01 - Electronic City to Whitefield',
    driverId: 'user_driver',
    driverName: 'Ramesh Kumar (Captain)',
    driverPhone: '9876543220',
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
    driverId: 'user_driver',
    driverName: 'Karthik Raja (Driver)',
    driverPhone: '9876543211',
    conductorId: null,
    conductorName: null,
    status: 'In Service',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

const ROUTES = [
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

const STOPS = [
  { id: 'STOP-B1', stopName: 'Electronic City', routeId: 'ROUTE-BLR-101', routeName: 'Bengaluru Route 01', orderIndex: 1, latitude: 12.8452, longitude: 77.6602, landmark: 'Near Toll Plaza', pickupTime: '07:00 AM', dropTime: '05:45 PM', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'STOP-B2', stopName: 'Silk Board Junction', routeId: 'ROUTE-BLR-101', routeName: 'Bengaluru Route 01', orderIndex: 2, latitude: 12.9172, longitude: 77.6228, landmark: 'Flyover Ramp', pickupTime: '07:20 AM', dropTime: '05:25 PM', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'STOP-B3', stopName: 'BTM Layout', routeId: 'ROUTE-BLR-101', routeName: 'Bengaluru Route 01', orderIndex: 3, latitude: 12.9166, longitude: 77.6101, landmark: 'Outer Ring Road Bus Bay', pickupTime: '07:35 AM', dropTime: '05:10 PM', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'STOP-B4', stopName: 'Koramangala', routeId: 'ROUTE-BLR-101', routeName: 'Bengaluru Route 01', orderIndex: 4, latitude: 12.9352, longitude: 77.6245, landmark: 'Sony World Signal', pickupTime: '07:50 AM', dropTime: '04:55 PM', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'STOP-B5', stopName: 'Indiranagar', routeId: 'ROUTE-BLR-101', routeName: 'Bengaluru Route 01', orderIndex: 5, latitude: 12.9784, longitude: 77.6408, landmark: '100ft Road Metro Station', pickupTime: '08:10 AM', dropTime: '04:35 PM', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'STOP-B6', stopName: 'Whitefield ITPL', routeId: 'ROUTE-BLR-101', routeName: 'Bengaluru Route 01', orderIndex: 6, latitude: 12.9698, longitude: 77.7499, landmark: 'Main Gate Gate 2', pickupTime: '08:30 AM', dropTime: '04:15 PM', createdAt: Date.now(), updatedAt: Date.now() }
];

const PASSES = [
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

const PRICING = [
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
  }
];

async function seed() {
  console.log("Seeding all collections into Firestore (eroute-ed29d)...");
  try {
    for (const u of USERS) {
      await setDoc(doc(db, 'users', u.id), u, { merge: true });
      console.log(`+ Added user: ${u.email} (${u.role})`);
    }
    for (const b of BUSES) {
      await setDoc(doc(db, 'buses', b.id), b, { merge: true });
      console.log(`+ Added bus: ${b.busNumber}`);
    }
    for (const r of ROUTES) {
      await setDoc(doc(db, 'routes', r.id), r, { merge: true });
      console.log(`+ Added route: ${r.routeName}`);
    }
    for (const s of STOPS) {
      await setDoc(doc(db, 'busStops', s.id), s, { merge: true });
      console.log(`+ Added bus stop: ${s.stopName}`);
    }
    for (const p of PASSES) {
      await setDoc(doc(db, 'busPasses', p.id), p, { merge: true });
      console.log(`+ Added pass: ${p.id}`);
    }
    for (const pr of PRICING) {
      await setDoc(doc(db, 'passPricing', pr.id), pr, { merge: true });
      console.log(`+ Added pricing rule: ${pr.fromStopName} -> ${pr.toStopName}`);
    }
    await setDoc(doc(db, 'systemSettings', 'globalConfig'), {
      id: 'globalConfig',
      academicYear: '2026 - 2027',
      passApplicationOpen: true,
      passFees: { Annual: 18000, Semester: 10000, Monthly: 2000 },
      emergencyHelpline: '1800-425-7890 / +91 9876543210',
      maxBusCapacityThreshold: 55,
      updatedAt: Date.now()
    }, { merge: true });
    console.log("+ Added systemSettings");

    console.log("\nALL COLLECTIONS SUCCESSFULLY SEEDED AND STORED IN FIRESTORE DATABASE!");
  } catch (err) {
    console.error("\nFailed to write to Firestore:", err);
  }
}

seed();
