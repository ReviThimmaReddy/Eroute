import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { getTripHistory } from '../../services/telemetryService';
import type { TripDocument } from '../../types';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import { usePagination } from '../../hooks/usePagination';

export const StudentTripHistory: React.FC = () => {
  const [trips, setTrips] = useState<TripDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const data = await getTripHistory();
      setTrips(data);
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
  } = usePagination<TripDocument>(
    trips,
    10,
    (item, query) => 
      Boolean(
        item.routeName.toLowerCase().includes(query.toLowerCase()) ||
        item.busNumber.toLowerCase().includes(query.toLowerCase()) ||
        (item.conductorName && item.conductorName.toLowerCase().includes(query.toLowerCase()))
      )
  );

  const columns: Column<TripDocument>[] = [
    {
      id: 'startTime',
      label: 'Departure Time',
      sortable: true,
      render: (row) => new Date(row.startTime).toLocaleString()
    },
    {
      id: 'routeName',
      label: 'Route Name',
      sortable: true,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.routeName}</Typography>
    },
    {
      id: 'busNumber',
      label: 'Bus Vehicle',
      sortable: true
    },
    {
      id: 'conductorName',
      label: 'Conductor in Charge',
      render: (row) => row.conductorName || 'Campus Staff'
    },
    {
      id: 'tripType',
      label: 'Shift Type'
    },
    {
      id: 'status',
      label: 'Trip Status',
      render: (row) => <StatusChip status={row.status} />
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Transit Trips & Schedules
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Completed and scheduled campus transportation trips.
        </Typography>
      </Box>

      <DataTable
        columns={columns}
        rows={paginatedData}
        loading={loading}
        searchPlaceholder="Search trips by route or bus..."
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
export default StudentTripHistory;
