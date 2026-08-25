export type UserRole = 'admin' | 'student' | 'conductor';

export interface UserProfile {
  id: string; // Auth UID
  uid?: string; // Auth UID
  email: string;
  fullName: string;
  role: UserRole;
  photoUrl: string | null;
  phoneNumber: string;
  status: 'Active' | 'Pending' | 'Suspended';
  
  // Student Specific
  registerNumber?: string | null;
  college?: string | null;
  department?: string | null;
  yearOfStudy?: number | null;
  assignedRouteId?: string | null;
  assignedStopId?: string | null;
  activePassId?: string | null;
  
  // Staff Specific (Conductor)
  licenseNumber?: string | null;
  assignedBusId?: string | null;
  shiftSchedule?: string | null;
  
  // Metadata & FCM
  fcmTokens?: string[];
  lastLoginAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface BusDocument {
  id: string;
  busNumber: string; // e.g. "TN-09-AB-1234"
  busName: string; // e.g. "Bus 12A"
  capacity: number; // e.g. 50
  assignedRouteId: string;
  assignedRouteName: string;
  driverId?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  conductorId: string | null;
  conductorName: string | null;
  status: 'In Service' | 'Maintenance' | 'Out of Service';
  currentTripId?: string | null;
  lastMaintenanceDate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface RouteStop {
  stopId: string;
  stopName: string;
  orderIndex: number;
  latitude: number;
  longitude: number;
  landmark?: string;
  pickupTime?: string;
  dropTime?: string;
}

export interface RouteDocument {
  id: string;
  routeName: string; // e.g. "Route 101 - Central Express"
  startPoint: string;
  endPoint: string;
  totalDistanceKm: number;
  estimatedDurationMins: number;
  totalStops: number;
  stops: RouteStop[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BusStopDocument {
  id: string;
  stopName: string;
  routeId: string;
  routeName: string;
  orderIndex: number;
  latitude: number;
  longitude: number;
  landmark?: string;
  pickupTime?: string;
  dropTime?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PassLocation {
  id?: string;
  placeId?: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export type PassType = 'Monthly' | 'Quarterly' | 'Semestral' | 'Semester' | 'Annual';

export type PassStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'Pending' | 'Approved' | 'Rejected' | 'Issued' | 'Expired' | 'Cancelled';

export interface BusPassDocument {
  id: string; // e.g. "PASS-982341"
  userId: string; // Student UID
  studentUid?: string;
  studentId?: string;
  studentName: string;
  studentEmail?: string;
  registerNumber: string;
  department: string;
  college: string;
  phoneNumber: string;
  photoUrl?: string | null;
  
  routeId: string;
  routeName: string;
  route?: string;
  stopId: string;
  stopName: string;
  boardingPoint?: string;
  destination?: string;
  
  // Custom Origin & Destination Locations
  fromLocation?: PassLocation | null;
  toLocation?: PassLocation | null;
  fromStopName?: string;
  toStopName?: string;
  fromStopId?: string;
  toStopId?: string;
  
  // Dynamic Pricing Metrics
  roadDistanceKm?: number;
  oneWayDistanceKm?: number;
  roundTripDistanceKm?: number;
  monthlyDistanceKm?: number;
  normalFarePerKm?: number;
  normalFareTotal?: number;
  normalMonthlyFare?: number;
  discountPercentage?: number;
  discountAmount?: number;
  monthlyPassPrice?: number;
  durationMonths?: number;
  totalFare?: number;
  calculatedPrice?: number;
  amount?: number;
  estimatedTimeMins?: number;
  fareVersion?: number;
  
  passType: PassType;
  durationInMonths?: number;
  applicationDate?: number;
  issueDate: number;
  validUntil: number;
  
  status: PassStatus;
  paymentStatus?: 'Unpaid' | 'Paid' | 'Refunded';
  paymentReference?: string;
  paymentRef?: string;
  feeReceiptUrl?: string;
  idProofUrl?: string;
  
  qrPayload?: string;
  documentIdCardUrl?: string | null;
  documentReceiptUrl?: string | null;
  
  reviewedBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: number | null;
  rejectedBy?: string | null;
  rejectedAt?: number | null;
  reviewedAt?: number | null;
  rejectionReason?: string | null;
  
  createdAt: number;
  updatedAt: number;
}

export interface PassPricingDocument {
  id: string;
  routeId?: string;
  routeName?: string;
  fromStopId?: string;
  fromStopName?: string;
  toStopId?: string;
  toStopName?: string;
  perKmRate?: number;
  baseFare?: number;
  oneWayDistanceKm?: number;
  roundTripDistanceKm?: number;
  dailyDistanceKm?: number;
  monthlyDistanceKm?: number;
  normalFarePerKm?: number;
  normalMonthlyFare?: number;
  semesterDiscount?: number;
  annualDiscount?: number;
  discountAmount?: number;
  monthlyPassPrice?: number;
  currency?: string;
  status?: string;
  createdAt?: number;
  updatedAt: number;
  updatedBy?: string;
}

export interface SystemSettingsDocument {
  id: string;
  systemName: string;
  contactEmail: string;
  supportPhone: string;
  maxPassengersPerBus: number;
  enableNotifications: boolean;
  maintenanceMode: boolean;
  academicYear?: string;
  passApplicationOpen?: boolean;
  emergencyHelpline?: string;
  maxBusCapacityThreshold?: number;
  sosNotificationEmails?: string[];
  passFees?: {
    monthly?: number;
    quarterly?: number;
    semestral?: number;
    annual?: number;
    Monthly?: number;
    Semester?: number;
    Annual?: number;
  };
  updatedAt: number;
  updatedBy?: string;
}

export interface TripDocument {
  id: string;
  busId: string;
  busNumber: string;
  routeId: string;
  routeName: string;
  driverId?: string;
  driverName?: string;
  conductorId?: string;
  conductorName?: string;
  tripType: 'Pickup (Morning)' | 'Drop (Evening)' | 'Special';
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  startTime: number;
  endTime?: number | null;
  passengerCount: number;
  totalDistanceKm?: number;
  lastLatitude?: number;
  lastLongitude?: number;
  lastUpdated?: number;
  createdAt: number;
}

export interface LocationDocument {
  id: string; // busId
  busNumber: string;
  routeId: string;
  routeName: string;
  tripId: string;
  driverId?: string;
  driverName?: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  bearing: number; // 0-360 degrees
  active: boolean;
  nextStopName?: string;
  etaNextStopMins?: number;
  distanceTravelledKm?: number;
  distanceRemainingKm?: number;
  timestamp?: number;
  updatedAt: number;
}

export interface AttendanceLogDocument {
  id: string;
  userId: string;
  studentName: string;
  registerNumber: string;
  passId: string;
  tripId: string;
  busId: string;
  busNumber: string;
  routeId: string;
  stopName: string;
  scanTimestamp: number;
  scanMethod: 'QR_SCAN' | 'MANUAL_ENTRY' | 'CONDUCTOR_OVERRIDE';
  conductorId: string;
  status: 'Present' | 'Flagged' | 'Duplicate';
  createdAt: number;
}

export interface NotificationDocument {
  id: string;
  targetType: 'ALL' | 'ROLE' | 'ROUTE' | 'INDIVIDUAL';
  targetRole?: UserRole;
  targetRouteId?: string;
  targetUserId?: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  readBy: string[]; // List of user IDs who acknowledged
  createdAt: number;
  createdBy: string;
}

export interface FeedbackDocument {
  id: string;
  userId: string;
  studentName: string;
  registerNumber: string;
  busId?: string | null;
  busNumber?: string | null;
  routeId?: string | null;
  category: 'Staff Conduct' | 'Punctuality' | 'Cleanliness' | 'Route Issue' | 'App Issue' | 'Other';
  rating: number; // 1 to 5
  comments: string;
  status: 'Open' | 'Under Review' | 'Resolved';
  adminNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SosAlertDocument {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userRole?: UserRole;
  latitude: number;
  longitude: number;
  emergencyType: string;
  description?: string;
  status: 'Active' | 'Acknowledged' | 'Resolved';
  busId?: string | null;
  routeId?: string | null;
  timestamp?: number;
  createdAt?: number;
  resolutionNotes?: string;
  resolvedAt?: number;
}

export interface AuditLogDocument {
  id: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  resource?: string;
  resourceId?: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  targetCollection?: string;
  targetDocId?: string;
  action: string;
  details: Record<string, any>;
  timestamp: number;
}
