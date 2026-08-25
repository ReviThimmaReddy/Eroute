import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Card, CardContent, Divider, useTheme, useMediaQuery
} from '@mui/material';
import { Download as DownloadIcon, Close as CloseIcon, DirectionsBus } from '@mui/icons-material';
import type { BusPassDocument } from '../../types';

interface QRModalProps {
  open: boolean;
  onClose: () => void;
  pass: BusPassDocument | null;
  qrDataUrl: string | null;
}

export const QRModal: React.FC<QRModalProps> = ({ open, onClose, pass, qrDataUrl }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  if (!pass) return null;

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `BusPass_${pass.registerNumber}_${pass.id}.png`;
    a.click();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Digital Bus Pass
        <Button onClick={onClose} size="small" color="inherit">
          <CloseIcon />
        </Button>
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', 
          color: '#fff', 
          borderRadius: 3,
          p: { xs: 1, sm: 2 },
          border: '2px solid #3B82F6',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.25)'
        }}>
          <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
              <DirectionsBus sx={{ color: '#3B82F6' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                SIMATS TRANSPORTATION
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#94A3B8', letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 10 }}>
              Student Mobility Pass ({pass.passType})
            </Typography>

            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

            {qrDataUrl && (
              <Box sx={{ 
                bgcolor: '#fff', 
                p: 1.5, 
                borderRadius: 2, 
                display: 'inline-block', 
                mb: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
                <img src={qrDataUrl} alt="Bus Pass QR Code" style={{ width: isMobile ? 150 : 180, height: isMobile ? 150 : 180, display: 'block' }} />
              </Box>
            )}

            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {pass.studentName}
            </Typography>
            <Typography variant="body2" sx={{ color: '#3B82F6', fontWeight: 600 }}>
              Reg: {pass.registerNumber} | {pass.department}
            </Typography>

            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, textAlign: 'left' }}>
              <Typography variant="body2"><strong>Route:</strong> {pass.routeName}</Typography>
              <Typography variant="body2"><strong>Boarding Stop:</strong> {pass.stopName}</Typography>
              <Typography variant="body2"><strong>Valid Until:</strong> {new Date(pass.validUntil).toLocaleDateString()}</Typography>
              <Typography variant="body2"><strong>Pass ID:</strong> {pass.id}</Typography>
            </Box>
          </CardContent>
        </Card>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button
          onClick={downloadQR}
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          disabled={!qrDataUrl}
        >
          Download QR Pass
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default QRModal;
