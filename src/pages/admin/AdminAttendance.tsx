import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, FormControl, InputLabel, 
  Select, MenuItem, Grid, Paper 
} from '@mui/material';
import { SaveAlt } from '@mui/icons-material';
import { getAllAttendanceLogs } from '../../services/attendanceService';
import { getBuses, getRoutes } from '../../services/busService';
import { exportToExcel, exportToPDF } from '../../services/exportService';
import type { AttendanceLogDocument, BusDocument, RouteDocument } from '../../types';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import { usePagination } from '../../hooks/usePagination';

export const AdminAttendance: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceLogDocument[]>([]);
  const [buses, setBuses] = useState<BusDocument[]>([]);
  const [routes, setRoutes] = useState<RouteDocument[]>([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allLogs, allBuses, allRoutes] = await Promise.all([
        getAllAttendanceLogs(),
        getBuses(),
        getRoutes()
      ]);
      setLogs(allLogs);
      setBuses(allBuses);
      setRoutes(allRoutes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    if (selectedBusId && l.busId !== selectedBusId) return false;
    if (selectedRouteId && l.routeId !== selectedRouteId) return false;
    return true;
  });

  const handleExportExcel = () => {
    const exportData = filteredLogs.map(l => ({
      'Date & Time': new Date(l.scanTimestamp).toLocaleString(),
      'Student Name': l.studentName,
      'Register No': l.registerNumber,
      'Bus Plate': l.busNumber,
      'Boarding Stop': l.stopName,
      'Scan Method': l.scanMethod,
      'Status': l.status
    }));
    exportToExcel(exportData, 'Attendance_Roster');
  };

  const handleExportPDF = () => {
    const headers = ['Timestamp', 'Student Name', 'Register No', 'Bus', 'Stop', 'Status'];
    const rows = filteredLogs.map(l => [
      new Date(l.scanTimestamp).toLocaleDateString(),
      l.studentName,
      l.registerNumber,
      l.busNumber,
      l.stopName,
      l.status
    ]);
    exportToPDF('Campus Transit Attendance Log', headers, rows, 'Attendance_Report');
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
  } = usePagination<AttendanceLogDocument>(
    filteredLogs,
    10,
    (item, query) =>
      Boolean(
        item.studentName.toLowerCase().includes(query.toLowerCase()) ||
        item.registerNumber.toLowerCase().includes(query.toLowerCase()) ||
        item.busNumber.toLowerCase().includes(query.toLowerCase()) ||
        item.stopName.toLowerCase().includes(query.toLowerCase())
      )
  );

  const columns: Column<AttendanceLogDocument>[] = [
    {
      id: 'scanTimestamp',
      label: 'Date & Time',
      sortable: true,
      render: (row) => new Date(row.scanTimestamp).toLocaleString()
    },
    {
      id: 'studentName',
      label: 'Student Name',
      sortable: true,
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.studentName}</Typography>
          <Typography variant="caption" color="text.secondary">{row.registerNumber}</Typography>
        </Box>
      )
    },
    {
      id: 'busNumber',
      label: 'Bus Vehicle',
      sortable: true
    },
    {
      id: 'stopName',
      label: 'Boarded Stop',
      sortable: true
    },
    {
      id: 'scanMethod',
      label: 'Method',
      render: (row) => (
        <StatusChip status={row.scanMethod} />
      )
    },
    {
      id: 'status',
      label: 'Attendance Status',
      render: (row) => <StatusChip status={row.status} />
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Attendance & Ridership Monitoring
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Verified student passenger check-ins, trip logs, and boarding rosters.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<SaveAlt />} onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button variant="contained" color="primary" startIcon={<SaveAlt />} onClick={handleExportPDF}>
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* Filters Header */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Bus</InputLabel>
              <Select
                value={selectedBusId}
                label="Filter by Bus"
                onChange={(e) => setSelectedBusId(e.target.value)}
              >
                <MenuItem value="">-- All Fleet Buses --</MenuItem>
                {buses.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.busNumber} ({b.assignedRouteName})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Route</InputLabel>
              <Select
                value={selectedRouteId}
                label="Filter by Route"
                onChange={(e) => setSelectedRouteId(e.target.value)}
              >
                <MenuItem value="">-- All Transit Routes --</MenuItem>
                {routes.map((r) => (
                  <MenuItem key={r.id} value={r.id}>{r.routeName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: { sm: 'right' } }}>
              Total Filtered Boardings: <strong>{filteredLogs.length}</strong>
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <DataTable
        columns={columns}
        rows={paginatedData}
        loading={loading}
        searchPlaceholder="Search passenger name, register no, bus..."
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
    </Box>
  );
};
export default AdminAttendance;
