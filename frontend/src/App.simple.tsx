import { Container, Typography, Paper, Box } from '@mui/material';

function App() {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          🏢 KF Insurance Booking System
        </Typography>

        <Typography variant="h6" color="primary" align="center" gutterBottom>
          ✅ Frontend is Working!
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" paragraph>
            <strong>Backend Status:</strong> Running on port 3001
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Frontend Status:</strong> Running on port 5174
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Next Steps:</strong>
          </Typography>
          <ul>
            <li>Configure Azure AD credentials in backend/.env</li>
            <li>Set up Microsoft Bookings business ID</li>
            <li>Test the booking form functionality</li>
          </ul>
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
          <Typography variant="body2" color="success.contrastText">
            🎉 System successfully built and running!
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default App;