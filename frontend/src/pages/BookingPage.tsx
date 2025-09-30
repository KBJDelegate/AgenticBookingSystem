/**
 * Booking Page Component
 * This is where customers fill out the booking form
 */

import React, { useState } from 'react';
import {
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Import form step components
import ServiceSelection from '../components/Forms/ServiceSelection';
import TimeSelection from '../components/Forms/TimeSelection';
import CustomerDetails from '../components/Forms/CustomerDetails';
import DocumentUpload from '../components/Forms/DocumentUpload';
import ReviewBooking from '../components/Forms/ReviewBooking';

// Import API service
import { bookingApi } from '../services/bookingApi';

const steps = [
  'Select Service',
  'Choose Time',
  'Your Information',
  'Upload Documents',
  'Review & Confirm'
];

export interface BookingFormData {
  // Service selection
  brand: 'B1' | 'B2';
  serviceId: string;
  meetingType: 'digital' | 'physical';
  businessPurpose: boolean;

  // Time selection
  selectedDate: Date | null;
  selectedTime: string | null;

  // Customer details
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;

  // Documents
  documents: File[];
}

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data state
  const [formData, setFormData] = useState<BookingFormData>({
    brand: 'B1',
    serviceId: '',
    meetingType: 'digital',
    businessPurpose: false,
    selectedDate: null,
    selectedTime: null,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
    documents: []
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setError(null);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Submit booking to backend
      const response = await bookingApi.createBooking(formData);

      // Navigate to confirmation page
      navigate(`/confirmation/${response.bookingId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please try again.');
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <ServiceSelection
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <TimeSelection
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <CustomerDetails
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <DocumentUpload
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <ReviewBooking
            formData={formData}
            onSubmit={handleSubmit}
            onBack={handleBack}
            loading={loading}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Book Your Insurance Consultation
        </Typography>
        <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 4 }}>
          Schedule a meeting with one of our insurance experts
        </Typography>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        <Box sx={{ mt: 2 }}>
          {getStepContent(activeStep)}
        </Box>
      </Paper>
    </Container>
  );
};

export default BookingPage;