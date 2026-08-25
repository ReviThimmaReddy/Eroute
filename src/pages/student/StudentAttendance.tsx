import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { getStudentAttendanceHistory } from '../../services/attendanceService';
import type { AttendanceLogDocument } from '../../types';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import { usePagination } from '../../hooks/usePagination';

export const StudentAttendance: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<AttendanceLogDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadLogs();
    }
  }, [currentUser]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      if (!currentUser) return;
      const data = await getStudentAttendanceHistory(currentUser.uid);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
  } = usePagination<AttendanceLogDocument>(
    logs,
    10,
    (item, query) => 
      item.busNumber.toLowerCase().includes(query.toLowerCase()) ||
      item.stopName.toLowerCase().includes(query.toLowerCase()) ||
      item.scanMethod.toLowerCase().includes(query.toLowerCase())
  );

  const columns: Column<AttendanceLogDocument>[] = [
    {
      id: 'scanTimestamp',
      label: 'Date & Time',
      sortable: true,
      render: (row) => new Date(row.scanTimestamp).toLocaleString()
    },
    {
      id: 'busNumber',
      label: 'Bus Vehicle',
      sortable: true,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.busNumber}</Typography>
    },
    {
      id: 'stopName',
      label: 'Boarded Stop',
      sortable: true
    },
    {
      id: 'scanMethod',
      label: 'Verification Method',
      render: (row) => (
        <Chip 
          label={row.scanMethod.replace('_', ' ')} 
          size="small" 
          variant="outlined" 
          color={row.scanMethod === 'QR_SCAN' ? 'primary' : 'default'} 
        />
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          My Boarding & Attendance History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Complete log of your transit bus boardings verified by conductors.
        </Typography>
      </Box>

      <DataTable
        columns={columns}
        rows={paginatedData}
        loading={loading}
        searchPlaceholder="Search by bus number or stop..."
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
export default StudentAttendance;
