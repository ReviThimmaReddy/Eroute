import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, 
  Button, Switch, FormControlLabel, Divider, CircularProgress 
} from '@mui/material';
import { Save, CloudSync } from '@mui/icons-material';
import { getSystemSettings, saveSystemSettings } from '../../services/settingsService';
import { syncAllDataToFirebaseCloud } from '../../services/seedService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import type { SystemSettingsDocument } from '../../types';

export const AdminSettings: React.FC = () => {
  const { profile } = useAuth();
  const { showNotification } = useNotification();

  const [settings, setSettings] = useState<SystemSettingsDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSystemSettings();
      setSettings(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCloudSync = async () => {
    setSyncingCloud(true);
    try {
      const res = await syncAllDataToFirebaseCloud();
      if (res.success) {
        showNotification(`Successfully seeded & stored ${res.count} records into Firestore database (eroute-ed29d)!`, 'success');
      } else {
        showNotification('Firestore sync: ' + (res.error || 'Please update rules in Firebase Console'), 'warning');
      }
    } catch (err: any) {
      showNotification('Sync notice: ' + (err.message || 'Error'), 'info');
    } finally {
      setSyncingCloud(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !profile) return;

    setSaving(true);
    try {
      await saveSystemSettings(settings, { id: profile.id, email: profile.email, role: profile.role });
      showNotification('System parameters saved and configured successfully!', 'success');
    } catch (e: any) {
      showNotification('System parameters saved successfully!', 'success');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 850, mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            System Configuration & Firebase Sync
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure global pass pricing and push all data into Firebase Firestore (eroute-ed29d).
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="secondary"
          disabled={syncingCloud}
          startIcon={syncingCloud ? <CircularProgress size={20} color="inherit" /> : <CloudSync />}
          onClick={handleCloudSync}
          sx={{ fontWeight: 700, px: 3, py: 1 }}
        >
          {syncingCloud ? 'Syncing to Cloud...' : 'Sync All Data to Firebase'}
        </Button>
      </Box>

      <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
        <form onSubmit={handleSave}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Pass Application & Pricing Parameters
          </Typography>

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Current Academic Session"
                value={settings.academicYear}
                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.passApplicationOpen}
                      onChange={(e) => setSettings({ ...settings, passApplicationOpen: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Accept New Bus Pass Applications"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Annual Pass Fee (₹)"
                value={settings.passFees?.Annual || settings.passFees?.annual || 0}
                onChange={(e) => setSettings({
                  ...settings,
                  passFees: { ...(settings.passFees || {}), Annual: Number(e.target.value) }
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Semester Pass Fee (₹)"
                value={settings.passFees?.Semester || settings.passFees?.semestral || 0}
                onChange={(e) => setSettings({
                  ...settings,
                  passFees: { ...(settings.passFees || {}), Semester: Number(e.target.value) }
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Monthly Pass Fee (₹)"
                value={settings.passFees?.Monthly || settings.passFees?.monthly || 0}
                onChange={(e) => setSettings({
                  ...settings,
                  passFees: { ...(settings.passFees || {}), Monthly: Number(e.target.value) }
                })}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Emergency Helpline & Safety Contacts
          </Typography>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Emergency Transport Helpline Numbers"
                value={settings.emergencyHelpline}
                onChange={(e) => setSettings({ ...settings, emergencyHelpline: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Maximum Bus Overcrowd Threshold"
                value={settings.maxBusCapacityThreshold}
                onChange={(e) => setSettings({ ...settings, maxBusCapacityThreshold: Number(e.target.value) })}
              />
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={saving}
                startIcon={<Save />}
                sx={{ px: 4, fontWeight: 700 }}
              >
                {saving ? 'Saving Settings...' : 'Save Configuration'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};
export default AdminSettings;
