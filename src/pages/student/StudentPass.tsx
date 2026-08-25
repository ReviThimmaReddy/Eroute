import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress,
  Divider, Paper, Chip, Autocomplete, IconButton
} from '@mui/material';
import { 
  CreditCard, CloudUpload, CheckCircle, Payment, DirectionsBus, LocationOn, Route, Close, Badge, Logout
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { applyForBusPass, uploadPassDocument, getStudentPass, subscribeStudentPass } from '../../services/passService';
import { searchGooglePlacesBengaluru, BENGALURU_PLACES_DATABASE } from '../../services/googleLocationService';
import { calculateGoogleRoadRoute, type RouteCalculationResult } from '../../services/googleRouteService';
import { calculateDynamicPassFare } from '../../services/pricingService';
import { GoogleRouteMap } from '../../components/maps/GoogleRouteMap';
import { useNotification } from '../../context/NotificationContext';
import type { BusPassDocument, PassType, PassLocation } from '../../types';
import { 
  validateFullName, 
  validateRegisterNumber, 
  sanitizeFullNameInput, 
  sanitizeRegisterNumberInput 
} from '../../utils/studentValidation';

export const StudentPass: React.FC = () => {
  const navigate = useNavigate();
  const { profile, currentUser, updateProfileData, logout } = useAuth();
  const { showNotification } = useNotification();
  const [activePass, setActivePass] = useState<BusPassDocument | null>(null);
  
  // Student Information Fields
  const [studentName, setStudentName] = useState(profile?.fullName || '');
  const [registerNumber, setRegisterNumber] = useState(profile?.registerNumber || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [department, setDepartment] = useState(profile?.department || 'Computer Science & Engineering');
  const [college, setCollege] = useState(profile?.college || 'Saveetha School of Engineering (SIMATS)');

  // Form Validation Error States
  const [nameError, setNameError] = useState<string | null>(null);
  const [regNoError, setRegNoError] = useState<string | null>(null);

  // Bengaluru Places Dropdown Options
  const [fromLocation, setFromLocation] = useState<PassLocation | null>(null);
  const [toLocation, setToLocation] = useState<PassLocation | null>(null);
  const [fromOptions, setFromOptions] = useState<PassLocation[]>(BENGALURU_PLACES_DATABASE);
  const [toOptions, setToOptions] = useState<PassLocation[]>(BENGALURU_PLACES_DATABASE);
  const [searchingFrom, setSearchingFrom] = useState(false);
  const [searchingTo, setSearchingTo] = useState(false);

  // Road Route Telemetry & Duration
  const [routeResult, setRouteResult] = useState<RouteCalculationResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [durationMonths, setDurationMonths] = useState<number>(1);

  // Admin Configured Rates
  const normalFarePerKm = 1.0;
  const discountPercentage = 20.0;

  // Documents & Payment
  const [paymentRef, setPaymentRef] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      if (!studentName) setStudentName(profile.fullName || '');
      if (!registerNumber) setRegisterNumber(profile.registerNumber || '');
      if (!phoneNumber) setPhoneNumber(profile.phoneNumber || '');
      if (profile.department) setDepartment(profile.department);
      if (profile.college) setCollege(profile.college);
    }
  }, [profile]);

  useEffect(() => {
    if (!currentUser) {
      setInitialLoading(false);
      return;
    }
    setInitialLoading(true);
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500);

    const unsubscribe = subscribeStudentPass(currentUser.uid, (pass) => {
      setActivePass(pass);
      setInitialLoading(false);
      clearTimeout(timer);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [currentUser]);

  // Real-time Full Name Change Handler
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const sanitized = sanitizeFullNameInput(rawVal);
    setStudentName(sanitized);

    if (rawVal !== sanitized) {
      setNameError('Full Name must contain letters and spaces only.');
    } else {
      const check = validateFullName(sanitized);
      setNameError(check.isValid ? null : check.error);
    }
  };

  // Real-time Register Number Change Handler
  const handleRegNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const sanitized = sanitizeRegisterNumberInput(rawVal);
    setRegisterNumber(sanitized);

    if (rawVal !== sanitized) {
      setRegNoError('Register / Roll Number must contain numbers only.');
    } else {
      const check = validateRegisterNumber(sanitized);
      setRegNoError(check.isValid ? null : check.error);
    }
  };

  // Search From Locations
  const handleSearchFrom = async (query: string) => {
    if (!query || query.trim().length === 0) {
      setFromOptions([]);
      return;
    }
    setSearchingFrom(true);
    try {
      const results = await searchGooglePlacesBengaluru(query);
      setFromOptions(results);
    } catch (e) {
      console.warn(e);
    } finally {
      setSearchingFrom(false);
    }
  };

  // Search To Locations
  const handleSearchTo = async (query: string) => {
    if (!query || query.trim().length === 0) {
      setToOptions([]);
      return;
    }
    setSearchingTo(true);
    try {
      const results = await searchGooglePlacesBengaluru(query);
      setToOptions(results);
    } catch (e) {
      console.warn(e);
    } finally {
      setSearchingTo(false);
    }
  };

  // Calculate Road Route whenever From or To selection changes
  useEffect(() => {
    if (fromLocation && toLocation) {
      calculateRoute();
    } else {
      setRouteResult(null);
      setRouteError(null);
    }
  }, [fromLocation, toLocation]);

  const calculateRoute = async () => {
    if (!fromLocation || !toLocation) return;
    setCalculatingRoute(true);
    setRouteError(null);
    try {
      const result = await calculateGoogleRoadRoute(fromLocation, toLocation);
      setRouteResult(result);
    } catch (err: any) {
      console.error(err);
      setRouteResult(null);
      setRouteError(err.message || 'Unable to calculate a driving route between these locations.');
      showNotification(err.message || 'Error calculating road route', 'error');
    } finally {
      setCalculatingRoute(false);
    }
  };

  // Dynamic Fare Calculation
  const fareBreakdown = calculateDynamicPassFare(
    routeResult ? routeResult.roadDistanceKm : 0,
    normalFarePerKm,
    discountPercentage,
    durationMonths
  );

  // Identity Proof & Receipt File Validation Constraints
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

  const validateUploadedFile = (file: File, fileLabel: string): { isValid: boolean; error?: string } => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isTypeValid = ALLOWED_TYPES.includes(file.type.toLowerCase()) || ALLOWED_EXTS.includes(ext);
    if (!isTypeValid) {
      return {
        isValid: false,
        error: `Invalid file format for ${fileLabel}. Only JPG, PNG, WEBP images or PDF files are accepted.`
      };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        isValid: false,
        error: `File size (${sizeMB} MB) exceeds maximum 5 MB limit for ${fileLabel}.`
      };
    }
    return { isValid: true };
  };

  const handleIdFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateUploadedFile(file, 'College ID Card Proof');
    if (!check.isValid) {
      showNotification(check.error!, 'error');
      e.target.value = '';
      return;
    }
    setIdFile(file);
    showNotification(`College ID Proof attached: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`, 'success');
  };

  const handleReceiptFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateUploadedFile(file, 'Payment Receipt');
    if (!check.isValid) {
      showNotification(check.error!, 'error');
      e.target.value = '';
      return;
    }
    setReceiptFile(file);
    showNotification(`Payment Receipt attached: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`, 'success');
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Strict Validation Checks before Submission
    const nameValidation = validateFullName(studentName);
    if (!nameValidation.isValid) {
      setNameError(nameValidation.error);
      showNotification(nameValidation.error!, 'warning');
      return;
    }
    setNameError(null);

    const regNoValidation = validateRegisterNumber(registerNumber);
    if (!regNoValidation.isValid) {
      setRegNoError(regNoValidation.error);
      showNotification(regNoValidation.error!, 'warning');
      return;
    }
    setRegNoError(null);

    if (!fromLocation) {
      showNotification('Please search and select a valid From location in Bengaluru', 'warning');
      return;
    }
    if (!toLocation) {
      showNotification('Please search and select a valid To location in Bengaluru', 'warning');
      return;
    }
    if (routeError || !routeResult) {
      showNotification(routeError || 'Please calculate a valid driving route before submitting', 'warning');
      return;
    }
    if (!paymentRef.trim()) {
      showNotification('Please provide your payment/UPI transaction reference ID', 'warning');
      return;
    }
    if (!idFile) {
      showNotification('Identity Proof Required: Please upload your College ID Card (JPG, PNG, WEBP or PDF under 5 MB) to proceed.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await updateProfileData({
        fullName: nameValidation.value,
        registerNumber: regNoValidation.value,
        phoneNumber: phoneNumber.trim(),
        department: department.trim(),
        college: college.trim()
      });

      let idProofUrl: string | null = null;
      let feeReceiptUrl: string | null = null;

      if (idFile) {
        idProofUrl = await uploadPassDocument(currentUser.uid, idFile, 'idProof');
      }
      if (receiptFile) {
        feeReceiptUrl = await uploadPassDocument(currentUser.uid, receiptFile, 'receipt');
      }

      const passType: PassType = durationMonths >= 12 ? 'Annual' : durationMonths >= 6 ? 'Semester' : 'Monthly';

      const passId = await applyForBusPass({
        userId: currentUser.uid,
        studentName: nameValidation.value,
        registerNumber: regNoValidation.value,
        department: department.trim() || 'Computer Science & Engineering',
        college: college.trim() || 'Saveetha School of Engineering (SIMATS)',
        phoneNumber: phoneNumber.trim() || '9876543210',
        routeId: `ROUTE_${fromLocation.name}_${toLocation.name}`.replace(/\s+/g, '_').toUpperCase(),
        routeName: `${fromLocation.name} ➔ ${toLocation.name} Transit`,
        stopId: fromLocation.placeId || fromLocation.name || 'STOP-1',
        stopName: fromLocation.name,
        fromStopId: fromLocation.placeId || fromLocation.name,
        fromStopName: fromLocation.name,
        toStopId: toLocation.placeId || toLocation.name,
        toStopName: toLocation.name,
        
        fromLocation,
        toLocation,
        roadDistanceKm: routeResult.roadDistanceKm,
        estimatedTimeMins: routeResult.estimatedTimeMins,
        oneWayDistanceKm: fareBreakdown.oneWayKm,
        roundTripDistanceKm: fareBreakdown.roundTripKm,
        monthlyDistanceKm: fareBreakdown.monthlyKm,
        normalFarePerKm: fareBreakdown.normalFarePerKm,
        normalMonthlyFare: fareBreakdown.normalMonthlyFare,
        discountPercentage: fareBreakdown.discountPercentage,
        discountAmount: fareBreakdown.discountAmount,
        monthlyPassPrice: fareBreakdown.monthlyPassPrice,
        durationMonths: fareBreakdown.durationMonths,
        totalFare: fareBreakdown.totalFare,

        passType,
        durationInMonths: fareBreakdown.durationMonths,
        paymentStatus: 'Paid',
        amount: fareBreakdown.totalFare,
        paymentRef: paymentRef.trim(),
        idProofUrl: idProofUrl || null,
        feeReceiptUrl: feeReceiptUrl || null
      });

      showNotification(`Bus pass application #${passId} submitted successfully! Awaiting Transport Administrator approval.`, 'success');
    } catch (err: any) {
      console.error(err);
      showNotification('Failed to submit pass application: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Bus Pass Application & Renewal
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search any Bengaluru city location via Google Places for real road distance calculation and student discounted bus pass pricing.
        </Typography>
      </Box>

      {/* Active Pass Banner if available */}
      {activePass && (() => {
        const st = (activePass.status || '').toLowerCase();
        const isApproved = st === 'approved' || st === 'issued';
        const isPending = st === 'pending';
        return (
          <Card sx={{ 
            mb: 4, 
            bgcolor: isApproved ? 'rgba(34, 197, 94, 0.1)' : isPending ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
            border: `1px solid ${isApproved ? 'rgba(34, 197, 94, 0.3)' : isPending ? 'rgba(234, 179, 8, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` 
          }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  Pass Application: {activePass.id} 
                  <Chip 
                    label={isPending ? 'Bus Pass Application Pending' : isApproved ? 'Bus Pass Approved' : 'Bus Pass Application Rejected'} 
                    color={isApproved ? 'success' : isPending ? 'warning' : 'error'}
                    size="small"
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  From: {activePass.fromLocation?.name || activePass.fromStopName || 'Origin'} ➔ To: {activePass.toLocation?.name || activePass.toStopName || 'Destination'}
                  {activePass.roadDistanceKm && ` | Road Distance: ${activePass.roadDistanceKm} km`}
                  {activePass.durationMonths && ` | Duration: ${activePass.durationMonths} Month(s)`}
                  {activePass.totalFare && ` | Total Fee: ₹${activePass.totalFare}`}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {isApproved && (
                  <Button
                    variant="contained"
                    color="success"
                    href="/student/pass/digital"
                    sx={{ fontWeight: 700 }}
                  >
                    View Digital QR Pass
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        );
      })()}

      <Grid container spacing={3}>
        {/* Application Form */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCard color="primary" /> Student Transit Application Form
            </Typography>

            {activePass && (() => {
              const activeStatus = (activePass.status || '').toLowerCase();
              const isPassExpired = activePass.validUntil ? Date.now() > activePass.validUntil : false;
              const isPending = activeStatus === 'pending';
              const isActiveApproved = (activeStatus === 'approved' || activeStatus === 'issued') && !isPassExpired;

              if (!isPending && !isActiveApproved) return null;

              return (
                <Alert 
                  severity={isPending ? 'warning' : 'info'} 
                  sx={{ mb: 3, fontWeight: 700, borderRadius: 2, alignItems: 'center' }}
                  action={
                    <Button 
                      color="primary" 
                      size="small" 
                      variant="contained" 
                      startIcon={<Logout />}
                      onClick={async () => {
                        await logout();
                        navigate('/login');
                      }}
                      sx={{ fontWeight: 800, textTransform: 'none', ml: 1, whiteSpace: 'nowrap' }}
                    >
                      Sign Out &amp; Register New Member
                    </Button>
                  }
                >
                  {isPending
                    ? `Application Pending Review: Your pass application #${activePass.id} is currently under Transport Office review.`
                    : `Active Approved Pass (#${activePass.id}): Currently logged in as ${studentName || profile?.fullName || 'Current Student'}. To apply for a NEW MEMBER, click to sign out and create a new student account.`
                  }
                </Alert>
              );
            })()}

            <form onSubmit={handleApply}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Full Name"
                    value={studentName}
                    onChange={handleNameChange}
                    error={!!nameError}
                    helperText={nameError || "Letters and spaces only (e.g. Raghu Ram)"}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Register / Roll Number"
                    value={registerNumber}
                    onChange={handleRegNoChange}
                    error={!!regNoError}
                    helperText={regNoError || "Digits 0-9 only (e.g. 192324247)"}
                    slotProps={{
                      htmlInput: {
                        type: 'text',
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        maxLength: 20
                      }
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone / Mobile Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </Grid>

                {/* Google Places Autocomplete: From Location */}
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    fullWidth
                    options={fromOptions}
                    isOptionEqualToValue={(option, val) => option?.placeId === val?.placeId}
                    getOptionLabel={(opt) => typeof opt === 'string' ? opt : `${opt.name} (${opt.address})`}
                    value={fromLocation}
                    onChange={(_, val) => setFromLocation(val)}
                    onInputChange={(_, val, reason) => {
                      if (reason === 'input') handleSearchFrom(val);
                      else if (reason === 'clear') handleSearchFrom('');
                    }}
                    loading={searchingFrom}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="From Location (Search Bengaluru)"
                        placeholder="e.g. Electronic City, Marathahalli, BTM Layout"
                      />
                    )}
                    renderOption={(props, opt) => (
                      <Box component="li" {...props} key={opt.placeId} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn fontSize="small" color="primary" /> {opt.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {opt.address}
                        </Typography>
                      </Box>
                    )}
                  />
                </Grid>

                {/* Google Places Autocomplete: To Location */}
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    fullWidth
                    options={toOptions}
                    isOptionEqualToValue={(option, val) => option?.placeId === val?.placeId}
                    getOptionLabel={(opt) => typeof opt === 'string' ? opt : `${opt.name} (${opt.address})`}
                    value={toLocation}
                    onChange={(_, val) => setToLocation(val)}
                    onInputChange={(_, val, reason) => {
                      if (reason === 'input') handleSearchTo(val);
                      else if (reason === 'clear') handleSearchTo('');
                    }}
                    loading={searchingTo}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="To Location (Search Bengaluru)"
                        placeholder="e.g. Whitefield, Yelahanka, Hebbal"
                      />
                    )}
                    renderOption={(props, opt) => (
                      <Box component="li" {...props} key={opt.placeId} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn fontSize="small" color="error" /> {opt.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {opt.address}
                        </Typography>
                      </Box>
                    )}
                  />
                </Grid>

                {/* Duration Selection (1 to 12 Months) */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Pass Duration (1 – 12 Months)</InputLabel>
                    <Select
                      value={durationMonths}
                      label="Pass Duration (1 – 12 Months)"
                      onChange={(e) => setDurationMonths(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                        <MenuItem key={m} value={m}>
                          {m} Month{m > 1 ? 's' : ''} {m === 1 ? '(Monthly)' : m === 6 ? '(Semester)' : m === 12 ? '(Annual)' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Payment / UPI Transaction Ref ID"
                    placeholder="e.g. UPI/2026/89374928"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                  />
                </Grid>

                {/* Identity Proof & Receipt Upload Section */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      COLLEGE ID CARD PROOF (COMPULSORY) *
                    </Typography>
                    {idFile ? (
                      <Paper sx={{ 
                        p: 1.5, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        borderRadius: 2, 
                        bgcolor: 'rgba(34, 197, 94, 0.08)', 
                        border: '1px solid rgba(34, 197, 94, 0.3)' 
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                          <CheckCircle color="success" fontSize="small" />
                          <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, noWrap: true }}>
                              {idFile.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(idFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Valid Proof Attached
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton size="small" color="error" onClick={() => setIdFile(null)} aria-label="Remove ID file">
                          <Close fontSize="small" />
                        </IconButton>
                      </Paper>
                    ) : (
                      <Button
                        fullWidth
                        variant="outlined"
                        component="label"
                        startIcon={<Badge color="primary" />}
                        sx={{ 
                          py: 1.4, 
                          borderRadius: 2, 
                          borderStyle: 'dashed', 
                          borderWidth: 2,
                          textTransform: 'none',
                          fontWeight: 700
                        }}
                      >
                        Upload College ID Card
                        <input
                          type="file"
                          hidden
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          onChange={handleIdFileSelect}
                        />
                      </Button>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
                      Accepted: JPG, PNG, WEBP, PDF &bull; Max size: 5 MB
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      PAYMENT / FEE RECEIPT (OPTIONAL)
                    </Typography>
                    {receiptFile ? (
                      <Paper sx={{ 
                        p: 1.5, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        borderRadius: 2, 
                        bgcolor: 'rgba(59, 130, 246, 0.08)', 
                        border: '1px solid rgba(59, 130, 246, 0.3)' 
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                          <CheckCircle color="primary" fontSize="small" />
                          <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, noWrap: true }}>
                              {receiptFile.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(receiptFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Receipt Proof Attached
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton size="small" color="error" onClick={() => setReceiptFile(null)} aria-label="Remove receipt file">
                          <Close fontSize="small" />
                        </IconButton>
                      </Paper>
                    ) : (
                      <Button
                        fullWidth
                        variant="outlined"
                        component="label"
                        startIcon={<Payment color="primary" />}
                        sx={{ 
                          py: 1.4, 
                          borderRadius: 2, 
                          borderStyle: 'dashed', 
                          borderWidth: 2,
                          textTransform: 'none',
                          fontWeight: 700
                        }}
                      >
                        Upload Payment Receipt
                        <input
                          type="file"
                          hidden
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          onChange={handleReceiptFileSelect}
                        />
                      </Button>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
                      Accepted: JPG, PNG, WEBP, PDF &bull; Max size: 5 MB
                    </Typography>
                  </Box>
                </Grid>

                {/* Interactive Map Preview Card */}
                {calculatingRoute ? (
                  <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <CircularProgress size={24} sx={{ mb: 1 }} />
                      <Typography variant="body2">Calculating Google road route and travel time...</Typography>
                    </Paper>
                  </Grid>
                ) : routeError ? (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      {routeError}
                    </Alert>
                  </Grid>
                ) : (fromLocation && toLocation && routeResult) ? (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Route color="primary" /> Google Maps Driving Route Preview
                    </Typography>
                    <GoogleRouteMap
                      fromLoc={fromLocation}
                      toLoc={toLocation}
                      roadDistanceKm={routeResult.roadDistanceKm}
                      estimatedTimeMins={routeResult.estimatedTimeMins}
                      polyline={routeResult.routePolyline}
                      height={320}
                    />
                  </Grid>
                ) : null}

                <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                  {(() => {
                    const activeStatus = (activePass?.status || '').toLowerCase();
                    const isPassExpired = activePass?.validUntil ? Date.now() > activePass.validUntil : false;
                    const isPending = activeStatus === 'pending';
                    const isActiveApproved = (activeStatus === 'approved' || activeStatus === 'issued') && !isPassExpired;
                    const hasActivePass = isPending || isActiveApproved;

                    return (
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        disabled={loading || !fromLocation || !toLocation || !routeResult || !!routeError || hasActivePass}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                        sx={{ py: 1.5, fontWeight: 700, fontSize: '1.05rem' }}
                      >
                        {loading 
                          ? 'Submitting Application...' 
                          : hasActivePass
                            ? `Active Pass Assigned (#${activePass?.id})`
                            : `Submit Pass Application (Total: ₹${fareBreakdown.totalFare})`
                        }
                      </Button>
                    );
                  })()}
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Dynamic Distance & Fare Breakdown Card */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <DirectionsBus /> Real-Time Fare & Savings Breakdown
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">From:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {fromLocation ? fromLocation.name : 'Select From Location'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">To:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {toLocation ? toLocation.name : 'Select To Location'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">Road Distance:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {routeResult ? `${routeResult.roadDistanceKm} km one way` : '--'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">Est. Travel Time:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {routeResult ? `~${routeResult.estimatedTimeMins} mins` : '--'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">Daily Round Trip:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {routeResult ? `${fareBreakdown.roundTripKm} km/day` : '--'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">Estimated Monthly Distance:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {routeResult ? `${fareBreakdown.monthlyKm} km` : '--'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">Normal Monthly Fare (₹1/km):</Typography>
              <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                {routeResult ? `₹${fareBreakdown.normalMonthlyFare}` : '--'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">Student Bus Pass Price:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {routeResult ? `₹${fareBreakdown.monthlyPassPrice} / month` : '--'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">You Save ({discountPercentage}% Discount):</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main' }}>
                {routeResult ? `₹${fareBreakdown.discountAmount} / month` : '--'}
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">Pass Duration:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {durationMonths} Month{durationMonths > 1 ? 's' : ''}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total Payable:</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                ₹{fareBreakdown.totalFare}
              </Typography>
            </Box>

            {routeResult ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                Discounted Student Pass Rate applied! Snapshot fare (₹{fareBreakdown.totalFare}) will be locked permanently upon submission.
              </Alert>
            ) : (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Search and select both From and To locations in Bengaluru above to calculate your exact road route distance and student pass fare.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentPass;
