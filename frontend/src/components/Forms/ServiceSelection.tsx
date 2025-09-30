import React from 'react';
import { Box, Button, Card, CardContent, Typography, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';

interface Props {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
}

const ServiceSelection: React.FC<Props> = ({ formData, updateFormData, onNext }) => {
  const handleServiceSelect = (serviceId: string) => {
    updateFormData({ serviceId });
  };

  const handleMeetingTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ meetingType: event.target.value });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Select Service & Meeting Type
      </Typography>

      <FormControl component="fieldset" sx={{ mt: 3, mb: 3 }}>
        <FormLabel component="legend">Meeting Type</FormLabel>
        <RadioGroup
          row
          value={formData.meetingType || 'digital'}
          onChange={handleMeetingTypeChange}
        >
          <FormControlLabel value="digital" control={<Radio />} label="Digital Meeting (Teams)" />
          <FormControlLabel value="physical" control={<Radio />} label="In-Person Meeting" />
        </RadioGroup>
      </FormControl>

      <Typography variant="h6" gutterBottom>
        Select Insurance Service:
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Card
          sx={{ cursor: 'pointer', border: formData.serviceId === 'a6aea011-e8fa-4976-b236-5a37db2cad87' ? 2 : 0 }}
          onClick={() => handleServiceSelect('a6aea011-e8fa-4976-b236-5a37db2cad87')}
        >
          <CardContent>
            <Typography variant="h6">Insurance Consultation</Typography>
            <Typography variant="body2" color="text.secondary">
              60 minutes - Professional insurance consultation service
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{ cursor: 'pointer', border: formData.serviceId === '283e1a77-7611-4fb0-a697-542a90079381' ? 2 : 0 }}
          onClick={() => handleServiceSelect('283e1a77-7611-4fb0-a697-542a90079381')}
        >
          <CardContent>
            <Typography variant="h6">Claims Review</Typography>
            <Typography variant="body2" color="text.secondary">
              60 minutes - Review and process insurance claims
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{ cursor: 'pointer', border: formData.serviceId === '17ae53f1-6a90-4dea-96c6-f8353a84bad0' ? 2 : 0 }}
          onClick={() => handleServiceSelect('17ae53f1-6a90-4dea-96c6-f8353a84bad0')}
        >
          <CardContent>
            <Typography variant="h6">Policy Renewal</Typography>
            <Typography variant="body2" color="text.secondary">
              45 minutes - Renew existing insurance policies
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{ cursor: 'pointer', border: formData.serviceId === '45edd0a8-7b2a-4744-b82e-98d41931317f' ? 2 : 0 }}
          onClick={() => handleServiceSelect('45edd0a8-7b2a-4744-b82e-98d41931317f')}
        >
          <CardContent>
            <Typography variant="h6">New Policy Setup</Typography>
            <Typography variant="body2" color="text.secondary">
              90 minutes - Set up new insurance policy
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!formData.serviceId}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
};

export default ServiceSelection;