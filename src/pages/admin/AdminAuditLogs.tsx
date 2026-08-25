import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { fetchAuditLogs } from '../../services/auditService';
import type { AuditLogDocument } from '../../types';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { usePagination } from '../../hooks/usePagination';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const allLogs = await fetchAuditLogs(150);
      setLogs(allLogs);
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
  } = usePagination<AuditLogDocument>(
    logs,
    10,
    (item, query) =>
      Boolean(
        item.action.toLowerCase().includes(query.toLowerCase()) ||
        (item.actorEmail && item.actorEmail.toLowerCase().includes(query.toLowerCase())) ||
        (item.targetCollection && item.targetCollection.toLowerCase().includes(query.toLowerCase())) ||
        (item.targetDocId && item.targetDocId.toLowerCase().includes(query.toLowerCase())) ||
        (item.userEmail && item.userEmail.toLowerCase().includes(query.toLowerCase())) ||
        (item.resource && item.resource.toLowerCase().includes(query.toLowerCase()))
      )
  );

  const columns: Column<AuditLogDocument>[] = [
    {
      id: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (row) => new Date(row.timestamp).toLocaleString()
    },
    {
      id: 'action',
      label: 'Action Event',
      sortable: true,
      render: (row) => (
        <Chip 
          label={row.action.replace(/_/g, ' ')} 
          size="small" 
          color="primary" 
          variant="outlined" 
          sx={{ fontWeight: 700 }} 
        />
      )
    },
    {
      id: 'actorEmail',
      label: 'Actor (User)',
      sortable: true,
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.actorEmail}</Typography>
          <Typography variant="caption" color="text.secondary">Role: {row.actorRole}</Typography>
        </Box>
      )
    },
    {
      id: 'targetCollection',
      label: 'Collection',
      sortable: true
    },
    {
      id: 'targetDocId',
      label: 'Document ID'
    },
    {
      id: 'details',
      label: 'Payload Details',
      render: (row) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
          {JSON.stringify(row.details || {})}
        </Typography>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          System Activity & Audit Trails
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Immutable event log tracking administrative operations, pass status alterations, trip dispatches, and emergency alerts.
        </Typography>
      </Box>

      <DataTable
        columns={columns}
        rows={paginatedData}
        loading={loading}
        searchPlaceholder="Search audit logs by actor, action, collection..."
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
export default AdminAuditLogs;
