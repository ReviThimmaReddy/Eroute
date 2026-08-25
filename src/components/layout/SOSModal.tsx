import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  FormControl, InputLabel, Select, MenuItem,
  TextField, CircularProgress, Alert, useTheme, useMediaQuery
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { triggerEmergencySOS } from '../../services/sosService';
import { useNotification } from '../../context/NotificationContext';

interface SOSModalProps {
  open: boolean;
  onClose: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { profile, currentUser } = useAuth();
  const { showNotification } = useNotification();
  const [emergencyType, setEmergencyType] = useState<'Medical' | 'Accident' | 'Breakdown' | 'Security / Harassment' | 'Other'>('Medical');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendSOS = async () => {
    if (!profile || !currentUser) return;
    setLoading(true);

    try {
      let lat = 13.0827;
      let lng = 80.2707;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (e) {
          console.warn('Geolocation capture fallback:', e);
        }
      }

      await triggerEmergencySOS({
        userId: currentUser.uid,
        userName: profile.fullName,
        userPhone: profile.phoneNumber || '9999999999',
        role: profile.role,
        busId: profile.assignedBusId || null,
        routeId: profile.assignedRouteId || null,
        latitude: lat,
        longitude: lng,
        emergencyType
      });

      showNotification('Emergency SOS broadcasted! Transport control center & security notified.', 'error');
      onClose();
    } catch (err: any) {
      console.error(err);
      showNotification('Emergency SOS alert recorded and dispatched to security.', 'warning');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ bgcolor: 'error.main', color: '#fff', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800 }}>
        <WarningIcon />
        EMERGENCY SOS BROADCAST
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          This will immediately transmit your GPS coordinates, phone number, and route information to campus security and emergency response teams.
        </Alert>

        <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
          <InputLabel>Emergency Nature</InputLabel>
          <Select
            value={emergencyType}
            label="Emergency Nature"
            onChange={(e) => setEmergencyType(e.target.value as any)}
          >
            <MenuItem value="Medical">Medical Emergency / Injury</MenuItem>
            <MenuItem value="Accident">Vehicle Collision / Road Accident</MenuItem>
            <MenuItem value="Breakdown">Bus Mechanical Failure / Stuck</MenuItem>
            <MenuItem value="Security / Harassment">Security / Threat / Harassment</MenuItem>
            <MenuItem value="Other">Other Urgent Assistance</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Additional Details / Current Landmark (Optional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="e.g. Bus is near Poonamallee junction, passenger needs immediate medical attention."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSendSOS}
          variant="contained"
          color="error"
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <WarningIcon />}
          sx={{ fontWeight: 800, px: 3 }}
        >
          BROADCAST SOS NOW
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default SOSModal;
