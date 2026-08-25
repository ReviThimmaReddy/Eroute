import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Button, Grid, Card, CardContent, 
  Chip
} from '@mui/material';
import { 
  DirectionsBus, QrCodeScanner, Route as RouteIcon, 
  AdminPanelSettings, NotificationsActive, CreditCard, 
  School, CheckCircle, ArrowForward, LocalHospital
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activeBuses: 0,
    activeRoutes: 0,
    issuedPasses: 0,
    totalStudents: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadFirestoreStats();
  }, []);

  const loadFirestoreStats = async () => {
    setLoadingStats(true);
    try {
      const [busesSnap, routesSnap, passesSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'buses')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'routes')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'busPasses')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'users')).catch(() => ({ docs: [] }))
      ]);

      const activeBusesCount = busesSnap.docs.filter(d => d.data().status === 'In Service').length;
      const activeRoutesCount = routesSnap.docs.filter(d => d.data().isActive !== false).length;
      const issuedPassesCount = passesSnap.docs.filter(d => d.data().status === 'Issued' || d.data().status === 'Approved').length;
      const studentsCount = usersSnap.docs.filter(d => d.data().role === 'student').length;

      setStats({
        activeBuses: activeBusesCount,
        activeRoutes: activeRoutesCount,
        issuedPasses: issuedPassesCount,
        totalStudents: studentsCount
      });
    } catch (e) {
      console.warn('Landing stats note:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const features = [
    {
      icon: <CreditCard sx={{ fontSize: 36, color: '#3B82F6' }} />,
      title: 'Student Bus Pass',
      description: 'Apply for dynamic distance-priced digital bus passes with Bengaluru Google Places route calculation and instant savings.'
    },
    {
      icon: <RouteIcon sx={{ fontSize: 36, color: '#10B981' }} />,
      title: 'Route & Stop Master',
      description: 'Comprehensive transit route planning with sequenced stop coordinates, pickup timings, and distance calculation.'
    },
    {
      icon: <QrCodeScanner sx={{ fontSize: 36, color: '#F59E0B' }} />,
      title: 'QR Attendance',
      description: 'High-security QR badge check-in with offline camera scanning, duplicate prevention, and real-time boarding verification.'
    },
    {
      icon: <DirectionsBus sx={{ fontSize: 36, color: '#8B5CF6' }} />,
      title: 'Campus Transit Fleet',
      description: 'Centralized bus roster management with seating capacity allocation, conductor assignments, and vehicle health status.'
    },
    {
      icon: <CheckCircle sx={{ fontSize: 36, color: '#EC4899' }} />,
      title: 'Conductor Verification',
      description: 'Handheld conductor terminal for passenger roster management, instant QR scanning, and automated shift summary reports.'
    },
    {
      icon: <AdminPanelSettings sx={{ fontSize: 36, color: '#06B6D4' }} />,
      title: 'Admin Fleet Management',
      description: 'Comprehensive transport directorate suite for route planning, pricing control, staff assignments, and audit logs.'
    },
    {
      icon: <NotificationsActive sx={{ fontSize: 36, color: '#6366F1' }} />,
      title: 'Real-Time Notifications',
      description: 'Instant multi-channel push alerts for route updates, schedule delays, pass approvals, and campus announcements.'
    },
    {
      icon: <LocalHospital sx={{ fontSize: 36, color: '#EF4444' }} />,
      title: 'Emergency SOS',
      description: 'One-touch emergency dispatch broadcasting immediate vehicle coordinates to transport control and security teams.'
    }
  ];

  const portals = [
    { role: 'student', title: 'Student Portal', desc: 'Pass application, digital QR pass & attendance logs', icon: <School />, color: '#3B82F6' },
    { role: 'admin', title: 'Admin Portal', desc: 'Fleet management, pricing rules & staff management', icon: <AdminPanelSettings />, color: '#8B5CF6' },
    { role: 'conductor', title: 'Conductor Portal', desc: 'Scan student QR codes & record boarding attendance', icon: <QrCodeScanner />, color: '#F59E0B' }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0B0F19', color: '#fff' }}>
      {/* Header Bar */}
      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', py: 2, px: { xs: 2, md: 6 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#0F172A' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DirectionsBus sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.5, color: '#fff' }}>
            eRoute
          </Typography>
          <Chip label="Bengaluru Campus Transit" color="primary" size="small" sx={{ fontWeight: 800, fontSize: '0.75rem' }} />
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/login')}
          sx={{ fontWeight: 800, borderRadius: 2.5, px: 3 }}
        >
          Sign In / Portal Login
        </Button>
      </Box>

      {/* Hero Banner */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 10 }, pb: 8, textAlign: 'center' }}>
        <Chip label="✨ Intelligent Student Mobility Ecosystem" sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 800, px: 1, mb: 3 }} />
        
        <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, background: 'linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: { xs: '2.5rem', md: '3.75rem' } }}>
          Smart University Transit & Digital Pass Management
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', mb: 5, fontWeight: 400, color: '#94A3B8' }}>
          eRoute unifies dynamic road-distance pass pricing, instant QR boarding verification, Bengaluru Google Places routing, and transport fleet oversight into a single production platform.
        </Typography>

        {/* Portal Access Buttons Grid */}
        <Grid container spacing={3} sx={{ mb: 8, justifyContent: 'center' }}>
          {portals.map((p) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.role}>
              <Card 
                onClick={() => navigate('/login')}
                sx={{ 
                  bgcolor: '#0F172A', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: 3, 
                  cursor: 'pointer', 
                  transition: 'transform 0.2s, border-color 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', borderColor: p.color }
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'left' }}>
                  <Box sx={{ p: 1.5, bgcolor: `${p.color}15`, borderRadius: 2, display: 'inline-flex', color: p.color, mb: 2 }}>
                    {p.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: '#fff' }}>
                    {p.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2, minHeight: 40 }}>
                    {p.desc}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: p.color, fontWeight: 800, fontSize: '0.875rem' }}>
                    Sign In to Portal <ArrowForward fontSize="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Fleet Metrics Card */}
        <Card sx={{ bgcolor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, p: 3, mb: 10 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#3B82F6' }}>
                {loadingStats ? '--' : stats.activeBuses}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>Active Fleet Buses</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#10B981' }}>
                {loadingStats ? '--' : stats.activeRoutes}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>Configured Routes</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#8B5CF6' }}>
                {loadingStats ? '--' : stats.issuedPasses}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>Active Digital Passes</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#F59E0B' }}>
                {loadingStats ? '--' : stats.totalStudents}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>Registered Commuters</Typography>
            </Grid>
          </Grid>
        </Card>

        {/* Ecosystem Features Section */}
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, textAlign: 'left' }}>
          Ecosystem Capability Matrix
        </Typography>
        <Typography variant="body1" sx={{ color: '#94A3B8', mb: 5, textAlign: 'left' }}>
          Built with React, TypeScript, and Firebase Firestore for real-time campus mobility operations.
        </Typography>

        <Grid container spacing={3}>
          {features.map((feat, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
              <Card sx={{ bgcolor: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3, textAlign: 'left' }}>
                  <Box sx={{ mb: 2 }}>{feat.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#fff' }}>
                    {feat.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                    {feat.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', py: 4, textAlign: 'center', bgcolor: '#0F172A' }}>
        <Typography variant="body2" color="text.secondary">
          © 2026 eRoute Intelligent Student Mobility Ecosystem. All rights reserved. Powered by Firebase Firestore & Google Maps APIs.
        </Typography>
      </Box>
    </Box>
  );
};

export default Landing;
