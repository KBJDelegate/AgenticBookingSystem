import React from 'react';
import { Container, Paper, Typography, Box, Button, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useParams, useNavigate } from 'react-router-dom';

const ConfirmationPage: React.FC = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />

        <Typography variant="h4" gutterBottom>
          Booking Confirmed!
        </Typography>

        <Typography variant="body1" color="textSecondary" paragraph>
          Your appointment has been successfully booked.
        </Typography>

        <Alert severity="info" sx={{ mt: 3, mb: 3 }}>
          Booking Reference: <strong>{bookingId}</strong>
        </Alert>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            What's Next?
          </Typography>
          <Typography variant="body2" paragraph>
            • You will receive a confirmation email shortly
          </Typography>
          <Typography variant="body2" paragraph>
            • An SMS reminder will be sent to your phone
          </Typography>
          <Typography variant="body2" paragraph>
            • You'll receive another reminder 24 hours before your appointment
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 4 }}
        >
          Book Another Appointment
        </Button>
      </Paper>
    </Container>
  );
};

export default ConfirmationPage;