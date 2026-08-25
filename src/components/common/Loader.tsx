import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export const Loader: React.FC<{ message?: string }> = ({ message = 'Synchronizing credentials...' }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '80vh' 
      }}
    >
      <CircularProgress size={48} sx={{ mb: 2 }} />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};
export default Loader;
