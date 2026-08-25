import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, FormControl,
  InputLabel, Select, MenuItem 
} from '@mui/material';
import { Add, Delete, Edit, Place } from '@mui/icons-material';
import { getBusStops, saveBusStop, deleteBusStop, getRoutes } from '../../services/busService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import type { BusStopDocument, RouteDocument } from '../../types';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { usePagination } from '../../hooks/usePagination';

export const AdminStops: React.FC = () => {
  const { profile } = useAuth();
  const { showNotification } = useNotification();
  
  const [stops, setStops] = useState<BusStopDocument[]>([]);
  const [routes, setRoutes] = useState<RouteDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal form states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<BusStopDocument | null>(null);
  const [stopName, setStopName] = useState('');
  const [routeId, setRouteId] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [latitude, setLatitude] = useState(13.0827);
  const [longitude, setLongitude] = useState(80.2707);
  const [landmark, setLandmark] = useState('');
  const [pickupTime, setPickupTime] = useState('07:30 AM');
  const [dropTime, setDropTime] = useState('05:30 PM');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allStops, allRoutes] = await Promise.all([
        getBusStops(),
        getRoutes()
      ]);
      setStops(allStops);
      setRoutes(allRoutes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStop(null);
    setStopName('');
    setRouteId(routes[0]?.id || '');
    setOrderIndex(stops.length + 1);
    setLatitude(13.0827);
    setLongitude(80.2707);
    setLandmark('');
    setPickupTime('07:30 AM');
    setDropTime('05:30 PM');
    setDialogOpen(true);
  };

  const handleOpenEdit = (stop: BusStopDocument) => {
    setEditingStop(stop);
    setStopName(stop.stopName);
    setRouteId(stop.routeId);
    setOrderIndex(stop.orderIndex);
    setLatitude(stop.latitude);
    setLongitude(stop.longitude);
    setLandmark(stop.landmark || '');
    setPickupTime(stop.pickupTime || '');
    setDropTime(stop.dropTime || '');
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!stopName.trim() || !routeId) {
      showNotification('Please fill in stop name and select route', 'warning');
      return;
    }

    try {
      const route = routes.find(r => r.id === routeId);
      await saveBusStop({
        id: editingStop?.id,
        stopName: stopName.trim(),
        routeId,
        routeName: route ? route.routeName : 'Assigned Route',
        orderIndex: Number(orderIndex),
        latitude: Number(latitude),
        longitude: Number(longitude),
        landmark: landmark.trim() || undefined,
        pickupTime,
        dropTime,
        createdAt: editingStop?.createdAt || Date.now(),
        updatedAt: Date.now()
      }, { id: profile.id, email: profile.email, role: profile.role });

      showNotification(`Bus Stop ${stopName} saved successfully!`, 'success');
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      showNotification('Error saving bus stop: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !profile) return;
    try {
      await deleteBusStop(deleteTarget, { id: profile.id, email: profile.email, role: profile.role });
      showNotification('Bus stop deleted successfully!', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (_e) {
      showNotification('Failed to delete stop', 'error');
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
  } = usePagination<BusStopDocument>(
    stops,
    10,
    (item, query) =>
      Boolean(
        item.stopName.toLowerCase().includes(query.toLowerCase()) ||
        item.routeName.toLowerCase().includes(query.toLowerCase()) ||
        (item.landmark && item.landmark.toLowerCase().includes(query.toLowerCase()))
      )
  );

  const columns: Column<BusStopDocument>[] = [
    {
      id: 'stopName',
      label: 'Bus Stop Name',
      sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Place color="error" fontSize="small" />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.stopName}</Typography>
            {row.landmark && <Typography variant="caption" color="text.secondary">Near {row.landmark}</Typography>}
          </Box>
        </Box>
      )
    },
    {
      id: 'routeName',
      label: 'Assigned Route',
      sortable: true
    },
    {
      id: 'orderIndex',
      label: 'Sequence',
      sortable: true,
      render: (row) => `Stop #${row.orderIndex}`
    },
    {
      id: 'pickupTime',
      label: 'Morning Pickup',
      render: (row) => row.pickupTime || '07:30 AM'
    },
    {
      id: 'dropTime',
      label: 'Evening Drop',
      render: (row) => row.dropTime || '05:30 PM'
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
            Bus Stops & Waypoints Master
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage student pickup/drop stops, landmarks, and GPS geolocations across routes.
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleOpenAdd} sx={{ fontWeight: 700 }}>
          Add Bus Stop
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={paginatedData}
        loading={loading}
        searchPlaceholder="Search stops by name, landmark, route..."
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
          {editingStop ? `Edit Stop: ${editingStop.stopName}` : 'Add New Bus Stop'}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  label="Stop Name"
                  placeholder="e.g. Porur Toll Gate"
                  value={stopName}
                  onChange={(e) => setStopName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Route</InputLabel>
                  <Select
                    value={routeId}
                    label="Route"
                    onChange={(e) => setRouteId(e.target.value)}
                  >
                    {routes.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.routeName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Sequence Order"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Nearby Landmark"
                  placeholder="e.g. Opposite Signal / Petrol Bunk"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Morning Pickup Time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Evening Drop Time"
                  value={dropTime}
                  onChange={(e) => setDropTime(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Save Bus Stop</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Confirm Delete Stop"
        message="Are you sure you want to delete this bus stop record?"
        confirmColor="error"
        confirmText="Delete Stop"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
};
export default AdminStops;
