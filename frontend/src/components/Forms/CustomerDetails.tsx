import React from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';

interface Props {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const CustomerDetails: React.FC<Props> = ({ formData, updateFormData, onNext, onBack }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: formData
  });

  const onSubmit = (data: any) => {
    updateFormData(data);
    onNext();
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h5" gutterBottom>
        Your Information
      </Typography>

      <TextField
        {...register('customerName', { required: 'Name is required' })}
        label="Full Name"
        fullWidth
        margin="normal"
        error={!!errors.customerName}
        helperText={errors.customerName?.message as string}
      />

      <TextField
        {...register('customerEmail', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address'
          }
        })}
        label="Email Address"
        type="email"
        fullWidth
        margin="normal"
        error={!!errors.customerEmail}
        helperText={errors.customerEmail?.message as string}
      />

      <TextField
        {...register('customerPhone', { required: 'Phone is required' })}
        label="Phone Number"
        fullWidth
        margin="normal"
        error={!!errors.customerPhone}
        helperText={errors.customerPhone?.message as string}
      />

      <TextField
        {...register('notes')}
        label="Additional Notes (Optional)"
        fullWidth
        multiline
        rows={4}
        margin="normal"
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack} variant="outlined">
          Back
        </Button>
        <Button type="submit" variant="contained">
          Continue
        </Button>
      </Box>
    </Box>
  );
};

export default CustomerDetails;