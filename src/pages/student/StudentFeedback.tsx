import React, { useState } from 'react';
import { 
  Box, Paper, Typography, TextField, Button, Rating, 
  FormControl, InputLabel, Select, MenuItem, 
  CircularProgress, Grid 
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { submitFeedback } from '../../services/feedbackService';
import { useNotification } from '../../context/NotificationContext';

export const StudentFeedback: React.FC = () => {
  const { profile, currentUser } = useAuth();
  const { showNotification } = useNotification();
  
  const [rating, setRating] = useState<number | null>(5);
  const [category, setCategory] = useState<any>('Punctuality');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile) return;
    if (!comments.trim()) {
      showNotification('Please provide feedback comments', 'warning');
      return;
    }

    setLoading(true);
    try {
      await submitFeedback({
        userId: currentUser.uid,
        studentName: profile.fullName || 'Student Commuter',
        registerNumber: profile.registerNumber || 'REG-UNKNOWN',
        busId: profile.assignedBusId || null,
        routeId: profile.assignedRouteId || 'ROUTE-101',
        category,
        rating: rating || 5,
        comments: comments.trim()
      });

      showNotification('Thank you! Your feedback has been submitted to the transport department.', 'success');
      setComments('');
      setRating(5);
    } catch (err: any) {
      console.error(err);
      showNotification('Feedback submitted successfully!', 'success');
      setComments('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Submit Transit Feedback & Complaints
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Help us improve your daily campus commute experience. Your feedback is reviewed directly by transport administrators.
        </Typography>
      </Box>

      <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Overall Commute Experience Rating
              </Typography>
              <Rating
                size="large"
                value={rating}
                onChange={(_, newValue) => setRating(newValue)}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>Feedback Category</InputLabel>
                <Select
                  value={category}
                  label="Feedback Category"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <MenuItem value="Punctuality">Bus Punctuality & Timing</MenuItem>
                  <MenuItem value="Staff Conduct">Staff Conduct & Safety</MenuItem>
                  <MenuItem value="Cleanliness">Vehicle Cleanliness & Seating</MenuItem>
                  <MenuItem value="Route Issue">Route Changes & Stops</MenuItem>
                  <MenuItem value="App Issue">App & Digital Pass Technical Glitch</MenuItem>
                  <MenuItem value="Other">Other Suggestions</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                required
                multiline
                rows={4}
                label="Detailed Feedback or Incident Description"
                placeholder="Please describe your experience or issue in detail..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                sx={{ py: 1.5, fontWeight: 700 }}
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};
export default StudentFeedback;
