import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Grid, Typography, Button, 
  CircularProgress, Paper, Divider, Alert
} from '@mui/material';
import { 
  QrCode as QrIcon, 
  DirectionsBus, History, CreditCard, RateReview, Autorenew
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getStudentPass, subscribeStudentPass, generateQRCodeDataUrl } from '../../services/passService';
import { getStudentAttendanceHistory } from '../../services/attendanceService';
import type { BusPassDocument, AttendanceLogDocument } from '../../types';
import StatCard from '../../components/common/StatCard';
import StatusChip from '../../components/common/StatusChip';
import QRModal from '../../components/common/QRModal';

export const StudentDashboard: React.FC = () => {
  const { profile, currentUser } = useAuth();
  const navigate = useNavigate();

  const [activePass, setActivePass] = useState<BusPassDocument | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceLogDocument[]>([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getStudentAttendanceHistory(currentUser.uid).then(setAttendance).catch(console.warn);

    const unsubscribe = subscribeStudentPass(currentUser.uid, (passDoc) => {
      setActivePass(passDoc);
      setLoading(false);
      if (passDoc) {
        const st = (passDoc.status || '').toLowerCase();
        if (st === 'issued' || st === 'approved') {
          generateQRCodeDataUrl(passDoc.qrPayload || passDoc.id).then(setQrUrl).catch(console.warn);
        } else {
          setQrUrl(null);
        }
      } else {
        setQrUrl(null);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const isExpired = activePass ? Date.now() > activePass.validUntil : false;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Banner */}
      <Box sx={{ mb: { xs: 2.5, sm: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.4rem', sm: '2rem' } }}>
            Welcome, {profile?.fullName || 'Student'}! 👋
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
            {profile?.registerNumber} | {profile?.department || 'Saveetha Engineering'} • Student Mobility Hub
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<QrIcon />}
            onClick={() => setQrModalOpen(true)}
            disabled={!activePass || isExpired || (activePass.status !== 'Issued' && activePass.status !== 'Approved')}
            sx={{ fontWeight: 700, py: { xs: 1, sm: 1.2 } }}
          >
            Digital QR Pass
          </Button>
        </Box>
      </Box>

      {/* Expired Pass Alert Banner */}
      {isExpired && (
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" startIcon={<Autorenew />} onClick={() => navigate('/student/pass')}>
              Renew Now
            </Button>
          }
          sx={{ mb: 3, borderRadius: 2, fontWeight: 700 }}
        >
          Your bus pass has expired. Please submit a renewal request to continue campus transit services.
        </Alert>
      )}

      {/* KPI Stat Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2.5 }} sx={{ mb: { xs: 2.5, sm: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Pass Status"
            value={isExpired ? 'Expired' : activePass ? activePass.status : 'No Pass'}
            subtitle={activePass ? `${activePass.passType} Pass` : 'Apply now'}
            icon={<CreditCard sx={{ color: '#fff' }} />}
            gradient={isExpired ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Assigned Route"
            value={activePass ? activePass.routeName.split('➔')[0] || activePass.routeName : 'No Route'}
            subtitle={activePass?.stopName || 'Search Location'}
            icon={<DirectionsBus sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #059669 0%, #047857 100%)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Boardings"
            value={attendance.length}
            subtitle="Verified attendance logs"
            icon={<History sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Campus Mobility"
            value="eRoute System"
            subtitle="Student Transit Portal"
            icon={<DirectionsBus sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #d97706 0%, #b45309 100%)"
          />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Pass Details Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, height: '100%', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                My Bus Transportation Pass
              </Typography>
              {activePass && <StatusChip status={isExpired ? 'Expired' : activePass.status} />}
            </Box>
            <Divider sx={{ mb: 2 }} />

            {activePass ? (
              <Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Pass Number</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{activePass.id}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Duration Category</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{activePass.passType}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">From Location</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{activePass.fromLocation?.name || activePass.fromStopName || 'Origin'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">To Location</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{activePass.toLocation?.name || activePass.toStopName || 'Destination'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">Validity Expiration</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isExpired ? 'error.main' : 'primary.main' }}>
                      {new Date(activePass.validUntil).toLocaleDateString()} {isExpired ? '(Expired)' : ''}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
                  {!isExpired && (
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<QrIcon />}
                      onClick={() => setQrModalOpen(true)}
                    >
                      View QR Pass
                    </Button>
                  )}
                  <Button
                    variant={isExpired ? 'contained' : 'outlined'}
                    color={isExpired ? 'primary' : 'inherit'}
                    fullWidth
                    startIcon={<Autorenew />}
                    onClick={() => navigate('/student/pass')}
                  >
                    Renew Bus Pass
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  You do not have an active transit pass.
                </Typography>
                <Button variant="contained" color="primary" onClick={() => navigate('/student/pass')}>
                  Apply For Bus Pass Now
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Live Transit & Recent Boarding Widget */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, height: '100%', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Recent Boardings & Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {attendance.length > 0 ? (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Last Boarded:
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {attendance[0].busNumber} - {attendance[0].stopName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(attendance[0].scanTimestamp).toLocaleString()} • Verified by Conductor
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                No attendance records available.
              </Typography>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Quick Services
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<History />}
                  onClick={() => navigate('/student/attendance')}
                >
                  All Logs
                </Button>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RateReview />}
                  onClick={() => navigate('/student/feedback')}
                >
                  Feedback
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* QR Modal */}
      <QRModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        pass={activePass}
        qrDataUrl={qrUrl}
      />
    </Box>
  );
};
export default StudentDashboard;
