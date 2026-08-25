import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, CircularProgress,
  Divider, Alert, Grid, Paper
} from '@mui/material';
import { 
  Download as DownloadIcon, Warning,
  DirectionsBus
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getStudentPass, subscribeStudentPass, generateQRCodeDataUrl } from '../../services/passService';
import type { BusPassDocument } from '../../types';
import StatusChip from '../../components/common/StatusChip';

export const StudentDigitalPass: React.FC = () => {
  const { currentUser } = useAuth();
  const [pass, setPass] = useState<BusPassDocument | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeStudentPass(currentUser.uid, (data) => {
      setPass(data);
      setLoading(false);
      if (data) {
        const st = (data.status || '').toLowerCase();
        if (st === 'issued' || st === 'approved') {
          generateQRCodeDataUrl(data.qrPayload || data.id).then(setQrUrl).catch(console.warn);
        } else {
          setQrUrl(null);
        }
      } else {
        setQrUrl(null);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleDownloadQR = () => {
    if (!qrUrl || !pass) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `Eroute_Pass_${pass.registerNumber}.png`;
    a.click();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!pass) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center', py: 6 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          You do not have an active bus pass yet. Please apply for a transit pass to get your digital QR card.
        </Alert>
        <Button variant="contained" color="primary" href="/student/pass">
          Apply For Bus Pass
        </Button>
      </Box>
    );
  }

  const statusLower = (pass.status || '').toLowerCase();

  if (statusLower === 'pending') {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto', py: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(234, 179, 8, 0.4)', bgcolor: 'rgba(234, 179, 8, 0.05)', textAlign: 'center' }}>
          <Warning sx={{ fontSize: 56, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            Bus Pass Application Pending
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your pass application <strong>#{pass.id}</strong> has been submitted and is currently waiting for review and approval by the Transport Office Admin.
          </Typography>

          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper', mb: 3, textAlign: 'left' }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Applicant</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{pass.studentName} ({pass.registerNumber})</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Route & Stop</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{pass.routeName} - {pass.stopName}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Pass Type & Fee</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{pass.passType} Pass (₹{pass.amount || pass.totalFare})</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Payment Ref ID</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{pass.paymentRef}</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Button variant="outlined" color="primary" href="/student/pass">
            View Application Details
          </Button>
        </Paper>
      </Box>
    );
  }

  if (statusLower === 'rejected') {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto', py: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(239, 68, 68, 0.4)', bgcolor: 'rgba(239, 68, 68, 0.05)', textAlign: 'center' }}>
          <Warning sx={{ fontSize: 56, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            Bus Pass Application Rejected
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Your pass application <strong>#{pass.id}</strong> was rejected by the Transport Administrator.
          </Typography>
          {pass.rejectionReason && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <strong>Reason:</strong> {pass.rejectionReason}
            </Alert>
          )}
          <Button variant="contained" color="primary" href="/student/pass">
            Re-Apply for Bus Pass
          </Button>
        </Paper>
      </Box>
    );
  }

  const isExpired = Date.now() > pass.validUntil;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Digital QR Bus Pass
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Present this official digital barcode / QR code to the conductor when boarding campus transit vehicles.
        </Typography>
      </Box>

      {/* Digital ID Card */}
      <Paper
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#fff',
          border: '2px solid #3B82F6',
          boxShadow: '0 16px 40px rgba(59, 130, 246, 0.25)',
          mb: 4
        }}
      >
        {/* Pass Header */}
        <Box sx={{ bgcolor: 'primary.main', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DirectionsBus sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                SIMATS CAMPUS MOBILITY
              </Typography>
              <Typography variant="caption" sx={{ letterSpacing: 1.5, opacity: 0.9 }}>
                DIGITAL TRANSIT IDENTIFICATION
              </Typography>
            </Box>
          </Box>
          <StatusChip status={isExpired ? 'Expired' : pass.status} />
        </Box>

        <Box sx={{ p: { xs: 3, md: 4 } }}>
          <Grid container spacing={3} sx={{ alignItems: 'center' }}>
            {/* QR Code Column */}
            <Grid size={{ xs: 12, md: 5 }} sx={{ textAlign: 'center' }}>
              {qrUrl ? (
                <Box
                  sx={{
                    bgcolor: '#fff',
                    p: 2,
                    borderRadius: 3,
                    display: 'inline-block',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                  }}
                >
                  <img src={qrUrl} alt="Student QR Pass" style={{ width: 180, height: 180, display: 'block' }} />
                  <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 700, mt: 1, display: 'block' }}>
                    {pass.id}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 4, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                  <Warning sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    QR Pass will generate automatically once approved by administration.
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Student Pass Details Column */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                {pass.studentName}
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#3B82F6', fontWeight: 700, mb: 2 }}>
                Register No: {pass.registerNumber}
              </Typography>

              <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.1)' }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>Department</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{pass.department}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>Pass Category</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{pass.passType} Pass</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>Transit Route</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{pass.routeName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>Boarding Stop</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{pass.stopName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>Issue Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date(pass.issueDate).toLocaleDateString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>Valid Until</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: isExpired ? 'error.main' : 'success.main' }}>
                    {new Date(pass.validUntil).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            Protected with Encrypted Dynamic QR Verification
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            disabled={!qrUrl}
            onClick={handleDownloadQR}
            sx={{ fontWeight: 700 }}
          >
            Download Pass Badge
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
export default StudentDigitalPass;
