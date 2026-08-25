import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Grid, FormControl,
  InputLabel, Select, MenuItem, Paper, Chip 
} from '@mui/material';
import { Send, Campaign } from '@mui/icons-material';
import { broadcastNotification, getAllNotifications } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import type { NotificationDocument, UserRole } from '../../types';
import DataTable from '../../components/common/DataTable';
import type { Column } from '../../components/common/DataTable';
import { usePagination } from '../../hooks/usePagination';

export const AdminNotifications: React.FC = () => {
  const { profile } = useAuth();
  const { showNotification } = useNotification();

  const [notifs, setNotifs] = useState<NotificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY'>('NORMAL');
  const [targetType, setTargetType] = useState<'ALL' | 'ROLE' | 'ROUTE'>('ALL');
  const [targetRole, setTargetRole] = useState<UserRole>('student');

  useEffect(() => {
    loadNotifs();
  }, []);

  const loadNotifs = async () => {
    setLoading(true);
    try {
      const list = await getAllNotifications();
      setNotifs(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!title.trim() || !message.trim()) {
      showNotification('Please fill in title and announcement message', 'warning');
      return;
    }

    setSending(true);
    try {
      await broadcastNotification({
        title: title.trim(),
        message: message.trim(),
        priority,
        targetType,
        targetRole: targetType === 'ROLE' ? targetRole : undefined,
        createdBy: profile.fullName
      }, { id: profile.id, email: profile.email, role: profile.role });

      showNotification('Announcement broadcasted successfully to commuters!', 'success');
      setTitle('');
      setMessage('');
      loadNotifs();
    } catch (e: any) {
      showNotification('Failed to broadcast: ' + (e.message || 'Error'), 'error');
    } finally {
      setSending(false);
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
  } = usePagination<NotificationDocument>(
    notifs,
    10,
    (item, query) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.message.toLowerCase().includes(query.toLowerCase()) ||
      item.priority.toLowerCase().includes(query.toLowerCase())
  );

  const columns: Column<NotificationDocument>[] = [
    {
      id: 'createdAt',
      label: 'Sent Date & Time',
      sortable: true,
      render: (row) => new Date(row.createdAt).toLocaleString()
    },
    {
      id: 'title',
      label: 'Announcement Title',
      sortable: true,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.title}</Typography>
    },
    {
      id: 'targetType',
      label: 'Audience Target',
      render: (row) => (
        <Chip label={row.targetType === 'ROLE' ? `Role: ${row.targetRole}` : row.targetType} size="small" variant="outlined" />
      )
    },
    {
      id: 'priority',
      label: 'Priority Level',
      render: (row) => (
        <Chip 
          label={row.priority} 
          size="small" 
          color={row.priority === 'EMERGENCY' ? 'error' : row.priority === 'HIGH' ? 'warning' : 'default'} 
        />
      )
    },
    {
      id: 'createdBy',
      label: 'Author / Sender'
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Broadcast Notifications & Announcements
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Transmit push announcements, emergency weather advisories, and transit schedule updates.
        </Typography>
      </Box>

      {/* Broadcast Form */}
      <Paper sx={{ p: 3.5, mb: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Campaign color="primary" /> Transmit New Announcement
        </Typography>

        <form onSubmit={handleBroadcast}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                fullWidth
                required
                label="Notification Headline / Title"
                placeholder="e.g. Route 101 Morning Delay Notice"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priority}
                  label="Priority"
                  onChange={(e) => setPriority(e.target.value as any)}
                >
                  <MenuItem value="LOW">Low (Info)</MenuItem>
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="HIGH">High Priority</MenuItem>
                  <MenuItem value="EMERGENCY">Emergency / SOS</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Target Audience</InputLabel>
                <Select
                  value={targetType}
                  label="Target Audience"
                  onChange={(e) => setTargetType(e.target.value as any)}
                >
                  <MenuItem value="ALL">Broadcast to Everyone (All Users)</MenuItem>
                  <MenuItem value="ROLE">Specific Role Group</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {targetType === 'ROLE' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Select Role</InputLabel>
                  <Select
                    value={targetRole}
                    label="Select Role"
                    onChange={(e) => setTargetRole(e.target.value as any)}
                  >
                    <MenuItem value="student">Students Only</MenuItem>
                    <MenuItem value="conductor">Conductors Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                label="Broadcast Message Body"
                placeholder="Enter complete notification message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={sending}
                startIcon={<Send />}
                sx={{ px: 4, fontWeight: 700 }}
              >
                {sending ? 'Broadcasting...' : 'Broadcast Announcement'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Broadcast History Table */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Sent Notification Logs
      </Typography>

      <DataTable
        columns={columns}
        rows={paginatedData}
        loading={loading}
        searchPlaceholder="Search sent notifications..."
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
export default AdminNotifications;
