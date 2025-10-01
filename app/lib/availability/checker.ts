import { getGraphClient } from '../graph/client';
import { addMinutes, parseISO } from 'date-fns';

/**
 * Checks if a time slot is available across all three calendars:
 * 1. Service calendar (e.g., onboarding@kunde.dk)
 * 2. Brand/department calendar (e.g., hr@kunde.dk)
 * 3. Employee primary calendar (e.g., torben@kunde.dk)
 */
export async function checkAvailability(
  serviceCalendarId: string,
  brandCalendarId: string,
  employeeCalendarId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  const client = getGraphClient();

  try {
    // Check all three calendars in parallel
    const [serviceAvailable, brandAvailable, employeeAvailable] = await Promise.all([
      checkCalendarAvailability(client, serviceCalendarId, startTime, endTime),
      checkCalendarAvailability(client, brandCalendarId, startTime, endTime),
      checkCalendarAvailability(client, employeeCalendarId, startTime, endTime),
    ]);

    // All three must be available for the slot to be bookable
    return serviceAvailable && brandAvailable && employeeAvailable;
  } catch (error) {
    console.error('Error checking availability:', error);
    return false;
  }
}

/**
 * Checks if a specific calendar is available during the given time slot
 */
async function checkCalendarAvailability(
  client: any,
  calendarId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const response = await client
      .api(`/users/${calendarId}/calendar/calendarView`)
      .query({
        startDateTime: startTime.toISOString(),
        endDateTime: endTime.toISOString(),
      })
      .select('id,subject,start,end,showAs')
      .get();

    const events = response.value || [];

    // If there are any events during this time (and they're not marked as "free"), slot is not available
    const hasConflict = events.some((event: any) => {
      return event.showAs !== 'free';
    });

    return !hasConflict;
  } catch (error) {
    console.error(`Error checking calendar ${calendarId}:`, error);
    return false;
  }
}

/**
 * Gets available time slots for a service+brand+employee combination
 */
export async function getAvailableSlots(
  serviceCalendarId: string,
  brandCalendarId: string,
  employeeCalendarId: string,
  startDate: Date,
  endDate: Date,
  serviceDuration: number, // in minutes
  workingHours = { start: 9, end: 17 } // 9 AM to 5 PM
): Promise<Array<{ start: Date; end: Date }>> {
  const slots: Array<{ start: Date; end: Date }> = [];

  // Generate all possible time slots within working hours
  const currentDate = new Date(startDate);

  while (currentDate < endDate) {
    // Start at beginning of working hours
    currentDate.setHours(workingHours.start, 0, 0, 0);

    const endOfDay = new Date(currentDate);
    endOfDay.setHours(workingHours.end, 0, 0, 0);

    // Check each 30-minute slot
    while (currentDate < endOfDay) {
      const slotStart = new Date(currentDate);
      const slotEnd = addMinutes(slotStart, serviceDuration);

      // Make sure slot doesn't go past working hours
      if (slotEnd <= endOfDay) {
        const isAvailable = await checkAvailability(
          serviceCalendarId,
          brandCalendarId,
          employeeCalendarId,
          slotStart,
          slotEnd
        );

        if (isAvailable) {
          slots.push({
            start: new Date(slotStart),
            end: new Date(slotEnd),
          });
        }
      }

      // Move to next 30-minute slot
      currentDate.setMinutes(currentDate.getMinutes() + 30);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }

  return slots;
}

/**
 * Use Microsoft Graph's findMeetingTimes API for more efficient availability checking
 */
export async function findAvailableTimesEfficient(
  attendees: string[], // [serviceCalendarId, brandCalendarId, employeeCalendarId]
  startDate: Date,
  endDate: Date,
  duration: number // in minutes
): Promise<Array<{ start: Date; end: Date }>> {
  const client = getGraphClient();

  try {
    const response = await client
      .api('/me/findMeetingTimes')
      .post({
        attendees: attendees.map(email => ({
          emailAddress: { address: email },
          type: 'required',
        })),
        timeConstraint: {
          timeslots: [{
            start: {
              dateTime: startDate.toISOString(),
              timeZone: 'UTC',
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: 'UTC',
            },
          }],
        },
        meetingDuration: `PT${duration}M`,
        returnSuggestionReasons: true,
        minimumAttendeePercentage: 100,
      });

    const suggestions = response.meetingTimeSuggestions || [];

    return suggestions.map((suggestion: any) => ({
      start: parseISO(suggestion.meetingTimeSlot.start.dateTime),
      end: parseISO(suggestion.meetingTimeSlot.end.dateTime),
    }));
  } catch (error) {
    console.error('Error finding meeting times:', error);
    return [];
  }
}
