import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, List, ListItem, ListItemText, 
  ListItemIcon, Chip, CircularProgress, Divider, Button 
} from '@mui/material';
import { Warning, Info, Campaign } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getNotificationsForUser, markNotificationRead } from '../../services/notificationService';
import type { NotificationDocument } from '../../types';

export const StudentNotifications: React.FC = () => {
  const { profile, currentUser } = useAuth();
  const [notifs, setNotifs] = useState<NotificationDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && currentUser) {
      loadNotifs();
    }
  }, [profile, currentUser]);

  const loadNotifs = async () => {
    setLoading(true);
    try {
      if (!currentUser || !profile) return;
      const data = await getNotificationsForUser(profile.role, currentUser.uid, profile.assignedRouteId || undefined);
      setNotifs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (notifId: string) => {
    if (!currentUser) return;
    await markNotificationRead(notifId, currentUser.uid);
    setNotifs(prev => prev.map(n => n.id === notifId ? { ...n, readBy: [...n.readBy, currentUser.uid] } : n));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Announcements & Alerts
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Official transport department announcements, route alerts, and schedule changes.
        </Typography>
      </Box>

      {notifs.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Campaign sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
          <Typography variant="body1" color="text.secondary">
            No active announcements at this time.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          <List disablePadding>
            {notifs.map((n, idx) => {
              const isUnread = !n.readBy.includes(currentUser?.uid || '');
              return (
                <React.Fragment key={n.id}>
                  <ListItem
                    sx={{
                      p: 3,
                      bgcolor: isUnread ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                      borderLeft: isUnread ? '4px solid #3B82F6' : '4px solid transparent',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                      {n.priority === 'EMERGENCY' || n.priority === 'HIGH' ? (
                        <Warning color="error" />
                      ) : (
                        <Info color="primary" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {n.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              label={n.priority}
                              size="small"
                              color={n.priority === 'EMERGENCY' ? 'error' : n.priority === 'HIGH' ? 'warning' : 'default'}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ color: 'text.primary', mb: 1 }}>
                            {n.message}
                          </Typography>
                          {isUnread && (
                            <Button size="small" onClick={() => handleRead(n.id)}>
                              Mark as Read
                            </Button>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {idx < notifs.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      )}
    </Box>
  );
};
export default StudentNotifications;
