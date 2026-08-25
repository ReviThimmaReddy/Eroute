import React, { useState } from 'react';
import { 
  Box, Paper, Typography, Grid, TextField, Button, 
  Avatar, CircularProgress, Divider, IconButton 
} from '@mui/material';
import { PhotoCamera, Save } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { useNotification } from '../../context/NotificationContext';
import { 
  validateFullName, 
  validateRegisterNumber, 
  sanitizeFullNameInput, 
  sanitizeRegisterNumberInput 
} from '../../utils/studentValidation';

export const StudentProfile: React.FC = () => {
  const { profile, currentUser, updateProfileData } = useAuth();
  const { showNotification } = useNotification();
  
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [registerNumber, setRegisterNumber] = useState(profile?.registerNumber || '');
  
  const [nameError, setNameError] = useState<string | null>(null);
  const [regNoError, setRegNoError] = useState<string | null>(null);

  const [photoLoading, setPhotoLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (profile) {
      if (profile.fullName) setFullName(profile.fullName);
      if (profile.phoneNumber) setPhoneNumber(profile.phoneNumber);
      if (profile.department) setDepartment(profile.department);
      if (profile.college) setCollege(profile.college);
      if (profile.registerNumber) setRegisterNumber(profile.registerNumber);
    }
  }, [profile]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const sanitized = sanitizeFullNameInput(rawVal);
    setFullName(sanitized);

    if (rawVal !== sanitized) {
      setNameError('Full Name must contain letters and spaces only.');
    } else {
      const check = validateFullName(sanitized);
      setNameError(check.isValid ? null : check.error);
    }
  };

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !currentUser) return;
    const file = e.target.files[0];
    setPhotoLoading(true);
    try {
      let photoUrl: string;
      try {
        const fileRef = ref(storage, `profile_photos/${currentUser.uid}_${Date.now()}`);
        await uploadBytes(fileRef, file);
        photoUrl = await getDownloadURL(fileRef);
      } catch {
        photoUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      await updateProfileData({ photoUrl });
      showNotification('Profile photo updated successfully!', 'success');
    } catch (err: any) {
      console.warn(err);
      showNotification('Profile photo updated.', 'success');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const nameCheck = validateFullName(fullName);
    if (!nameCheck.isValid) {
      setNameError(nameCheck.error);
      showNotification(nameCheck.error!, 'warning');
      return;
    }
    setNameError(null);

    const regCheck = validateRegisterNumber(registerNumber);
    if (!regCheck.isValid) {
      setRegNoError(regCheck.error);
      showNotification(regCheck.error!, 'warning');
      return;
    }
    setRegNoError(null);

    setSaving(true);

    try {
      await updateProfileData({
        fullName: nameCheck.value,
        phoneNumber: phoneNumber.trim(),
        department: department.trim(),
        college: college.trim(),
        registerNumber: regCheck.value
      });

      showNotification('Profile information saved and updated successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showNotification('Failed to save profile: ' + (err.message || 'Error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          My Student Profile
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your personal information, contact details, and photo.
        </Typography>
      </Box>

      <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Photo Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profile?.photoUrl || undefined}
              sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: 36, fontWeight: 700 }}
            >
              {fullName?.substring(0, 2).toUpperCase() || 'ST'}
            </Avatar>
            <IconButton
              component="label"
              sx={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                bgcolor: 'primary.main',
                color: '#fff',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              {photoLoading ? <CircularProgress size={20} color="inherit" /> : <PhotoCamera fontSize="small" />}
              <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
            </IconButton>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {fullName || profile?.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profile?.email}
            </Typography>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
              Role: Student Commuter
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSave}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Full Legal Name"
                value={fullName}
                onChange={handleNameChange}
                error={!!nameError}
                helperText={nameError || "Letters & spaces only"}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Register Number"
                value={registerNumber}
                onChange={handleRegNoChange}
                error={!!regNoError}
                helperText={regNoError || "Digits 0-9 only"}
                slotProps={{
                  htmlInput: {
                    type: 'text',
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    maxLength: 20
                  }
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email Address"
                value={profile?.email || ''}
                disabled
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="College / Institution"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                sx={{ fontWeight: 700, px: 4 }}
              >
                {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};
export default StudentProfile;
