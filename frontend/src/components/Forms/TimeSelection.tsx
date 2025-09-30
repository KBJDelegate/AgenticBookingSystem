/**
 * Time Selection Component
 * Allows customers to select an available date and time for their appointment
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { format, addDays } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Import API service
import { bookingApi } from '../../services/bookingApi';

// Copenhagen timezone constant
const COPENHAGEN_TIMEZONE = 'Europe/Copenhagen';

interface TimeSlot {
  time: string;
  available: boolean;
  startDateTime: Date;
  endDateTime: Date;
}

interface Props {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const TimeSelection: React.FC<Props> = ({
  formData,
  updateFormData,
  onNext,
  onBack
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    formData.selectedDate || null
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(
    formData.selectedTime || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available time slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate);
    }
  }, [selectedDate, formData.serviceId]);

  const fetchTimeSlots = async (date: Date) => {
    setLoading(true);
    setError(null);

    try {
      // Call backend to get available slots from Microsoft Bookings
      const slots = await bookingApi.getAvailableSlots(
        formData.serviceId,
        date
      );

      // Convert backend slots directly to frontend format
      const convertedSlots: TimeSlot[] = slots
        .filter((slot: any) => slot.available) // Only show available slots
        .map((slot: any) => {
          const startDateTime = utcToZonedTime(new Date(slot.start), COPENHAGEN_TIMEZONE);
          const endDateTime = utcToZonedTime(new Date(slot.end), COPENHAGEN_TIMEZONE);
          const timeString = format(startDateTime, 'h:mm a');

          return {
            time: timeString,
            available: true, // We already filtered for available slots
            startDateTime,
            endDateTime
          };
        });

      setTimeSlots(convertedSlots);
    } catch (err: any) {
      setError('Failed to load available times. Please try again.');
      console.error('Error fetching time slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate: Date | null) => {
    setSelectedDate(newDate);
    setSelectedTime(null); // Reset time when date changes
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    if (slot.available && selectedDate) {
      setSelectedTime(slot.time);

      // Combine the selected date with the time from the slot
      // Use date components directly to avoid timezone issues
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();

      const startDateTime = new Date(year, month, day);
      startDateTime.setHours(slot.startDateTime.getHours());
      startDateTime.setMinutes(slot.startDateTime.getMinutes());
      startDateTime.setSeconds(0);
      startDateTime.setMilliseconds(0);

      const endDateTime = new Date(year, month, day);
      endDateTime.setHours(slot.endDateTime.getHours());
      endDateTime.setMinutes(slot.endDateTime.getMinutes());
      endDateTime.setSeconds(0);
      endDateTime.setMilliseconds(0);

      updateFormData({
        selectedDate: selectedDate,
        selectedTime: slot.time,
        startDateTime: startDateTime,
        endDateTime: endDateTime
      });
    }
  };

  const handleNext = () => {
    if (selectedDate && selectedTime) {
      onNext();
    }
  };

  // Disable past dates and weekends
  const shouldDisableDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0 || date.getDay() === 6;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Select Date and Time
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Choose an available time slot for your {formData.meetingType} meeting
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Calendar */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <DateCalendar
              value={selectedDate}
              onChange={handleDateChange}
              shouldDisableDate={shouldDisableDate}
              minDate={new Date()}
              maxDate={addDays(new Date(), 30)}
            />
          </Paper>
        </Grid>

        {/* Time Slots */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, minHeight: 320 }}>
            <Typography variant="h6" gutterBottom>
              <AccessTimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Available Times
            </Typography>

            {!selectedDate && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 4 }}>
                Please select a date to view available times
              </Typography>
            )}

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {selectedDate && !loading && !error && (
              <Box sx={{ mt: 2 }}>
                {timeSlots.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No available times for this date
                  </Typography>
                ) : (
                  <Grid container spacing={1}>
                    {timeSlots.map((slot) => (
                      <Grid item xs={4} key={slot.time}>
                        <Chip
                          label={slot.time}
                          onClick={() => handleTimeSelect(slot)}
                          disabled={!slot.available}
                          color={selectedTime === slot.time ? 'primary' : 'default'}
                          variant={selectedTime === slot.time ? 'filled' : 'outlined'}
                          sx={{
                            width: '100%',
                            opacity: slot.available ? 1 : 0.4,
                            cursor: slot.available ? 'pointer' : 'not-allowed'
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Selected Summary */}
      {selectedDate && selectedTime && (
        <Alert severity="success" sx={{ mt: 3 }}>
          Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
        </Alert>
      )}

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack} variant="outlined">
          Back
        </Button>
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={!selectedDate || !selectedTime}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
};

export default TimeSelection;