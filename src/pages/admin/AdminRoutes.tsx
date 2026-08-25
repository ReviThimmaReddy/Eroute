import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, IconButton,
  Paper, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import { Add, Route as RouteIcon, Delete, Edit, Place, ArrowForward } from '@mui/icons-material';
import { getRoutes, saveRoute, deleteRoute } from '../../services/busService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import type { RouteDocument, RouteStop } from '../../types';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { usePagination } from '../../hooks/usePagination';

export const AdminRoutes: React.FC = () => {
  const { profile } = useAuth();
  const { showNotification } = useNotification();
  
  const [routes, setRoutes] = useState<RouteDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteDocument | null>(null);
  const [routeName, setRouteName] = useState('');
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [distanceKm, setDistanceKm] = useState(25);
  const [durationMins, setDurationMins] = useState(45);
  const [stopsList, setStopsList] = useState<RouteStop[]>([]);

  // Temp stop adder
  const [stopName, setStopName] = useState('');
  const [stopLat, setStopLat] = useState(13.0827);
  const [stopLng, setStopLng] = useState(80.2707);
  const [pickupTime, setPickupTime] = useState('07:15 AM');
  const [dropTime, setDropTime] = useState('05:15 PM');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allRoutes = await getRoutes();
      setRoutes(allRoutes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingRoute(null);
    setRouteName('');
    setStartPoint('');
    setEndPoint('');
    setDistanceKm(25);
    setDurationMins(45);
    setStopsList([]);
    setDialogOpen(true);
  };

  const handleOpenEdit = (route: RouteDocument) => {
    setEditingRoute(route);
    setRouteName(route.routeName);
    setStartPoint(route.startPoint);
    setEndPoint(route.endPoint);
    setDistanceKm(route.totalDistanceKm);
    setDurationMins(route.estimatedDurationMins);
    setStopsList(route.stops || []);
    setDialogOpen(true);
  };

  const handleAddStopToRoute = () => {
    if (!stopName.trim()) return;
    const newStop: RouteStop = {
      stopId: `STOP-${Date.now().toString().slice(-4)}`,
      stopName: stopName.trim(),
      orderIndex: stopsList.length + 1,
      latitude: Number(stopLat),
      longitude: Number(stopLng),
      pickupTime,
      dropTime
    };
    setStopsList([...stopsList, newStop]);
    setStopName('');
  };

  const handleRemoveStop = (idx: number) => {
    const updated = stopsList.filter((_, i) => i !== idx).map((s, i) => ({ ...s, orderIndex: i + 1 }));
    setStopsList(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!routeName.trim() || !startPoint.trim() || !endPoint.trim()) {
      showNotification('Please fill all mandatory route fields', 'warning');
      return;
    }

    try {
      await saveRoute({
        id: editingRoute?.id,
        routeName: routeName.trim(),
        startPoint: startPoint.trim(),
        endPoint: endPoint.trim(),
        totalDistanceKm: Number(distanceKm),
        estimatedDurationMins: Number(durationMins),
        totalStops: stopsList.length,
        stops: stopsList,
        isActive: true,
        createdAt: editingRoute?.createdAt || Date.now(),
        updatedAt: Date.now()
      }, { id: profile.id, email: profile.email, role: profile.role });

      showNotification(`Route ${routeName} saved successfully!`, 'success');
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      showNotification('Error saving route: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !profile) return;
    try {
      await deleteRoute(deleteTarget, { id: profile.id, email: profile.email, role: profile.role });
      showNotification('Route deleted successfully!', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (_e) {
      showNotification('Failed to delete route', 'error');
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
  } = usePagination<RouteDocument>(
    routes,
    10,
    (item, query) =>
      Boolean(
        item.routeName.toLowerCase().includes(query.toLowerCase()) ||
        item.startPoint.toLowerCase().includes(query.toLowerCase()) ||
        item.endPoint.toLowerCase().includes(query.toLowerCase())
      )
  );

  const columns: Column<RouteDocument>[] = [
    {
      id: 'routeName',
      label: 'Route Name',
      sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RouteIcon color="primary" fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.routeName}</Typography>
        </Box>
      )
    },
    {
      id: 'corridor',
      label: 'Corridor (Start ➔ End)',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">{row.startPoint}</Typography>
          <ArrowForward fontSize="small" sx={{ color: 'text.secondary', fontSize: 14 }} />
          <Typography variant="body2">{row.endPoint}</Typography>
        </Box>
      )
    },
    {
      id: 'totalStops',
      label: 'Stops',
      sortable: true,
      render: (row) => `${row.totalStops || row.stops?.length || 0} Stops`
    },
    {
      id: 'totalDistanceKm',
      label: 'Distance',
      sortable: true,
      render: (row) => `${row.totalDistanceKm} km`
    },
    {
      id: 'estimatedDurationMins',
      label: 'Est. Duration',
      sortable: true,
      render: (row) => `${row.estimatedDurationMins} mins`
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
            Transit Route Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure bus transit corridors, pickup/drop waypoints, and stop sequences.
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleOpenAdd} sx={{ fontWeight: 700 }}>
          Create New Route
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={paginatedData}
        loading={loading}
        searchPlaceholder="Search routes by name or start/end point..."
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

      {/* Route Builder Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingRoute ? `Edit Route: ${editingRoute.routeName}` : 'Create Transit Route'}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  label="Route Title / Corridor (e.g. Route 101 - Central Express)"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Origin / Start Point"
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Destination / End Terminal"
                  value={endPoint}
                  onChange={(e) => setEndPoint(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Route Distance (km)"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Estimated Trip Duration (minutes)"
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                />
              </Grid>

              {/* Stop Sequencer */}
              <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Place color="primary" /> Sequenced Bus Stops ({stopsList.length})
                </Typography>

                <Paper sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}>
                  <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Stop Name"
                        placeholder="e.g. Poonamallee Junction"
                        value={stopName}
                        onChange={(e) => setStopName(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        label="Latitude"
                        value={stopLat}
                        onChange={(e) => setStopLat(Number(e.target.value))}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        label="Longitude"
                        value={stopLng}
                        onChange={(e) => setStopLng(Number(e.target.value))}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Pickup Time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 1.5 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Drop Time"
                        value={dropTime}
                        onChange={(e) => setDropTime(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 1.5 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleAddStopToRoute}
                        disabled={!stopName.trim()}
                      >
                        Add
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                <List dense sx={{ maxHeight: 200, overflowY: 'auto' }}>
                  {stopsList.map((stop, idx) => (
                    <ListItem key={stop.stopId || idx} sx={{ bgcolor: 'background.paper', mb: 0.5, borderRadius: 1 }}>
                      <ListItemText
                        primary={`${idx + 1}. ${stop.stopName}`}
                        secondary={`Coordinates: (${stop.latitude}, ${stop.longitude}) | Pickup: ${stop.pickupTime} | Drop: ${stop.dropTime}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" color="error" onClick={() => handleRemoveStop(idx)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Save Route</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Confirm Delete Route"
        message="Are you sure you want to delete this transit route? Buses and passes tied to this route may need reallocation."
        confirmColor="error"
        confirmText="Delete Route"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
};
export default AdminRoutes;
