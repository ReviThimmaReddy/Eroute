import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, 
  Button, FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';
import { TableChart, PictureAsPdf } from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { exportToExcel, exportToPDF } from '../../services/exportService';
import { useNotification } from '../../context/NotificationContext';

export const AdminReports: React.FC = () => {
  const { showNotification } = useNotification();
  const [reportType, setReportType] = useState('attendance');
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async (format: 'excel' | 'pdf') => {
    setLoading(true);
    try {
      if (reportType === 'attendance') {
        const snap = await getDocs(collection(db, 'attendanceLogs'));
        const logs = snap.docs.map(d => d.data());

        if (format === 'excel') {
          const rows = logs.map(l => ({
            'Timestamp': new Date(l.scanTimestamp).toLocaleString(),
            'Student Name': l.studentName,
            'Register Number': l.registerNumber,
            'Bus Vehicle': l.busNumber,
            'Boarding Stop': l.stopName,
            'Verification Method': l.scanMethod,
            'Status': l.status
          }));
          exportToExcel(rows, 'Attendance_Ridership_Master');
        } else {
          const headers = ['Timestamp', 'Student Name', 'Register No', 'Bus', 'Stop', 'Status'];
          const rows = logs.map(l => [
            new Date(l.scanTimestamp).toLocaleDateString(),
            l.studentName,
            l.registerNumber,
            l.busNumber,
            l.stopName,
            l.status
          ]);
          exportToPDF('Transit Attendance & Boarding Audit', headers, rows, 'Attendance_Report');
        }
      } else if (reportType === 'passes') {
        const snap = await getDocs(collection(db, 'busPasses'));
        const passes = snap.docs.map(d => d.data());

        if (format === 'excel') {
          const rows = passes.map(p => ({
            'Pass ID': p.id,
            'Student Name': p.studentName,
            'Register No': p.registerNumber,
            'Department': p.department,
            'Route': p.routeName,
            'Boarding Stop': p.stopName,
            'Pass Type': p.passType,
            'Amount Paid': p.amount,
            'Payment Ref': p.paymentRef,
            'Status': p.status,
            'Valid Until': new Date(p.validUntil).toLocaleDateString()
          }));
          exportToExcel(rows, 'Bus_Passes_Master');
        } else {
          const headers = ['Pass ID', 'Student', 'Register No', 'Route', 'Duration', 'Status'];
          const rows = passes.map(p => [
            p.id,
            p.studentName,
            p.registerNumber,
            p.routeName,
            p.passType,
            p.status
          ]);
          exportToPDF('Transit Passes Registry Report', headers, rows, 'Bus_Passes_Report');
        }
      } else if (reportType === 'fleet') {
        const snap = await getDocs(collection(db, 'buses'));
        const buses = snap.docs.map(d => d.data());

        if (format === 'excel') {
          const rows = buses.map(b => ({
            'Bus Plate': b.busNumber,
            'Identifier': b.busName,
            'Route': b.assignedRouteName,
            'Capacity': b.capacity,
            'Conductor': b.conductorName || 'Unassigned',
            'Status': b.status
          }));
          exportToExcel(rows, 'Fleet_Inventory_Master');
        } else {
          const headers = ['Bus Plate', 'Identifier', 'Route', 'Capacity', 'Conductor', 'Status'];
          const rows = buses.map(b => [
            b.busNumber,
            b.busName,
            b.assignedRouteName,
            b.capacity,
            b.conductorName || 'Unassigned',
            b.status
          ]);
          exportToPDF('Campus Transit Fleet Inventory', headers, rows, 'Fleet_Inventory');
        }
      } else if (reportType === 'students') {
        const snap = await getDocs(collection(db, 'users'));
        const students = snap.docs.map(d => d.data()).filter(u => u.role === 'student');

        if (format === 'excel') {
          const rows = students.map(s => ({
            'Student Name': s.fullName,
            'Register No': s.registerNumber || 'N/A',
            'Email': s.email,
            'Phone': s.phoneNumber,
            'Department': s.department || 'N/A',
            'Route': s.assignedRouteId || 'Unassigned',
            'Status': s.status
          }));
          exportToExcel(rows, 'Students_Transit_Master');
        } else {
          const headers = ['Student Name', 'Register No', 'Email', 'Phone', 'Department', 'Status'];
          const rows = students.map(s => [
            s.fullName,
            s.registerNumber || 'N/A',
            s.email,
            s.phoneNumber,
            s.department || 'N/A',
            s.status
          ]);
          exportToPDF('Student Commuters Roster', headers, rows, 'Student_Commuters');
        }
      }

      showNotification(`Report exported successfully as ${format.toUpperCase()}!`, 'success');
    } catch (e: any) {
      console.error(e);
      showNotification('Failed to generate report: ' + (e.message || 'Error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Reports & Export Center
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate production-ready compliance reports and data sheets in PDF and Microsoft Excel formats.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Select Data Category & Format
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Dataset Report Category</InputLabel>
              <Select
                value={reportType}
                label="Dataset Report Category"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="attendance">Daily & Monthly Attendance Ridership Logs</MenuItem>
                <MenuItem value="passes">Bus Pass Applications, Payments & Issued Passes</MenuItem>
                <MenuItem value="fleet">Fleet Vehicles, Capacity & Crew Allocations</MenuItem>
                <MenuItem value="students">Registered Student Commuters Master List</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<TableChart color="success" />}
                  onClick={() => handleGenerateReport('excel')}
                  disabled={loading}
                  sx={{ py: 1.5, fontWeight: 700 }}
                >
                  Export Excel (.xlsx)
                </Button>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<PictureAsPdf />}
                  onClick={() => handleGenerateReport('pdf')}
                  disabled={loading}
                  sx={{ py: 1.5, fontWeight: 700 }}
                >
                  Export PDF (.pdf)
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 4, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Supported Data Modules
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              All exported files are formatted with standard metadata, timestamps, and column auto-adjustments for administrative audits and university reporting.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Attendance & Boarding Logs</Typography>
                <Typography variant="caption" color="text.secondary">Includes scan timestamp, student details, conductor ID, and route stops.</Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Pass Application Registry</Typography>
                <Typography variant="caption" color="text.secondary">Includes fees collected, UPI transaction references, and approval dates.</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
export default AdminReports;
