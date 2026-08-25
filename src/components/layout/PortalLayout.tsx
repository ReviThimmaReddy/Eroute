import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, 
  ListItemButton, ListItemIcon, ListItemText, Avatar, useTheme, Button,
  Badge, Menu, MenuItem, Tooltip, BottomNavigation, BottomNavigationAction, Paper
} from '@mui/material';
import { 
  Menu as MenuIcon, Dashboard as DashIcon, People as PeopleIcon, 
  DirectionsBus as BusIcon, Route as RouteIcon, Map as MapIcon, 
  Badge as BadgeIcon, Assignment as LogIcon, RateReview as FeedbackIcon, 
  Person as PersonIcon, ExitToApp as LogoutIcon, Brightness4, Brightness7,
  Notifications as NotifIcon, Warning as WarningIcon,
  Description as ReportIcon, Security as AuditIcon, Settings as SettingsIcon,
  Checklist as ManifestIcon, QrCodeScanner as ScanIcon, MoreHoriz as MoreIcon,
  ConfirmationNumber as PassIcon, History as TripsIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useThemeToggle } from '../../context/ThemeContext';
import SOSModal from './SOSModal';
import { getNotificationsForUser } from '../../services/notificationService';
import type { NotificationDocument } from '../../types';

const drawerWidth = 260;

export const PortalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, logout, currentUser } = useAuth();
  const { darkMode, toggleTheme } = useThemeToggle();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationDocument[]>([]);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const refreshNotifs = () => {
    if (profile && currentUser) {
      getNotificationsForUser(profile.role, currentUser.uid, profile.assignedRouteId || undefined)
        .then(setNotifs)
        .catch(console.error);
    }
  };

  useEffect(() => {
    refreshNotifs();
    const interval = setInterval(refreshNotifs, 8000);
    return () => clearInterval(interval);
  }, [profile, currentUser, location.pathname]);

  const unreadCount = notifs.filter(n => !n.readBy.includes(currentUser?.uid || '')).length;

  const getMenuOptions = () => {
    const role = profile?.role || 'student';
    if (role === 'admin') {
      return [
        { text: 'Dashboard & Analytics', icon: <DashIcon />, path: '/admin/dashboard' },
        { text: 'Students Directory', icon: <PeopleIcon />, path: '/admin/students' },
        { text: 'Fleet & Buses', icon: <BusIcon />, path: '/admin/buses' },
        { text: 'Route Master', icon: <RouteIcon />, path: '/admin/routes' },
        { text: 'Bus Stops', icon: <MapIcon />, path: '/admin/stops' },
        { text: 'Conductors Roster', icon: <BadgeIcon />, path: '/admin/staff' },
        { text: 'Bus Pass Approval', icon: <LogIcon />, path: '/admin/passes' },
        { text: 'Pass Fare Pricing', icon: <ReportIcon />, path: '/admin/pricing' },
        { text: 'Attendance Roster', icon: <ManifestIcon />, path: '/admin/attendance' },
        { text: 'Reports & Export', icon: <ReportIcon />, path: '/admin/reports' },
        { text: 'Notifications Broadcast', icon: <NotifIcon />, path: '/admin/notifications' },
        { text: 'Audit Logs', icon: <AuditIcon />, path: '/admin/audit' },
        { text: 'System Settings', icon: <SettingsIcon />, path: '/admin/settings' },
      ];
    } else if (role === 'student') {
      return [
        { text: 'Dashboard', icon: <DashIcon />, path: '/student/dashboard' },
        { text: 'Apply / Renew Pass', icon: <LogIcon />, path: '/student/pass' },
        { text: 'Attendance History', icon: <ManifestIcon />, path: '/student/attendance' },
        { text: 'Trip Schedule', icon: <RouteIcon />, path: '/student/trips' },
        { text: 'Announcements', icon: <NotifIcon />, path: '/student/notifications' },
        { text: 'Submit Feedback', icon: <FeedbackIcon />, path: '/student/feedback' },
        { text: 'My Profile', icon: <PersonIcon />, path: '/student/profile' },
      ];
    } else {
      return [
        { text: 'Conductor Terminal', icon: <DashIcon />, path: '/conductor/dashboard' },
        { text: 'QR Camera Scanner', icon: <ScanIcon />, path: '/conductor/dashboard?tab=1' },
        { text: 'Passenger Roster', icon: <ManifestIcon />, path: '/conductor/dashboard?tab=2' },
        { text: 'Manual Check-In', icon: <LogIcon />, path: '/conductor/dashboard?tab=3' },
        { text: 'Trip Summary', icon: <ReportIcon />, path: '/conductor/dashboard?tab=4' },
        { text: 'Attendance Logs', icon: <RouteIcon />, path: '/conductor/dashboard?tab=5' },
        { text: 'Conductor Profile', icon: <PersonIcon />, path: '/conductor/dashboard?tab=6' },
      ];
    }
  };

  const getBottomNavItems = () => {
    const role = profile?.role || 'student';
    if (role === 'admin') {
      return [
        { label: 'Dash', icon: <DashIcon />, path: '/admin/dashboard' },
        { label: 'Students', icon: <PeopleIcon />, path: '/admin/students' },
        { label: 'Passes', icon: <PassIcon />, path: '/admin/passes' },
        { label: 'Fleet', icon: <BusIcon />, path: '/admin/buses' },
        { label: 'More', icon: <MoreIcon />, path: 'more' },
      ];
    } else if (role === 'student') {
      return [
        { label: 'Home', icon: <DashIcon />, path: '/student/dashboard' },
        { label: 'Pass', icon: <PassIcon />, path: '/student/pass' },
        { label: 'Trips', icon: <TripsIcon />, path: '/student/trips' },
        { label: 'Attendance', icon: <ManifestIcon />, path: '/student/attendance' },
        { label: 'More', icon: <MoreIcon />, path: 'more' },
      ];
    } else {
      return [
        { label: 'Terminal', icon: <DashIcon />, path: '/conductor/dashboard' },
        { label: 'Scanner', icon: <ScanIcon />, path: '/conductor/dashboard?tab=1' },
        { label: 'Roster', icon: <ManifestIcon />, path: '/conductor/dashboard?tab=2' },
        { label: 'Trips', icon: <ReportIcon />, path: '/conductor/dashboard?tab=4' },
        { label: 'More', icon: <MoreIcon />, path: 'more' },
      ];
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentFullPath = location.pathname + location.search;

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 2, display: 'flex' }}>
          <BusIcon sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: 0.5, lineHeight: 1.1 }}>
            eRoute
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            STUDENT MOBILITY
          </Typography>
        </Box>
      </Toolbar>
      
      <Divider />
      
      {/* Profile Card in Drawer */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'action.hover', mx: 1.5, my: 1.5, borderRadius: 2 }}>
        <Avatar 
          src={profile?.photoUrl || undefined} 
          sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontWeight: 700 }}
        >
          {profile?.fullName?.substring(0, 2).toUpperCase() || 'US'}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
            {profile?.fullName}
          </Typography>
          <Typography variant="caption" sx={{ textTransform: 'capitalize', color: 'primary.main', fontWeight: 600, display: 'block' }}>
            {profile?.role} Portal
          </Typography>
        </Box>
      </Box>

      <Divider />

      <List sx={{ flexGrow: 1, px: 1, overflowY: 'auto' }}>
        {getMenuOptions().map((item) => {
          const active = currentFullPath === item.path || (!item.path.includes('?') && location.pathname === item.path && !location.search);
          return (
            <ListItemButton 
              key={item.text} 
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              selected={active}
              sx={{
                borderRadius: '8px',
                mb: 0.5,
                bgcolor: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: active ? 'primary.main' : 'text.primary',
                '&.Mui-selected': {
                  bgcolor: 'rgba(59, 130, 246, 0.15)',
                  borderLeft: '4px solid #3B82F6',
                },
                '&:hover': {
                  bgcolor: active ? 'rgba(59, 130, 246, 0.2)' : 'action.hover',
                }
              }}
            >
              <ListItemIcon sx={{ color: active ? 'primary.main' : 'text.secondary', minWidth: 38 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={<Typography sx={{ fontSize: 13.5, fontWeight: active ? 700 : 500 }}>{item.text}</Typography>} 
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
          color="error"
          startIcon={<WarningIcon />}
          onClick={() => {
            setSosOpen(true);
            setMobileOpen(false);
          }}
          sx={{ fontWeight: 800 }}
        >
          Emergency SOS
        </Button>
        <Button 
          fullWidth 
          variant="outlined" 
          color="inherit" 
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ fontWeight: 600 }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  const bottomNavItems = getBottomNavItems();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', width: '100%', overflowX: 'hidden' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ fontWeight: 800, letterSpacing: -0.5, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {profile?.role === 'admin' ? 'Admin Directorate' : 
               profile?.role === 'conductor' ? 'Conductor Terminal' : 
               'eRoute Transit'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Trigger Emergency SOS">
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<WarningIcon />}
                onClick={() => setSosOpen(true)}
                sx={{ display: { xs: 'none', md: 'inline-flex' }, fontWeight: 700 }}
              >
                SOS Alert
              </Button>
            </Tooltip>
            
            <IconButton 
              color="error"
              onClick={() => setSosOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, p: 1 }}
            >
              <WarningIcon fontSize="small" />
            </IconButton>

            <IconButton color="inherit" onClick={(e) => setNotifAnchor(e.currentTarget)}>
              <Badge badgeContent={unreadCount} color="error">
                <NotifIcon />
              </Badge>
            </IconButton>
            <Menu
              anchorEl={notifAnchor}
              open={Boolean(notifAnchor)}
              onClose={() => setNotifAnchor(null)}
              slotProps={{
                paper: {
                  sx: { width: { xs: 300, sm: 340 }, maxHeight: 400, borderRadius: 2, mt: 1.5 }
                }
              }}
            >
              <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Notifications ({notifs.length})
                </Typography>
              </Box>
              <Divider />
              {notifs.length === 0 ? (
                <MenuItem disabled>
                  <Typography variant="body2">No announcements at this time.</Typography>
                </MenuItem>
              ) : (
                notifs.slice(0, 5).map((n) => (
                  <MenuItem 
                    key={n.id} 
                    onClick={() => {
                      setNotifAnchor(null);
                      if (profile?.role === 'student') navigate('/student/notifications');
                      if (profile?.role === 'admin') navigate('/admin/notifications');
                    }}
                    sx={{ py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {n.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {n.message}
                    </Typography>
                  </MenuItem>
                ))
              )}
            </Menu>

            <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton onClick={toggleTheme} color="inherit">
                {darkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2.5, md: 3.5 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, sm: 8 },
          pb: { xs: 9, sm: 3.5 },
          maxWidth: '100%',
          overflowX: 'hidden'
        }}
      >
        {children}
      </Box>

      {/* Mobile Bottom Navigation Bar */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          display: { xs: 'block', sm: 'none' },
          zIndex: 1200,
          borderTop: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
        }} 
        elevation={8}
      >
        <BottomNavigation
          showLabels
          value={
            bottomNavItems.findIndex(item => item.path !== 'more' && (currentFullPath === item.path || (!item.path.includes('?') && location.pathname === item.path && !location.search))) >= 0
              ? bottomNavItems.findIndex(item => item.path !== 'more' && (currentFullPath === item.path || (!item.path.includes('?') && location.pathname === item.path && !location.search)))
              : 4
          }
          onChange={(_, newValue) => {
            const selectedItem = bottomNavItems[newValue];
            if (selectedItem) {
              if (selectedItem.path === 'more') {
                handleDrawerToggle();
              } else {
                navigate(selectedItem.path);
              }
            }
          }}
          sx={{
            bgcolor: 'background.paper',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              px: 1,
              py: 0.5,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 700
              }
            }
          }}
        >
          {bottomNavItems.map((item) => (
            <BottomNavigationAction key={item.label} label={item.label} icon={item.icon} />
          ))}
        </BottomNavigation>
      </Paper>

      <SOSModal open={sosOpen} onClose={() => setSosOpen(false)} />
    </Box>
  );
};
export default PortalLayout;

