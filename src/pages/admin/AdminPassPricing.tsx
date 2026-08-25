import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, Chip, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, 
  FormControl, InputLabel, Select, CircularProgress, Card, CardContent 
} from '@mui/material';
import { Add, Edit, CheckCircle, Route as RouteIcon } from '@mui/icons-material';
import { getRoutes } from '../../services/busService';
import { getAllPassPricing, savePassPricing, calculatePricingBreakdown } from '../../services/pricingService';
import { useNotification } from '../../context/NotificationContext';
import type { RouteDocument, PassPricingDocument } from '../../types';

export const AdminPassPricing: React.FC = () => {
  const { showNotification } = useNotification();
  const [pricingList, setPricingList] = useState<PassPricingDocument[]>([]);
  const [routes, setRoutes] = useState<RouteDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [fromStopName, setFromStopName] = useState('Chettipedu');
  const [fromStopId, setFromStopId] = useState('STOP-CHETTIPEDU');
  const [toStopName, setToStopName] = useState('Poonamallee');
  const [toStopId, setToStopId] = useState('STOP-4');
  const [oneWayDistanceKm, setOneWayDistanceKm] = useState<number>(10);
  const [normalFarePerKm, setNormalFarePerKm] = useState<number>(1);
  const [monthlyPassPrice, setMonthlyPassPrice] = useState<number>(480);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pricingData, routesData] = await Promise.all([
        getAllPassPricing(),
        getRoutes()
      ]);
      setPricingList(pricingData);
      setRoutes(routesData);
      if (routesData.length > 0 && !selectedRouteId) {
        setSelectedRouteId(routesData[0].id);
      }
    } catch (e: any) {
      console.error(e);
      showNotification('Error loading pricing configurations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditId(null);
    setFromStopName('Chettipedu');
    setFromStopId('STOP-CHETTIPEDU');
    setToStopName('Poonamallee');
    setToStopId('STOP-4');
    setOneWayDistanceKm(10);
    setNormalFarePerKm(1);
    setMonthlyPassPrice(480);
    setStatus('Active');
    setOpenDialog(true);
  };

  const handleOpenEdit = (p: PassPricingDocument) => {
    setEditId(p.id);
    setSelectedRouteId(p.routeId || '');
    setFromStopId(p.fromStopId || '');
    setFromStopName(p.fromStopName || '');
    setToStopId(p.toStopId || '');
    setToStopName(p.toStopName || '');
    setOneWayDistanceKm(p.oneWayDistanceKm || 0);
    setNormalFarePerKm(p.normalFarePerKm || 1);
    setMonthlyPassPrice(p.monthlyPassPrice || 0);
    setStatus((p.status as any) || 'Active');
    setOpenDialog(true);
  };

  const calculated = calculatePricingBreakdown(
    Number(oneWayDistanceKm) || 0,
    Number(normalFarePerKm) || 1,
    Number(monthlyPassPrice) || 0,
    1
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteId) {
      showNotification('Please select a route', 'warning');
      return;
    }
    if (!fromStopName.trim() || !toStopName.trim()) {
      showNotification('Please provide valid From and To stop names', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const selectedRoute = routes.find(r => r.id === selectedRouteId);
      await savePassPricing({
        id: editId || undefined,
        routeId: selectedRouteId,
        routeName: selectedRoute ? selectedRoute.routeName : 'Route',
        fromStopId: fromStopId || `STOP_${fromStopName.replace(/\s+/g, '_').toUpperCase()}`,
        fromStopName: fromStopName.trim(),
        toStopId: toStopId || `STOP_${toStopName.replace(/\s+/g, '_').toUpperCase()}`,
        toStopName: toStopName.trim(),
        oneWayDistanceKm: Number(oneWayDistanceKm),
        normalFarePerKm: Number(normalFarePerKm),
        monthlyPassPrice: Number(monthlyPassPrice),
        currency: '₹',
        status
      });

      showNotification('Pass pricing rule saved successfully!', 'success');
      setOpenDialog(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      showNotification('Failed to save pricing configuration: ' + (err.message || err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Bus Pass Pricing & Fare Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure stop-to-stop distances, round-trip fares, and student monthly pass discounts stored in Firestore.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleOpenNew}
          sx={{ fontWeight: 700, py: 1.2, px: 3 }}
        >
          Add Route Pricing Rule
        </Button>
      </Box>

      {/* Live Active Example Highlight Card */}
      <Card sx={{ mb: 4, bgcolor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <RouteIcon /> Active Dynamic Fare Calculation Formula
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Round Trip / Day</strong> = One-Way Distance × 2 &nbsp;|&nbsp; <strong>Estimated Monthly Distance</strong> = Round Trip × 30 days &nbsp;|&nbsp; <strong>Normal Monthly Fare</strong> = Monthly Km × Normal Rate/km &nbsp;|&nbsp; <strong>Student Discount</strong> = Normal Fare − Monthly Pass Price.
          </Typography>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Route / Segment</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>One-Way</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Round Trip / Day</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Monthly Distance</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Normal Monthly Fare</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Student Pass Price</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Student Savings</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pricingList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No bus pass pricing configurations found. Click "Add Route Pricing Rule" above to create one.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pricingList.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {p.fromStopName} ➔ {p.toStopName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.routeName || p.routeId}
                      </Typography>
                    </TableCell>
                    <TableCell>{p.oneWayDistanceKm || 0} km</TableCell>
                    <TableCell>{p.roundTripDistanceKm || (p.oneWayDistanceKm || 0) * 2} km/day</TableCell>
                    <TableCell>{p.monthlyDistanceKm || (p.oneWayDistanceKm || 0) * 60} km</TableCell>
                    <TableCell>₹{p.normalMonthlyFare || 0}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>
                      ₹{p.monthlyPassPrice} / mo
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                      ₹{p.discountAmount}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={p.status} 
                        color={p.status === 'Active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleOpenEdit(p)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add / Edit Pricing Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editId ? 'Edit Bus Pass Pricing Rule' : 'Configure New Bus Pass Pricing Rule'}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth required>
                  <InputLabel>Target Route</InputLabel>
                  <Select
                    value={selectedRouteId}
                    label="Target Route"
                    onChange={(e) => setSelectedRouteId(e.target.value)}
                  >
                    {routes.map(r => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.routeName} ({r.startPoint} ➔ {r.endPoint})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="From Stop Name"
                  value={fromStopName}
                  onChange={(e) => setFromStopName(e.target.value)}
                  placeholder="e.g. Chettipedu"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="To Stop Name"
                  value={toStopName}
                  onChange={(e) => setToStopName(e.target.value)}
                  placeholder="e.g. Poonamallee"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="One-Way Distance (km)"
                  value={oneWayDistanceKm}
                  onChange={(e) => setOneWayDistanceKm(Number(e.target.value))}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Normal Rate (₹/km)"
                  value={normalFarePerKm}
                  onChange={(e) => setNormalFarePerKm(Number(e.target.value))}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Student Monthly Pass Price (₹)"
                  value={monthlyPassPrice}
                  onChange={(e) => setMonthlyPassPrice(Number(e.target.value))}
                  helperText="Configured monthly pass price"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Pricing Status</InputLabel>
                  <Select
                    value={status}
                    label="Pricing Status"
                    onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Dynamic Calculation Live Breakdown Box */}
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Automatic Breakdown Calculation Preview:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" color="text.secondary">Round Trip / Day</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{calculated.roundTripDistanceKm} km/day</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" color="text.secondary">Est. Monthly Distance</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{calculated.monthlyDistanceKm} km/mo</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" color="text.secondary">Normal Monthly Fare</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>₹{calculated.normalMonthlyFare}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" color="text.secondary">Student Savings</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: 'success.main' }}>₹{calculated.discountAmount}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
            >
              {submitting ? 'Saving...' : 'Save Pricing Rule'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AdminPassPricing;
