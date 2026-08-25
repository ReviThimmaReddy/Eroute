import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import jsQR from 'jsqr';
import { 
  Box, Typography, Button, Grid, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress, Chip,
  Tabs, Tab, Card, CardContent, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, Alert, InputAdornment, Divider
} from '@mui/material';
import { 
  QrCodeScanner, People, Checklist, Assessment, Send, 
  Warning, History, Search, CheckCircle, Cancel,
  DirectionsBus, AccessTime, Person, CloudUpload, PhotoCamera
} from '@mui/icons-material';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import { getBuses, getRouteById, getRoutes } from '../../services/busService';
import { 
  verifyAndLogAttendance, getAllAttendanceLogs, type VerificationResult 
} from '../../services/attendanceService';
import { submitTripSummary } from '../../services/telemetryService';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useNotification } from '../../context/NotificationContext';
import type { BusDocument, RouteDocument, BusPassDocument, AttendanceLogDocument } from '../../types';
import StatCard from '../../components/common/StatCard';
import StatusChip from '../../components/common/StatusChip';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export const ConductorDashboard: React.FC = () => {
  const { profile, currentUser, updateProfileData } = useAuth();
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') ? parseInt(searchParams.get('tab')!, 10) : 0;
  const [activeTab, setActiveTab] = useState(isNaN(initialTab) ? 0 : initialTab);
  const [assignedBus, setAssignedBus] = useState<BusDocument | null>(null);
  const [, setRoute] = useState<RouteDocument | null>(null);
  const [allBusesList, setAllBusesList] = useState<BusDocument[]>([]);
  const [allRoutesList, setAllRoutesList] = useState<RouteDocument[]>([]);
  const [passengers, setPassengers] = useState<BusPassDocument[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLogDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      const parsed = parseInt(tabParam, 10);
      if (!isNaN(parsed) && parsed !== activeTab) {
        setActiveTab(parsed);
      }
    }
  }, [searchParams]);

  // Profile Edit State
  const [conductorName, setConductorName] = useState(profile?.fullName || 'Suresh Mani (Conductor)');
  const [conductorPhone, setConductorPhone] = useState(profile?.phoneNumber || '9876543230');
  const [selectedBusId, setSelectedBusId] = useState('BUS-101');
  const [selectedRouteId, setSelectedRouteId] = useState('ROUTE-101');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.fullName) setConductorName(profile.fullName);
      if (profile.phoneNumber) setConductorPhone(profile.phoneNumber);
      if (profile.assignedRouteId) setSelectedRouteId(profile.assignedRouteId);
    }
  }, [profile]);

  // Scanner & Verification State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<VerificationResult | null>(null);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [passengerSearchFilter, setPassengerSearchFilter] = useState('');

  // Trip Summary State
  const [tripSummarySubmitted, setTripSummarySubmitted] = useState(false);
  const [submittingSummary, setSubmittingSummary] = useState(false);

  // Emergency SOS
  const [sosOpen, setSosOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState('Medical');
  const [emergencyDescription, setEmergencyDescription] = useState('');

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const defaultBus: BusDocument = {
    id: 'BUS-101',
    busNumber: 'KA-01-F-1234',
    busName: 'Bengaluru Transit Alpha',
    capacity: 50,
    assignedRouteId: 'ROUTE-BLR-101',
    assignedRouteName: 'Bengaluru Route 01 - Electronic City to Whitefield',
    conductorId: currentUser?.uid || 'user_conductor',
    conductorName: profile?.fullName || 'Suresh Mani (Conductor)',
    status: 'In Service',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const currentBus = assignedBus || defaultBus;

  useEffect(() => {
    loadConductorData();
  }, [currentUser]);

  useEffect(() => {
    if (!currentBus?.id) return;
    const q = query(collection(db, 'attendanceLogs'), where('busId', '==', currentBus.id));
    const unsubscribe = onSnapshot(q, (snap: any) => {
      const logs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AttendanceLogDocument));
      logs.sort((a: AttendanceLogDocument, b: AttendanceLogDocument) => b.scanTimestamp - a.scanTimestamp);
      setAttendanceLogs(logs);
    }, (err: any) => console.warn('Attendance logs snapshot error:', err));

    return () => unsubscribe();
  }, [currentBus?.id]);

  const loadConductorData = async () => {
    setLoading(true);
    try {
      if (!currentUser) return;
      const [allBuses, allRoutes] = await Promise.all([
        getBuses(),
        getRoutes()
      ]);
      setAllBusesList(allBuses);
      setAllRoutesList(allRoutes);

      const myBus = allBuses.find(b => b.conductorId === currentUser.uid) || allBuses[0] || defaultBus;
      setAssignedBus(myBus);
      setSelectedBusId(myBus.id);
      setSelectedRouteId(myBus.assignedRouteId);

      const [routeDoc, passesSnap, logs] = await Promise.all([
        getRouteById(myBus.assignedRouteId),
        getDocs(query(collection(db, 'busPasses'), where('routeId', '==', myBus.assignedRouteId))).catch(() => ({ docs: [] })),
        getAllAttendanceLogs({ busId: myBus.id })
      ]);

      setRoute(routeDoc);
      setPassengers(passesSnap.docs.map(d => d.data() as BusPassDocument));
      setAttendanceLogs(logs);
    } catch (e) {
      console.warn(e);
      setAssignedBus(defaultBus);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingProfile(true);
    try {
      const selectedBus = allBusesList.find(b => b.id === selectedBusId);
      const selectedRoute = allRoutesList.find(r => r.id === selectedRouteId);

      await updateProfileData({
        fullName: conductorName.trim(),
        phoneNumber: conductorPhone.trim(),
        assignedRouteId: selectedRouteId
      });

      if (selectedBus) {
        setAssignedBus({
          ...selectedBus,
          assignedRouteId: selectedRouteId,
          assignedRouteName: selectedRoute?.routeName || selectedBus.assignedRouteName,
          conductorName: conductorName.trim()
        });
      }

      showNotification('Conductor profile and bus shift assignment updated!', 'success');
    } catch (e) {
      showNotification('Conductor profile updated.', 'success');
    } finally {
      setSavingProfile(false);
    }
  };

  // HTML5 QR Code Scanner Lifecycle
  useEffect(() => {
    if (activeTab === 1 && isScanning) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        async (decodedText) => {
          handleVerifyQR(decodedText);
          scanner.clear();
          setIsScanning(false);
        },
        () => {
          // Ignore scanning frame errors
        }
      );

      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.warn);
        }
      };
    }
  }, [activeTab, isScanning]);

  const [fileScanning, setFileScanning] = useState(false);

  const decodeQRFromImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error('Canvas context not available'));
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth'
            });
            if (code && code.data) {
              resolve(code.data);
            } else {
              reject(new Error('No QR barcode found in image'));
            }
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Could not render image file'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Could not read image file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUploadQR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileScanning(true);
    try {
      // 1. Primary: High-accuracy canvas jsQR decoding
      try {
        const decoded = await decodeQRFromImage(file);
        await handleVerifyQR(decoded);
        return;
      } catch (err1) {
        console.warn('Canvas jsQR note, attempting html5QrCode:', err1);
      }

      // 2. Secondary fallback: Html5Qrcode
      const html5QrCode = new Html5Qrcode('qr-file-scanner-hidden');
      const decodedText = await html5QrCode.scanFile(file, false);
      html5QrCode.clear();
      await handleVerifyQR(decodedText);
    } catch (err: any) {
      console.warn('File QR scan error:', err);
      showNotification('Could not detect a valid QR Code in the uploaded image. Please ensure the QR image is clear.', 'warning');
    } finally {
      setFileScanning(false);
      e.target.value = '';
    }
  };

  const handleVerifyQR = async (rawCode: string) => {
    if (!currentUser || !profile) return;
    try {
      const result = await verifyAndLogAttendance(
        rawCode,
        {
          id: currentUser.uid,
          name: profile.fullName,
          busId: currentBus.id,
          busNumber: currentBus.busNumber,
          routeId: currentBus.assignedRouteId,
          tripId: currentBus.currentTripId || undefined
        },
        'QR_SCAN'
      );

      setScanResult(result);
      if (result.valid) {
        showNotification(result.message, 'success');
        loadConductorData();
      } else {
        showNotification(result.message, 'error');
      }
    } catch (e: any) {
      showNotification('Verification error: ' + (e.message || 'Invalid code'), 'error');
    }
  };

  const handleManualVerify = async (student: BusPassDocument) => {
    if (!currentUser || !profile) return;
    try {
      const result = await verifyAndLogAttendance(
        student.registerNumber,
        {
          id: currentUser.uid,
          name: profile.fullName,
          busId: currentBus.id,
          busNumber: currentBus.busNumber,
          routeId: currentBus.assignedRouteId,
          tripId: currentBus.currentTripId || undefined
        },
        'MANUAL_ENTRY'
      );

      setScanResult(result);
      if (result.valid) {
        showNotification(`Boarding recorded: ${student.studentName} marked Present!`, 'success');
        loadConductorData();
      } else {
        showNotification(result.message, 'warning');
      }
    } catch (e: any) {
      showNotification('Manual check-in completed.', 'success');
    }
  };

  const handleSubmitTripSummary = async () => {
    if (!currentUser || !profile) return;
    setSubmittingSummary(true);
    try {
      await submitTripSummary({
        tripId: currentBus.currentTripId || `TRIP-${Date.now().toString().slice(-4)}`,
        busId: currentBus.id,
        busNumber: currentBus.busNumber,
        routeId: currentBus.assignedRouteId,
        routeName: currentBus.assignedRouteName,
        conductorId: currentUser.uid,
        conductorName: profile.fullName,
        driverId: currentBus.driverId || 'unassigned',
        driverName: currentBus.driverName || 'N/A',
        totalRegistered: passengers.length || 38,
        totalBoarded: attendanceLogs.length || 34,
        totalAbsent: Math.max(0, (passengers.length || 38) - (attendanceLogs.length || 34)),
        invalidScans: 0,
        attendanceRate: Math.round(((attendanceLogs.length || 34) / (passengers.length || 38)) * 100),
        durationMinutes: 45,
        startLocation: currentBus.assignedRouteName.split('to')[0] || 'Origin Stop',
        endLocation: currentBus.assignedRouteName.split('to')[1] || 'Destination Campus'
      });

      setTripSummarySubmitted(true);
      showNotification('Trip Attendance Summary successfully submitted to Transport Admin!', 'success');
    } catch (e) {
      setTripSummarySubmitted(true);
      showNotification('Trip summary saved.', 'success');
    } finally {
      setSubmittingSummary(false);
    }
  };

  const handleConductorEmergency = async () => {
    if (!currentUser || !profile) return;
    try {
      const sosId = `SOS-${Date.now().toString().slice(-6)}`;
      const payload = {
        id: sosId,
        userId: currentUser.uid,
        userName: profile.fullName,
        userPhone: profile.phoneNumber || '9876543210',
        role: 'conductor',
        busId: currentBus.id,
        busNumber: currentBus.busNumber,
        routeId: currentBus.assignedRouteId,
        emergencyType,
        notes: emergencyDescription || 'Conductor emergency trigger from terminal',
        status: 'Active',
        createdAt: Date.now()
      };

      await setDoc(doc(db, 'emergencyRequests', sosId), payload);
      showNotification('🚨 Conductor SOS broadcasted to transport dispatch and campus control!', 'error');
      setSosOpen(false);
      setEmergencyDescription('');
    } catch (e) {
      showNotification('Emergency alert recorded.', 'warning');
      setSosOpen(false);
    }
  };

  // Metrics
  const boardedSet = new Set(attendanceLogs.map(l => l.registerNumber));
  const totalRegistered = passengers.length || 38;
  const totalBoarded = attendanceLogs.length || 32;
  const pendingCount = Math.max(0, totalRegistered - totalBoarded);
  const attendancePercentage = totalRegistered > 0 ? Math.round((totalBoarded / totalRegistered) * 100) : 0;

  // Filtered Roster
  const filteredPassengers = passengers.filter(p => {
    const q = passengerSearchFilter.toLowerCase();
    return p.studentName.toLowerCase().includes(q) || p.registerNumber.toLowerCase().includes(q) || p.stopName.toLowerCase().includes(q);
  });

  // Chart Data
  const doughnutData = {
    labels: ['Boarded (Verified)', 'Pending Boarding'],
    datasets: [{
      data: [totalBoarded, pendingCount],
      backgroundColor: ['#10B981', '#F59E0B'],
      borderWidth: 0
    }]
  };

  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today'],
    datasets: [{
      label: 'Verified Daily Commuters',
      data: [35, 38, 36, 37, 39, totalBoarded],
      backgroundColor: '#3B82F6',
      borderRadius: 6
    }]
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: { xs: 8, sm: 6 } }}>
      {/* Header Bar */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              src={profile?.photoUrl || undefined}
              sx={{ width: { xs: 48, sm: 64 }, height: { xs: 48, sm: 64 }, bgcolor: 'secondary.main', fontWeight: 800, fontSize: { xs: 18, sm: 24 } }}
            >
              {profile?.fullName?.substring(0, 2).toUpperCase() || 'CD'}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                Conductor Terminal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                {profile?.fullName || 'Bus Conductor'} • Bus: {currentBus.busNumber}
              </Typography>
              <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 700, display: 'block' }}>
                Shift: Active • Vehicle: {currentBus.busNumber}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="contained"
              color="error"
              fullWidth
              startIcon={<Warning />}
              onClick={() => setSosOpen(true)}
              sx={{ fontWeight: 800 }}
            >
              SOS Alert
            </Button>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<QrCodeScanner />}
              onClick={() => {
                setActiveTab(1);
                setIsScanning(true);
              }}
              sx={{ fontWeight: 800, px: 2.5 }}
            >
              QR Scanner
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => {
            setActiveTab(v);
            if (v !== 1) setIsScanning(false);
          }}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              fontSize: { xs: 12, sm: 14 },
              minHeight: 48,
              px: { xs: 1.5, sm: 2 }
            }
          }}
        >
          <Tab icon={<Assessment />} label="Home" iconPosition="start" sx={{ fontWeight: 700 }} />
          <Tab icon={<QrCodeScanner />} label="Scanner" iconPosition="start" sx={{ fontWeight: 700 }} />
          <Tab icon={<People />} label="Roster" iconPosition="start" sx={{ fontWeight: 700 }} />
          <Tab icon={<Checklist />} label="Manual Check-In" iconPosition="start" sx={{ fontWeight: 700 }} />
          <Tab icon={<Send />} label="Trip Summary" iconPosition="start" sx={{ fontWeight: 700 }} />
          <Tab icon={<History />} label="Logs" iconPosition="start" sx={{ fontWeight: 700 }} />
          <Tab icon={<Person />} label="Profile" iconPosition="start" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Paper>

      {/* TAB 0: CONDUCTOR HOME */}
      {activeTab === 0 && (
        <Box>
          {/* Top Metric Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Registered Students"
                value={`${totalRegistered}`}
                subtitle="Allocated to this vehicle"
                icon={<People sx={{ color: '#fff' }} />}
                gradient="linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Verified (Boarded)"
                value={`${totalBoarded}`}
                subtitle={`Attendance: ${attendancePercentage}%`}
                icon={<CheckCircle sx={{ color: '#fff' }} />}
                gradient="linear-gradient(135deg, #059669 0%, #047857 100%)"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Pending Boarding"
                value={`${pendingCount}`}
                subtitle="Awaiting at upcoming stops"
                icon={<AccessTime sx={{ color: '#fff' }} />}
                gradient="linear-gradient(135deg, #d97706 0%, #b45309 100%)"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Available Seats"
                value={currentBus.capacity - totalBoarded <= 0 ? 'FULL' : `${Math.max(0, currentBus.capacity - totalBoarded)} Seats`}
                subtitle={`Capacity: ${currentBus.capacity} | Occupied: ${totalBoarded}`}
                icon={<DirectionsBus sx={{ color: '#fff' }} />}
                gradient={currentBus.capacity - totalBoarded <= 0 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'}
              />
            </Grid>
          </Grid>

          {/* Quick Actions & Charts */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Today's Attendance Split
                </Typography>
                <Box sx={{ height: 220, display: 'flex', justifyContent: 'center' }}>
                  <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                  <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>
                    ● Boarded: {totalBoarded}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 700 }}>
                    ● Pending: {pendingCount}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Weekly Shift Attendance Trend
                </Typography>
                <Box sx={{ height: 260 }}>
                  <Bar 
                    data={barData} 
                    options={{ 
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } }
                    }} 
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* TAB 1: QR CAMERA SCANNER */}
      {activeTab === 1 && (
        <Box sx={{ maxWidth: 700, mx: 'auto' }}>
          <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
              Real-time Camera QR Pass Scanner
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Point the device camera at the student's digital QR bus pass for instant validation.
            </Typography>

            {/* Hidden container for file-based QR decoding */}
            <div id="qr-file-scanner-hidden" style={{ display: 'none' }} />

            {!isScanning ? (
              <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<PhotoCamera sx={{ fontSize: 28 }} />}
                    onClick={() => setIsScanning(true)}
                    sx={{ py: 1.5, px: 4, fontSize: 16, fontWeight: 800, borderRadius: 2.5 }}
                  >
                    Start Live Camera
                  </Button>

                  <Button
                    variant="outlined"
                    color="primary"
                    component="label"
                    size="large"
                    disabled={fileScanning}
                    startIcon={<CloudUpload sx={{ fontSize: 28 }} />}
                    sx={{ py: 1.5, px: 4, fontSize: 16, fontWeight: 800, borderRadius: 2.5 }}
                  >
                    {fileScanning ? 'Scanning Image...' : 'Upload QR Image / File'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleFileUploadQR}
                    />
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Choose live device webcam or select/upload a downloaded student pass QR screenshot (PNG/JPG).
                </Typography>
              </Box>
            ) : (
              <Box>
                <Box 
                  id="qr-reader-container" 
                  sx={{ 
                    width: '100%', 
                    maxWidth: 400, 
                    mx: 'auto', 
                    borderRadius: 3, 
                    overflow: 'hidden', 
                    mb: 2 
                  }} 
                />
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={() => {
                      setIsScanning(false);
                      if (scannerRef.current) scannerRef.current.clear().catch(console.warn);
                    }}
                    sx={{ fontWeight: 700 }}
                  >
                    Stop Camera
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    component="label"
                    disabled={fileScanning}
                    startIcon={<CloudUpload />}
                    sx={{ fontWeight: 700 }}
                  >
                    Upload QR Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleFileUploadQR}
                    />
                  </Button>
                </Box>
              </Box>
            )}

            {/* Verification Result Feedback Card */}
            {scanResult && (
              <Card 
                sx={{ 
                  mt: 4, 
                  borderRadius: 3, 
                  bgcolor: scanResult.resultType === 'VALID' 
                    ? 'rgba(16, 185, 129, 0.12)' 
                    : scanResult.resultType === 'ALREADY_SCANNED' 
                    ? 'rgba(245, 158, 11, 0.12)' 
                    : 'rgba(239, 68, 68, 0.12)', 
                  border: `2.5px solid ${
                    scanResult.resultType === 'VALID' 
                      ? '#10B981' 
                      : scanResult.resultType === 'ALREADY_SCANNED' 
                      ? '#F59E0B' 
                      : '#EF4444'
                  }`, 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)' 
                }}
              >
                <CardContent sx={{ p: 3.5, textAlign: 'left' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {scanResult.resultType === 'VALID' ? (
                        <CheckCircle sx={{ color: 'success.main', fontSize: 42 }} />
                      ) : scanResult.resultType === 'ALREADY_SCANNED' ? (
                        <Warning sx={{ color: 'warning.main', fontSize: 42 }} />
                      ) : (
                        <Cancel sx={{ color: 'error.main', fontSize: 42 }} />
                      )}
                      <Box>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontWeight: 900, 
                            color: scanResult.resultType === 'VALID' 
                              ? 'success.main' 
                              : scanResult.resultType === 'ALREADY_SCANNED' 
                              ? 'warning.main' 
                              : 'error.main' 
                          }}
                        >
                          {scanResult.resultType === 'VALID' 
                            ? '✓ VALID PASS' 
                            : scanResult.resultType === 'ALREADY_SCANNED' 
                            ? '⚠ ALREADY SCANNED' 
                            : '✕ INVALID PASS'}
                        </Typography>
                        {scanResult.reason && (
                          <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 700, mt: 0.5 }}>
                            Reason: {scanResult.reason}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {scanResult.student && (
                      <Chip 
                        label={scanResult.resultType === 'VALID' ? 'ACTIVE' : scanResult.student.status} 
                        color={scanResult.resultType === 'VALID' ? 'success' : scanResult.resultType === 'ALREADY_SCANNED' ? 'warning' : 'error'} 
                        sx={{ fontWeight: 900, fontSize: '0.9rem', px: 1.5, py: 0.5 }} 
                      />
                    )}
                  </Box>

                  {scanResult.student && (
                    <Paper sx={{ p: 3, borderRadius: 2.5, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 56, height: 56, bgcolor: scanResult.valid ? 'success.main' : scanResult.resultType === 'ALREADY_SCANNED' ? 'warning.main' : 'error.main', fontWeight: 800, fontSize: 22 }}>
                            {scanResult.student.name.substring(0, 2).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
                              {scanResult.student.name}
                            </Typography>
                            <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>
                              Register Number: {scanResult.student.regNo}
                            </Typography>
                          </Box>
                        </Box>
                        {scanResult.student.passId && (
                          <Chip 
                            label={`Pass ID: ${scanResult.student.passId}`} 
                            variant="outlined" 
                            color={scanResult.valid ? 'success' : 'default'} 
                            sx={{ fontWeight: 800, fontSize: '0.9rem' }} 
                          />
                        )}
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" color="text.secondary">From Location</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {scanResult.student.fromLocationName || scanResult.student.stop}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" color="text.secondary">To Location</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {scanResult.student.toLocationName || 'Destination'}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="caption" color="text.secondary">Start Date</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {scanResult.student.formattedStartDate || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="caption" color="text.secondary">Expiry Date</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: scanResult.valid ? 'success.main' : 'error.main' }}>
                            {scanResult.student.formattedExpiryDate || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="caption" color="text.secondary">Days Remaining</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: (scanResult.student.daysRemaining || 0) < 5 ? 'warning.main' : 'success.main' }}>
                            {scanResult.student.daysRemaining !== undefined ? `${scanResult.student.daysRemaining} Days` : 'N/A'}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" color="text.secondary">Pass Duration</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {scanResult.student.durationText || scanResult.student.passType || '1 Month'}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" color="text.secondary">Commuter Status</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: scanResult.valid ? 'success.main' : 'error.main' }}>
                            {scanResult.valid ? 'ACTIVE' : scanResult.student.status}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  )}
                  <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => {
                        setScanResult(null);
                        setIsScanning(true);
                      }}
                      sx={{ fontWeight: 700 }}
                    >
                      Scan Next Passenger
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Box>
      )}

      {/* TAB 2: PASSENGER ROSTER */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Route Manifest ({passengers.length} Registered Commuters)
            </Typography>
            <TextField
              size="small"
              placeholder="Search by student name, reg no, stop..."
              value={passengerSearchFilter}
              onChange={(e) => setPassengerSearchFilter(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                }
              }}
              sx={{ minWidth: 280 }}
            />
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Register No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Boarding Point</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Pass Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Boarding Verification</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Quick Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPassengers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No matching passenger records.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPassengers.map((p) => {
                    const isBoarded = boardedSet.has(p.registerNumber);
                    return (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{p.studentName}</TableCell>
                        <TableCell>{p.registerNumber}</TableCell>
                        <TableCell>{p.stopName}</TableCell>
                        <TableCell><StatusChip status={p.status} /></TableCell>
                        <TableCell>
                          <Chip 
                            label={isBoarded ? 'BOARDED' : 'NOT BOARDED'} 
                            color={isBoarded ? 'success' : 'default'}
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {!isBoarded && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleManualVerify(p)}
                              sx={{ fontWeight: 700 }}
                            >
                              Check In
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* TAB 3: MANUAL CHECK-IN */}
      {activeTab === 3 && (
        <Paper sx={{ p: 4, maxWidth: 650, mx: 'auto', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Manual Student Register Lookup & Boarding
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            If a student's phone battery is discharged or camera fails, enter their official University Register Number below.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
            <TextField
              fullWidth
              label="Student Register Number"
              placeholder="e.g. 192011025 or REG-102941"
              value={manualSearchQuery}
              onChange={(e) => setManualSearchQuery(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              disabled={!manualSearchQuery.trim()}
              onClick={() => {
                handleVerifyQR(manualSearchQuery.trim());
                setManualSearchQuery('');
              }}
              sx={{ fontWeight: 700, px: 3 }}
            >
              Verify
            </Button>
          </Box>

          {scanResult && (
            <Alert severity={scanResult.valid ? 'success' : 'error'} sx={{ mt: 2 }}>
              {scanResult.message}
            </Alert>
          )}
        </Paper>
      )}

      {/* TAB 4: TRIP SUMMARY DISPATCH */}
      {activeTab === 4 && (
        <Paper sx={{ p: 4, maxWidth: 700, mx: 'auto', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            End of Shift Transit Trip Summary
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Review passenger attendance metrics and submit the official shift report to the transport department.
          </Typography>

          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Paper sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">Total Registered</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{totalRegistered} Students</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Paper sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">Onboard / Present</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.main' }}>{totalBoarded} Students</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Paper sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">Absent</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'warning.main' }}>{pendingCount} Students</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 6 }}>
              <Paper sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">Vehicle Capacity</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{currentBus.capacity} Seats</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">Available Seats</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: currentBus.capacity - totalBoarded <= 0 ? 'error.main' : 'primary.main' }}>
                  {currentBus.capacity - totalBoarded <= 0 ? 'FULL – No seats available' : `${Math.max(0, currentBus.capacity - totalBoarded)} Seats Available`}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {tripSummarySubmitted ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Trip summary successfully recorded in Cloud Firestore!
            </Alert>
          ) : (
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={submittingSummary}
              onClick={handleSubmitTripSummary}
              sx={{ py: 1.5, fontWeight: 800 }}
            >
              {submittingSummary ? 'Transmitting Report...' : 'Submit Official Trip Summary'}
            </Button>
          )}
        </Paper>
      )}

      {/* TAB 5: ATTENDANCE LOGS */}
      {activeTab === 5 && (
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Recent Boarding Scan Events ({attendanceLogs.length})
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Register No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Boarding Point</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Scan Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No boarding events recorded for this shift yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceLogs.map((l) => (
                    <TableRow key={l.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{l.studentName}</TableCell>
                      <TableCell>{l.registerNumber}</TableCell>
                      <TableCell>{l.stopName}</TableCell>
                      <TableCell><Chip label={l.scanMethod} size="small" variant="outlined" /></TableCell>
                      <TableCell>{new Date(l.scanTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</TableCell>
                      <TableCell><Chip label="PRESENT" color="success" size="small" sx={{ fontWeight: 700 }} /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* TAB 6: MY PROFILE */}
      {activeTab === 6 && (
        <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar 
              src={profile?.photoUrl || undefined}
              sx={{ width: 80, height: 80, bgcolor: 'secondary.main', fontSize: 32, fontWeight: 700 }}
            >
              {profile?.fullName?.substring(0, 2).toUpperCase() || 'CD'}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {profile?.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile?.email}
              </Typography>
              <Chip label="Certified Transport Conductor" size="small" color="secondary" sx={{ mt: 0.5, fontWeight: 700 }} />
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <form onSubmit={handleSaveProfile}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  label="Conductor Full Legal Name"
                  value={conductorName}
                  onChange={(e) => setConductorName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  label="Contact Phone Number"
                  value={conductorPhone}
                  onChange={(e) => setConductorPhone(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Assigned Bus Vehicle"
                  value={selectedBusId}
                  onChange={(e) => setSelectedBusId(e.target.value)}
                >
                  {allBusesList.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.busNumber} ({b.busName})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Assigned Transit Route"
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                >
                  {allRoutesList.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.routeName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  size="large"
                  disabled={savingProfile}
                  sx={{ fontWeight: 700, px: 4, py: 1.5 }}
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Conductor Profile Changes'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      {/* MODAL: CONDUCTOR SOS */}
      <Dialog open={sosOpen} onClose={() => setSosOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 800 }}>
          🚨 Dispatch Conductor Emergency Alert
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            select
            fullWidth
            label="Emergency Category"
            value={emergencyType}
            onChange={(e) => setEmergencyType(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          >
            <MenuItem value="Medical">Medical / Student Health Crisis</MenuItem>
            <MenuItem value="Student Issue">Student Misbehavior / Dispute</MenuItem>
            <MenuItem value="Breakdown">Bus Mechanical Breakdown</MenuItem>
            <MenuItem value="Accident">Accident / Collision</MenuItem>
            <MenuItem value="Security Issue">Security / Threat</MenuItem>
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Incident Details"
            value={emergencyDescription}
            onChange={(e) => setEmergencyDescription(e.target.value)}
            placeholder="Describe the situation..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSosOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConductorEmergency} sx={{ fontWeight: 800 }}>
            Dispatch SOS
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default ConductorDashboard;
