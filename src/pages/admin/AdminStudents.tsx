import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, Grid, Avatar 
} from '@mui/material';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { UserProfile } from '../../types';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import { usePagination } from '../../hooks/usePagination';
import { useNotification } from '../../context/NotificationContext';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      setStudents(allUsers.filter(u => u.role === 'student'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (student: UserProfile) => {
    const nextStatus = student.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await updateDoc(doc(db, 'users', student.id), {
        status: nextStatus,
        updatedAt: Date.now()
      });
      showNotification(`Student status updated to ${nextStatus}`, 'success');
      loadStudents();
    } catch (e) {
      showNotification('Failed to update student status', 'error');
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
    students,
    10,
    (item, query) =>
      item.fullName.toLowerCase().includes(query.toLowerCase()) ||
      (item.registerNumber && item.registerNumber.toLowerCase().includes(query.toLowerCase())) ||
      (item.department && item.department.toLowerCase().includes(query.toLowerCase())) ||
      item.email.toLowerCase().includes(query.toLowerCase())
  );

  const columns: Column<UserProfile>[] = [
    {
      id: 'fullName',
      label: 'Student Name',
      sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={row.photoUrl || undefined} sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
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
      id: 'registerNumber',
      label: 'Register No.',
      sortable: true,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.registerNumber || 'N/A'}</Typography>
    },
    {
      id: 'department',
      label: 'Department',
      sortable: true,
      render: (row) => row.department || 'General'
    },
    {
      id: 'phoneNumber',
      label: 'Phone Number'
    },
    {
      id: 'status',
      label: 'Account Status',
      render: (row) => <StatusChip status={row.status} />
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedStudent(row);
              setEditOpen(true);
            }}
          >
            Details
          </Button>
          <Button
            size="small"
            variant="outlined"
            color={row.status === 'Active' ? 'error' : 'success'}
            onClick={() => handleStatusToggle(row)}
          >
            {row.status === 'Active' ? 'Suspend' : 'Activate'}
          </Button>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Student Commuters Directory
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage registered students, view academic profiles, transit allocations, and account permissions.
        </Typography>
      </Box>

      <DataTable
        columns={columns}
        rows={paginatedData}
        loading={loading}
        searchPlaceholder="Search by name, register number, department..."
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

      {/* Student Details Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Student Profile Details</DialogTitle>
        <DialogContent dividers>
          {selectedStudent && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }} sx={{ textAlign: 'center', mb: 1 }}>
                <Avatar 
                  src={selectedStudent.photoUrl || undefined} 
                  sx={{ width: 72, height: 72, mx: 'auto', bgcolor: 'primary.main', mb: 1 }}
                >
                  {selectedStudent.fullName.substring(0, 2).toUpperCase()}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedStudent.fullName}</Typography>
                <Typography variant="caption" color="text.secondary">{selectedStudent.email}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Register Number</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedStudent.registerNumber || 'N/A'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Department</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedStudent.department || 'N/A'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">College</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedStudent.college || 'Saveetha Engineering'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedStudent.phoneNumber}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Assigned Route</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedStudent.assignedRouteId || 'Unassigned'}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}><StatusChip status={selectedStudent.status} /></Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default AdminStudents;
