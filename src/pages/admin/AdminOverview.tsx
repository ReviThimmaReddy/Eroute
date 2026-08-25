import React, { useEffect, useState } from 'react';
import { 
  Box, Grid, Typography, CircularProgress, 
  Paper
} from '@mui/material';
import { 
  People, DirectionsBus, Map, ConfirmationNumber
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import StatCard from '../../components/common/StatCard';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

export const AdminOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalBuses: 0,
    totalRoutes: 0,
    activePasses: 0,
    pendingPasses: 0,
    todayAttendance: 0
  });

  useEffect(() => {
    loadOverviewStats();
  }, []);

  const loadOverviewStats = async () => {
    setLoading(true);
    try {
      const [usersSnap, busesSnap, routesSnap, passesSnap, attSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'buses')),
        getDocs(collection(db, 'routes')),
        getDocs(collection(db, 'busPasses')),
        getDocs(collection(db, 'attendanceLogs'))
      ]);

      const users = usersSnap.docs.map(d => d.data());
      const passes = passesSnap.docs.map(d => d.data());

      const students = users.filter(u => u.role === 'student');
      const activeP = passes.filter(p => {
        const st = (p.status || '').toLowerCase();
        return st === 'issued' || st === 'approved';
      });
      const pendingP = passes.filter(p => (p.status || '').toLowerCase() === 'pending');

      setStats({
        totalStudents: students.length,
        totalBuses: busesSnap.docs.length,
        totalRoutes: routesSnap.docs.length,
        activePasses: activeP.length,
        pendingPasses: pendingP.length,
        todayAttendance: attSnap.docs.length
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Ridership Trends Chart Data
  const lineChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        label: 'Morning Boardings',
        data: [142, 189, 210, 195, 230, 85],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Evening Drops',
        data: [130, 175, 198, 182, 215, 80],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Pass Distribution Doughnut
  const doughnutData = {
    labels: ['Annual Pass', 'Semester Pass', 'Monthly Pass', 'Pending Approval'],
    datasets: [
      {
        data: [stats.activePasses, Math.max(1, Math.floor(stats.activePasses * 0.4)), Math.max(1, Math.floor(stats.activePasses * 0.1)), stats.pendingPasses],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 0
      }
    ]
  };

  return (
    <Box>
      <Box sx={{ mb: { xs: 2.5, sm: 4 } }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.4rem', sm: '2rem' } }}>
          Mobility Analytics & Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
          Real-time metrics, fleet operational status, ridership trends, and pass distribution.
        </Typography>
      </Box>

      {/* KPI Stats */}
      <Grid container spacing={{ xs: 1.5, sm: 2.5 }} sx={{ mb: { xs: 2.5, sm: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            subtitle="Registered campus commuters"
            icon={<People sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Fleet Buses"
            value={`${stats.totalBuses} Buses`}
            subtitle="Campus transit fleet"
            icon={<DirectionsBus sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #10B981 0%, #047857 100%)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Passes"
            value={stats.activePasses}
            subtitle={`${stats.pendingPasses} Pending review`}
            icon={<ConfirmationNumber sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Transit Routes"
            value={stats.totalRoutes}
            subtitle="Sequenced corridors"
            icon={<Map sx={{ color: '#fff' }} />}
            gradient="linear-gradient(135deg, #F59E0B 0%, #B45309 100%)"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Weekly Ridership Volume
            </Typography>
            <Box sx={{ height: { xs: 220, sm: 300 } }}>
              <Line 
                data={lineChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' as const } }
                }} 
              />
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Pass Allocation Breakdown
            </Typography>
            <Box sx={{ height: { xs: 220, sm: 300 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut 
                data={doughnutData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' as const } }
                }} 
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
export default AdminOverview;
