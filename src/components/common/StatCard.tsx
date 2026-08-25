import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  gradient = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
}) => {
  return (
    <Card 
      sx={{ 
        background: gradient, 
        color: '#fff', 
        height: '100%',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.2)'
        }
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: { xs: 1.5, sm: 2 } }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: { xs: 11, sm: 13 } }}>
            {title}
          </Typography>
          <Box 
            sx={{ 
              p: { xs: 0.8, sm: 1.2 }, 
              borderRadius: 2, 
              bgcolor: 'rgba(255,255,255,0.12)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backdropFilter: 'blur(4px)'
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: -0.5, fontSize: { xs: '1.4rem', sm: '2.125rem' } }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500, fontSize: { xs: 11, sm: 12 } }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
export default StatCard;
