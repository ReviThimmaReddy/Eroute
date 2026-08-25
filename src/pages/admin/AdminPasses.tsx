import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, Chip, Paper 
} from '@mui/material';
import { QrCode2, Download } from '@mui/icons-material';
import { getBusPasses, subscribeBusPasses, updatePassStatus, generateQRCodeDataUrl } from '../../services/passService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import type { BusPassDocument } from '../../types';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import { usePagination } from '../../hooks/usePagination';

export const AdminPasses: React.FC = () => {
  const { profile } = useAuth();
  const { showNotification } = useNotification();
  
  const [passes, setPasses] = useState<BusPassDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState<BusPassDocument | null>(null);
  const [selectedPassQrUrl, setSelectedPassQrUrl] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeBusPasses((allPasses) => {
      setPasses(allPasses);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedPass && ((selectedPass.status || '').toLowerCase() === 'issued' || (selectedPass.status || '').toLowerCase() === 'approved')) {
      const payload = selectedPass.qrPayload || JSON.stringify({
        passId: selectedPass.id,
        studentName: selectedPass.studentName,
        regNo: selectedPass.registerNumber,
        route: selectedPass.routeName,
        stop: selectedPass.stopName
      });
      generateQRCodeDataUrl(payload).then(setSelectedPassQrUrl).catch(console.warn);
    } else {
      setSelectedPassQrUrl(null);
    }
  }, [selectedPass]);

  const loadPasses = async () => {
    setLoading(true);
    try {
      const allPasses = await getBusPasses();
      setPasses(allPasses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (pass: BusPassDocument) => {
    if (!profile) return;
    setActionLoading(true);
    try {
      await updatePassStatus(pass.id, 'APPROVED', { id: profile.id, email: profile.email, role: profile.role });
      showNotification(`Pass #${pass.id} for ${pass.studentName} Approved & Issued!`, 'success');
      loadPasses();
      if (selectedPass?.id === pass.id) setSelectedPass(null);
    } catch (e: any) {
      showNotification('Failed to approve pass: ' + (e.message || 'Error'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPass || !profile) return;
    if (!rejectionReason.trim()) {
      showNotification('Please state the reason for rejecting the bus pass', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      await updatePassStatus(
        selectedPass.id, 
        'REJECTED', 
        { id: profile.id, email: profile.email, role: profile.role }, 
        rejectionReason.trim()
      );
      showNotification(`Pass #${selectedPass.id} rejected.`, 'info');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedPass(null);
      loadPasses();
    } catch (e: any) {
      showNotification('Failed to reject pass: ' + (e.message || 'Error'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Issued' | 'Rejected'>('All');

  const filteredPasses = passes.filter(p => {
    const st = (p.status || '').toLowerCase();
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Pending') return st === 'pending';
    if (statusFilter === 'Issued') return st === 'approved' || st === 'issued';
    if (statusFilter === 'Rejected') return st === 'rejected';
    return true;
  });

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
  } = usePagination<BusPassDocument>(
    filteredPasses,
    10,
    (item, query) =>
      item.studentName.toLowerCase().includes(query.toLowerCase()) ||
      item.registerNumber.toLowerCase().includes(query.toLowerCase()) ||
      item.routeName.toLowerCase().includes(query.toLowerCase()) ||
      item.status.toLowerCase().includes(query.toLowerCase()) ||
      item.id.toLowerCase().includes(query.toLowerCase())
  );

  const columns: Column<BusPassDocument>[] = [
    {
      id: 'id',
      label: 'Pass ID',
      sortable: true,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.id}</Typography>
    },
    {
      id: 'studentName',
      label: 'Applicant Name',
      sortable: true,
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.studentName}</Typography>
          <Typography variant="caption" color="text.secondary">{row.registerNumber} • {row.department}</Typography>
        </Box>
      )
    },
    {
      id: 'routeName',
      label: 'Transit Corridor & Stop',
      sortable: true,
      render: (row) => (
        <Box>
          <Typography variant="body2">{row.routeName}</Typography>
          <Typography variant="caption" color="primary.main">Stop: {row.stopName}</Typography>
        </Box>
      )
    },
    {
      id: 'passType',
      label: 'Pass Duration',
      render: (row) => (
        <Chip label={`${row.passType} (₹${row.amount})`} size="small" variant="outlined" />
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusChip status={row.status} />
    },
    {
      id: 'actions',
      label: 'Review / Actions',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedPass(row)}
          >
            Review
          </Button>
          {(row.status || '').toLowerCase() === 'pending' && (
            <>
              <Button
                size="small"
                variant="contained"
                color="success"
                disabled={actionLoading}
                onClick={() => handleApprove(row)}
              >
                Approve
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => {
                  setSelectedPass(row);
                  setRejectDialogOpen(true);
                }}
              >
                Reject
              </Button>
            </>
          )}
          {(row.status || '').toLowerCase() === 'rejected' && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              disabled={actionLoading}
              onClick={() => handleApprove(row)}
            >
              Re-Approve
            </Button>
          )}
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Bus Pass Applications & Approvals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review student pass applications, verify submitted payment references and ID proof, and issue digital passes.
          </Typography>
        </Box>

        {/* Filter Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(['All', 'Pending', 'Issued', 'Rejected'] as const).map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? 'contained' : 'outlined'}
              color={st === 'Pending' ? 'warning' : st === 'Issued' ? 'success' : st === 'Rejected' ? 'error' : 'primary'}
              size="small"
              onClick={() => setStatusFilter(st)}
            >
              {st} ({passes.filter(p => {
                const pst = (p.status || '').toLowerCase();
                if (st === 'All') return true;
                if (st === 'Pending') return pst === 'pending';
                if (st === 'Issued') return pst === 'approved' || pst === 'issued';
                if (st === 'Rejected') return pst === 'rejected';
                return true;
              }).length})
            </Button>
          ))}
        </Box>
      </Box>

      <DataTable
        columns={columns}
        rows={paginatedData}
        loading={loading}
        searchPlaceholder="Search by applicant name, register no, pass ID..."
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

      {/* Review Dialog */}
      <Dialog open={Boolean(selectedPass && !rejectDialogOpen)} onClose={() => setSelectedPass(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Pass Application #{selectedPass?.id}</span>
          {selectedPass && <StatusChip status={selectedPass.status} />}
        </DialogTitle>
        <DialogContent dividers>
          {selectedPass && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Applicant Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedPass.studentName}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Register Number</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedPass.registerNumber}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Department / College</Typography>
                <Typography variant="body2">{selectedPass.department} ({selectedPass.college})</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Contact Phone</Typography>
                <Typography variant="body2">{selectedPass.phoneNumber || 'N/A'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">From Location</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {selectedPass.fromLocation?.name || selectedPass.fromStopName || 'Origin'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">To Location</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {selectedPass.toLocation?.name || selectedPass.toStopName || 'Destination'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Google Road Distance</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {selectedPass.roadDistanceKm ? `${selectedPass.roadDistanceKm} km` : `${selectedPass.oneWayDistanceKm || 10} km`}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Est. Travel Time</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {selectedPass.estimatedTimeMins ? `~${selectedPass.estimatedTimeMins} mins` : 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Payment Ref ID</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {selectedPass.paymentRef}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Pass Duration & Total Fee</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {selectedPass.durationMonths || 1} Month(s) - ₹{selectedPass.totalFare || selectedPass.amount}
                </Typography>
              </Grid>

              {/* QR Code Section for Issued Passes */}
              {selectedPass.status === 'Issued' && selectedPassQrUrl && (
                <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                  <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#0B0F19', border: '1px solid #3B82F6', textAlign: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <QrCode2 /> Verified Student Digital Pass QR Code
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                      <img 
                        src={selectedPassQrUrl} 
                        alt="Pass QR Code" 
                        style={{ width: 170, height: 170, borderRadius: 8, background: '#fff', padding: 8 }} 
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      Scan this barcode via Conductor Camera Scanner to verify commuter boarding.
                    </Typography>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary" 
                      startIcon={<Download />}
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = selectedPassQrUrl;
                        a.download = `Pass_QR_${selectedPass.registerNumber}.png`;
                        a.click();
                      }}
                      sx={{ fontWeight: 700 }}
                    >
                      Download Pass QR Code Image
                    </Button>
                  </Paper>
                </Grid>
              )}

              {/* Document links */}
              <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Submitted Verification Documents
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {selectedPass.idProofUrl ? (
                    <Button variant="outlined" size="small" href={selectedPass.idProofUrl} target="_blank">
                      View ID Card Proof
                    </Button>
                  ) : (
                    <Typography variant="caption" color="text.secondary">No ID file attached</Typography>
                  )}

                  {selectedPass.feeReceiptUrl ? (
                    <Button variant="outlined" size="small" href={selectedPass.feeReceiptUrl} target="_blank">
                      View Payment Fee Receipt
                    </Button>
                  ) : (
                    <Typography variant="caption" color="text.secondary">No receipt file attached</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setSelectedPass(null)} color="inherit">Close</Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedPass?.status !== 'Rejected' && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setRejectDialogOpen(true)}
              >
                Reject Application
              </Button>
            )}
            {selectedPass?.status !== 'Issued' && (
              <Button
                variant="contained"
                color="success"
                disabled={actionLoading}
                onClick={() => selectedPass && handleApprove(selectedPass)}
              >
                Approve & Issue Pass
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Reject Pass Application</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            required
            multiline
            rows={3}
            label="Reason for Rejection"
            placeholder="e.g. Payment receipt transaction number mismatch."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleReject} variant="contained" color="error">Confirm Rejection</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default AdminPasses;
