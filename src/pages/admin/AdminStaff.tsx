import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, FormControl,
  InputLabel, Select, MenuItem, Avatar, Chip, Stack
} from '@mui/material';
import { Add, Edit, LockReset, PowerSettingsNew } from '@mui/icons-material';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getBuses, getRoutes } from '../../services/busService';
import type { UserProfile, BusDocument, RouteDocument } from '../../types';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import { usePagination } from '../../hooks/usePagination';

export const AdminStaff: React.FC = () => {
  const { profile } = useAuth();
  const { showNotification } = useNotification();
  
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [buses, setBuses] = useState<BusDocument[]>([]);
  const [routes, setRoutes] = useState<RouteDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [assignedBusId, setAssignedBusId] = useState('');
  const [assignedRouteId, setAssignedRouteId] = useState('');
  const [status, setStatus] = useState<'Active' | 'Pending' | 'Suspended'>('Active');

  useEffect(() => {
    loadStaffAndResources();
  }, []);

  const loadStaffAndResources = async () => {
    setLoading(true);
    try {
      const [snap, busesList, routesList] = await Promise.all([
        getDocs(collection(db, 'users')),
        getBuses(),
        getRoutes()
      ]);
      const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      setStaff(allUsers.filter(u => u.role === 'conductor'));
      setBuses(busesList);
      setRoutes(routesList);
    } catch (e) {
      console.error('Error loading staff:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFullName('');
    setEmail('');
    setPhoneNumber('');
    setBadgeNumber('');
    setAssignedBusId(buses[0]?.id || '');
    setAssignedRouteId(routes[0]?.id || '');
    setStatus('Active');
    setDialogOpen(true);
  };

  const handleOpenEdit = (member: UserProfile) => {
    setEditingStaff(member);
    setFullName(member.fullName);
    setEmail(member.email);
    setPhoneNumber(member.phoneNumber);
    setBadgeNumber(member.licenseNumber || '');
    setAssignedBusId(member.assignedBusId || '');
    setAssignedRouteId(member.assignedRouteId || '');
    setStatus(member.status || 'Active');
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!fullName.trim() || !email.trim() || !phoneNumber.trim()) {
      showNotification('Please fill all required conductor fields', 'warning');
      return;
    }

    try {
      const staffId = editingStaff?.id || `COND-${Date.now()}`;
      const now = Date.now();
      const payload: Partial<UserProfile> = {
        id: staffId,
        fullName: fullName.trim(),
        email: email.trim(),
        role: 'conductor',
        phoneNumber: phoneNumber.trim(),
        licenseNumber: badgeNumber.trim() || null,
        assignedBusId: assignedBusId || null,
        assignedRouteId: assignedRouteId || null,
        status,
        createdAt: editingStaff?.createdAt || now,
        updatedAt: now
      };

      await setDoc(doc(db, 'users', staffId), payload, { merge: true });

      if (!editingStaff) {
        try {
          await sendPasswordResetEmail(auth, email.trim());
          showNotification(`Conductor account created! Password setup link sent to ${email.trim()}.`, 'success');
        } catch (pwErr) {
          showNotification(`Conductor record saved to Firestore. Password reset link can be resent anytime.`, 'info');
        }
      } else {
        showNotification(`Conductor ${fullName} profile updated successfully!`, 'success');
      }

      setDialogOpen(false);
      loadStaffAndResources();
    } catch (err: any) {
      showNotification('Error saving conductor member: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleSendResetLink = async (targetEmail: string) => {
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      showNotification(`Password reset instructions sent to ${targetEmail}!`, 'success');
    } catch (err: any) {
      showNotification(`Failed to send password reset: ${err.message || 'Error occurred'}`, 'error');
    }
  };

  const handleToggleStatus = async (member: UserProfile) => {
    const newStatus = member.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await setDoc(doc(db, 'users', member.id), { status: newStatus, updatedAt: Date.now() }, { merge: true });
      showNotification(`Conductor account for ${member.fullName} is now ${newStatus}.`, 'info');
      loadStaffAndResources();
    } catch (err: any) {
      showNotification('Failed to update account status.', 'error');
    }
  };

  const {
    page,
    rowsPerPage,
    searchQuery,
    setSearchQuery,
    totalCount,
    paginatedData,
    orderBy,
    orderDirection,
    handlePageChange,
    handleRowsPerPageChange,
    handleSort
  } = usePagination<UserProfile>(
    staff,
    10,
    (item, query) =>
      Boolean(
        item.fullName.toLowerCase().includes(query.toLowerCase()) ||
        item.email.toLowerCase().includes(query.toLowerCase()) ||
        (item.assignedRouteId && item.assignedRouteId.toLowerCase().includes(query.toLowerCase()))
      )
  );

  const columns: Column<UserProfile>[] = [
    {
      id: 'fullName',
      label: 'Conductor Name',
      sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={row.photoUrl || undefined} sx={{ width: 36, height: 36, bgcolor: 'secondary.main', fontWeight: 800 }}>
            {row.fullName.substring(0, 2).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.fullName}</Typography>
            <Typography variant="caption" color="text.secondary">{row.email}</Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'role',
      label: 'Role',
      render: () => (
        <Chip 
          label="Conductor" 
          color="secondary" 
          size="small"
          sx={{ fontWeight: 800 }}
        />
      )
    },
    {
      id: 'phoneNumber',
      label: 'Contact Phone',
      render: (row) => row.phoneNumber || 'N/A'
    },
    {
      id: 'assignedBusId',
      label: 'Assigned Bus',
      render: (row) => {
        const bus = buses.find(b => b.id === row.assignedBusId);
        return bus ? `${bus.busNumber} (${bus.busName})` : row.assignedBusId || 'Unassigned';
      }
    },
    {
      id: 'assignedRouteId',
      label: 'Assigned Route',
      render: (row) => {
        const r = routes.find(rt => rt.id === row.assignedRouteId);
        return r ? r.routeName : row.assignedRouteId || 'General Pool';
      }
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <StatusChip status={row.status || 'Active'} />
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (row) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<Edit />} onClick={() => handleOpenEdit(row)}>
            Edit
          </Button>
          <Button size="small" variant="outlined" color="warning" startIcon={<LockReset />} onClick={() => handleSendResetLink(row.email)}>
            Reset PW
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            color={row.status === 'Active' ? 'error' : 'success'} 
            startIcon={<PowerSettingsNew />} 
            onClick={() => handleToggleStatus(row)}
          >
            {row.status === 'Active' ? 'Deactivate' : 'Activate'}
          </Button>
        </Stack>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Conductors Roster
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage conductor staff profiles, bus shift assignments, passwords via secure reset emails, and account status.
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleOpenAdd} sx={{ fontWeight: 700 }}>
          Create Conductor Account
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={paginatedData}
        loading={loading}
        searchPlaceholder="Search conductors by name, email, route..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        orderBy={orderBy as string}
        orderDirection={orderDirection}
        onSort={handleSort}
      />

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingStaff ? `Edit Conductor: ${editingStaff.fullName}` : 'Create New Conductor Account'}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Official Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!editingStaff}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Conductor Badge No."
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Assigned Bus</InputLabel>
                  <Select
                    value={assignedBusId}
                    label="Assigned Bus"
                    onChange={(e) => setAssignedBusId(e.target.value)}
                  >
                    <MenuItem value="">Unassigned Pool</MenuItem>
                    {buses.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.busNumber} ({b.busName})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Assigned Route</InputLabel>
                  <Select
                    value={assignedRouteId}
                    label="Assigned Route"
                    onChange={(e) => setAssignedRouteId(e.target.value)}
                  >
                    <MenuItem value="">General Pool</MenuItem>
                    {routes.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.routeName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Account Status</InputLabel>
                  <Select
                    value={status}
                    label="Account Status"
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Suspended">Suspended / Deactivated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Save Conductor Profile</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AdminStaff;
