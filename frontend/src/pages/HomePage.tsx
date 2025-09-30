import React from 'react';
import { Container, Typography, Button, Box, Card, CardContent, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CalendarToday, Security, Business, Phone } from '@mui/icons-material';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Hero Section */}
      <Box textAlign="center" sx={{ mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom color="primary">
          🏢 KF Insurance
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom color="textSecondary">
          Professional Insurance Consultation Services
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
          Schedule a personalized consultation with our insurance experts. We offer both digital
          and in-person meetings to help you find the perfect insurance solution.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/book')}
          sx={{ px: 6, py: 2 }}
        >
          Book Your Consultation
        </Button>
      </Box>

      {/* Features Section */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <CalendarToday color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Easy Scheduling
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Book appointments at your convenience with our simple online system
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Security color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Expert Advice
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Get professional insurance guidance from certified experts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Business color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Business & Personal
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Comprehensive coverage for both personal and business needs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Phone color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Digital & In-Person
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Choose between virtual meetings or face-to-face consultations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Services Section */}
      <Box sx={{ bgcolor: 'grey.50', p: 4, borderRadius: 2, mb: 4 }}>
        <Typography variant="h4" component="h3" textAlign="center" gutterBottom>
          Our Services
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              Personal Insurance
            </Typography>
            <ul>
              <li>Auto Insurance</li>
              <li>Home & Property Insurance</li>
              <li>Life & Health Insurance</li>
              <li>Travel Insurance</li>
            </ul>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              Business Insurance
            </Typography>
            <ul>
              <li>General Liability</li>
              <li>Property & Equipment</li>
              <li>Professional Liability</li>
              <li>Workers' Compensation</li>
            </ul>
          </Grid>
        </Grid>
      </Box>

      {/* CTA Section */}
      <Box textAlign="center" sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Ready to Get Started?
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Schedule your consultation today and get expert advice tailored to your needs.
        </Typography>
        <Box display="flex" justifyContent="center" gap={2}>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate('/book')}
          >
            Schedule Consultation
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            onClick={() => navigate('/admin')}
          >
            Admin Dashboard
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;