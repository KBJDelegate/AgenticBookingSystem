import React from 'react';
import { Box, Button, Typography, Paper, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { format } from 'date-fns';

interface Props {
  formData: any;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

const ReviewBooking: React.FC<Props> = ({ formData, onSubmit, onBack, loading }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Review Your Booking
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <List>
          <ListItem>
            <ListItemText
              primary="Service"
              secondary={formData.serviceId || 'Not selected'}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Meeting Type"
              secondary={formData.meetingType === 'digital' ? 'Digital (Teams)' : 'In-Person'}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Date & Time"
              secondary={
                formData.selectedDate
                  ? `${format(formData.selectedDate, 'EEEE, MMMM d, yyyy')} at ${formData.selectedTime}`
                  : 'Not selected'
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Name"
              secondary={formData.customerName || 'Not provided'}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Email"
              secondary={formData.customerEmail || 'Not provided'}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Phone"
              secondary={formData.customerPhone || 'Not provided'}
            />
          </ListItem>
          {formData.notes && (
            <ListItem>
              <ListItemText
                primary="Notes"
                secondary={formData.notes}
              />
            </ListItem>
          )}
          {formData.documents && formData.documents.length > 0 && (
            <ListItem>
              <ListItemText
                primary="Documents"
                secondary={`${formData.documents.length} file(s) uploaded`}
              />
            </ListItem>
          )}
        </List>
      </Paper>

      <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
        By clicking "Confirm Booking", you agree to receive confirmation via email and SMS.
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack} variant="outlined" disabled={loading}>
          Back
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Processing...' : 'Confirm Booking'}
        </Button>
      </Box>
    </Box>
  );
};

export default ReviewBooking;