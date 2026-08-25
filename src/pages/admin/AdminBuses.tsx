import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, FormControl,
  InputLabel, Select, MenuItem 
} from '@mui/material';
import { Add, DirectionsBus, Delete, Edit } from '@mui/icons-material';
import { getBuses, saveBus, deleteBus, getRoutes } from '../../services/busService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import type { BusDocument, RouteDocument, UserProfile } from '../../types';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { usePagination } from '../../hooks/usePagination';

export const AdminBuses: React.FC = () => {
  const { profile } = useAuth();
  const { showNotification } = useNotification();
  
  const [buses, setBuses] = useState<BusDocument[]>([]);
  const [routes, setRoutes] = useState<RouteDocument[]>([]);
  const [conductors, setConductors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal form states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<BusDocument | null>(null);
  const [busNumber, setBusNumber] = useState('');
  const [busName, setBusName] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [assignedRouteId, setAssignedRouteId] = useState('');
  const [conductorId, setConductorId] = useState('');
  const [busStatus, setBusStatus] = useState<'In Service' | 'Maintenance' | 'Out of Service'>('In Service');
  
  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allBuses, allRoutes, usersSnap] = await Promise.all([
        getBuses(),
        getRoutes(),
        getDocs(collection(db, 'users'))
      ]);
      setBuses(allBuses);
      setRoutes(allRoutes);
      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      setConductors(allUsers.filter(u => u.role === 'conductor'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingBus(null);
    setBusNumber('');
    setBusName('');
    setCapacity(50);
    setAssignedRouteId(routes[0]?.id || '');
    setConductorId('');
    setBusStatus('In Service');
    setDialogOpen(true);
  };

  const handleOpenEdit = (bus: BusDocument) => {
    setEditingBus(bus);
    setBusNumber(bus.busNumber);
    setBusName(bus.busName);
    setCapacity(bus.capacity);
    setAssignedRouteId(bus.assignedRouteId);
    setConductorId(bus.conductorId || '');
    setBusStatus(bus.status);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!busNumber.trim()) {
      showNotification('Please provide bus vehicle plate number', 'warning');
      return;
    }

    try {
      const route = routes.find(r => r.id === assignedRouteId);
      const conductor = conductors.find(c => c.id === conductorId);

      await saveBus({
        id: editingBus?.id,
        busNumber: busNumber.trim().toUpperCase(),
        busName: busName.trim() || `Bus ${busNumber}`,
        capacity: Number(capacity),
        assignedRouteId,
        assignedRouteName: route ? route.routeName : 'General Route',
        conductorId: conductor ? conductor.id : null,
        conductorName: conductor ? conductor.fullName : null,
        status: busStatus,
        createdAt: editingBus?.createdAt || Date.now(),
        updatedAt: Date.now()
      }, { id: profile.id, email: profile.email, role: profile.role });

      showNotification(`Bus ${busNumber} saved successfully!`, 'success');
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      showNotification('Error saving bus: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !profile) return;
    try {
      await deleteBus(deleteTarget, { id: profile.id, email: profile.email, role: profile.role });
      showNotification('Bus deleted successfully!', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (_e) {
      showNotification('Failed to delete bus', 'error');
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
  } = usePagination<BusDocument>(
    buses,
    10,
    (item, query) =>
      Boolean(
        item.busNumber.toLowerCase().includes(query.toLowerCase()) ||
        item.busName.toLowerCase().includes(query.toLowerCase()) ||
        item.assignedRouteName.toLowerCase().includes(query.toLowerCase()) ||
        (item.conductorName && item.conductorName.toLowerCase().includes(query.toLowerCase()))
      )
  );

  const columns: Column<BusDocument>[] = [
    {
      id: 'busNumber',
      label: 'Vehicle Reg. No.',
      sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DirectionsBus color="primary" fontSize="small" />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.busNumber}</Typography>
            <Typography variant="caption" color="text.secondary">{row.busName}</Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'assignedRouteName',
      label: 'Assigned Route',
      sortable: true
    },
    {
      id: 'capacity',
      label: 'Capacity',
      sortable: true,
      render: (row) => `${row.capacity} Seats`
    },
    {
      id: 'conductorName',
      label: 'Assigned Conductor',
      render: (row) => row.conductorName || <Typography variant="caption" color="text.secondary">Unassigned</Typography>
    },
    {
      id: 'status',
      label: 'Fleet Status',
      render: (row) => <StatusChip status={row.status} />
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<Edit />} onClick={() => handleOpenEdit(row)}>
            Edit
          </Button>
          <Button size="small" variant="outlined" color="error" startIcon={<Delete />} onClick={() => setDeleteTarget(row.id)}>
            Delete
          </Button>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Fleet & Bus Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage university transit buses, seat capacities, and conductor shift allocations.
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleOpenAdd} sx={{ fontWeight: 700 }}>
          Add New Bus
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={paginatedData}
        loading={loading}
        searchPlaceholder="Search by vehicle number, route, conductor..."
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
          {editingBus ? `Edit Bus: ${editingBus.busNumber}` : 'Register New Bus'}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Plate Number (e.g. TN-09-AB-1234)"
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Bus Identifier / Label"
                  placeholder="e.g. Bus 12A"
                  value={busName}
                  onChange={(e) => setBusName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Passenger Capacity"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Operational Status</InputLabel>
                  <Select
                    value={busStatus}
                    label="Operational Status"
                    onChange={(e) => setBusStatus(e.target.value as any)}
                  >
                    <MenuItem value="In Service">In Service</MenuItem>
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                    <MenuItem value="Out of Service">Out of Service</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Assigned Route</InputLabel>
                  <Select
                    value={assignedRouteId}
                    label="Assigned Route"
                    onChange={(e) => setAssignedRouteId(e.target.value)}
                  >
                    {routes.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.routeName} ({r.startPoint} - {r.endPoint})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Assigned Conductor</InputLabel>
                  <Select
                    value={conductorId}
                    label="Assigned Conductor"
                    onChange={(e) => setConductorId(e.target.value)}
                  >
                    <MenuItem value="">-- None / Unassigned --</MenuItem>
                    {conductors.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.fullName} ({c.phoneNumber})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Save Vehicle</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Confirm Delete Bus"
        message="Are you sure you want to delete this bus vehicle record from the system?"
        confirmColor="error"
        confirmText="Delete Bus"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
};
export default AdminBuses;
