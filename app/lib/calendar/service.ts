import { getGraphClient } from '@/lib/graph/client';
import { addMinutes, isSameDay, parseISO, format } from 'date-fns';

export interface CalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  showAs: 'free' | 'busy' | 'tentative' | 'workingElsewhere' | 'oof' | 'unknown';
  attendees?: any[];
  body?: {
    contentType: string;
    content: string;
  };
  organizer?: {
    emailAddress: {
      address: string;
      name?: string;
    };
  };
  location?: {
    displayName?: string;
  };
  isAllDay?: boolean;
  type?: 'singleInstance' | 'occurrence' | 'exception' | 'seriesMaster';
  recurrence?: any;
}

export interface RecurringMeeting {
  id: string;
  subject: string;
  startTime: string; // Time in HH:mm format
  endTime: string;   // Time in HH:mm format
  daysOfWeek: string[];
  duration: number; // in minutes
  seriesMasterId?: string;
}

/**
 * Get calendar events for a specific mailbox
 */
export async function getCalendarEvents(
  mailboxEmail: string,
  startDate: Date,
  endDate: Date,
  includeRecurring: boolean = true
): Promise<CalendarEvent[]> {
  const client = getGraphClient();

  try {
    let query = client
      .api(`/users/${mailboxEmail}/calendar/calendarView`)
      .query({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
      })
      .select('id,subject,start,end,showAs,attendees,body,organizer,isAllDay,type,recurrence')
      .top(200); // Fetch up to 200 events to handle recurring meetings over 90 days

    if (includeRecurring) {
      query = query.header('Prefer', 'outlook.timezone="UTC"');
    }

    const response = await query.get();
    return response.value || [];
  } catch (error) {
    console.error(`Error fetching calendar events for ${mailboxEmail}:`, error);
    throw error;
  }
}

/**
 * Get recurring meetings from a shared mailbox that represent available slots
 * These meetings should have a specific pattern in their subject (e.g., "Available", "Open Slot")
 */
export async function getRecurringAvailableSlots(
  sharedMailboxEmail: string,
  startDate: Date,
  endDate: Date,
  slotPattern: string = 'Available'
): Promise<RecurringMeeting[]> {
  const client = getGraphClient();

  try {
    // Get all events including recurring ones
    const events = await getCalendarEvents(sharedMailboxEmail, startDate, endDate, true);

    // Filter for recurring meetings that match the availability pattern
    const availableSlots: RecurringMeeting[] = [];
    const processedMasters = new Set<string>();

    for (const event of events) {
      // Check if this event represents an available slot
      if (event.subject?.includes(slotPattern) && event.showAs !== 'busy') {
        // For recurring events, we want to get the series master
        if (event.type === 'seriesMaster') {
          if (!processedMasters.has(event.id)) {
            processedMasters.add(event.id);

            const startTime = parseISO(event.start.dateTime);
            const endTime = parseISO(event.end.dateTime);
            const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

            availableSlots.push({
              id: event.id,
              subject: event.subject,
              startTime: format(startTime, 'HH:mm'),
              endTime: format(endTime, 'HH:mm'),
              daysOfWeek: extractDaysOfWeek(event.recurrence),
              duration,
              seriesMasterId: event.id
            });
          }
        } else if (event.type === 'occurrence') {
          // This is an occurrence of a recurring event
          const startTime = parseISO(event.start.dateTime);
          const endTime = parseISO(event.end.dateTime);
          const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

          availableSlots.push({
            id: event.id,
            subject: event.subject,
            startTime: format(startTime, 'HH:mm'),
            endTime: format(endTime, 'HH:mm'),
            daysOfWeek: [format(startTime, 'EEEE').toLowerCase()],
            duration,
            seriesMasterId: event.id.split('_')[0] // Extract series master ID
          });
        }
      }
    }

    return availableSlots;
  } catch (error) {
    console.error(`Error fetching recurring available slots for ${sharedMailboxEmail}:`, error);
    throw error;
  }
}

/**
 * Create a calendar event (booking) in both shared mailbox and personal calendar
 */
export async function createCalendarBooking(
  sharedMailboxEmail: string,
  staffEmail: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string | undefined,
  serviceName: string,
  startTime: Date,
  endTime: Date
): Promise<{ sharedEventId: string; staffEventId: string }> {
  const client = getGraphClient();

  const event = {
    subject: `${serviceName} - ${customerName}`,
    body: {
      contentType: 'HTML',
      content: `
        <p><strong>Service:</strong> ${serviceName}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        ${customerPhone ? `<p><strong>Phone:</strong> ${customerPhone}</p>` : ''}
        <p><strong>Assigned Staff:</strong> ${staffEmail}</p>
        <hr>
        <p><em>This booking was created using the shared mailbox calendar system.</em></p>
      `,
    },
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'UTC',
    },
    showAs: 'busy',
    attendees: [
      {
        emailAddress: {
          address: customerEmail,
          name: customerName,
        },
        type: 'required',
      },
      {
        emailAddress: {
          address: staffEmail,
          name: 'Staff Member',
        },
        type: 'required',
      },
    ],
    isReminderOn: true,
    reminderMinutesBeforeStart: 15,
  };

  try {
    // Create event in shared mailbox calendar
    const sharedResponse = await client
      .api(`/users/${sharedMailboxEmail}/calendar/events`)
      .post(event);

    // Create event in staff personal calendar
    const staffEvent = {
      ...event,
      subject: `[Booking] ${serviceName} - ${customerName}`,
      location: {
        displayName: `Shared Calendar: ${sharedMailboxEmail}`,
      },
    };

    const staffResponse = await client
      .api(`/users/${staffEmail}/calendar/events`)
      .post(staffEvent);

    console.log(`✓ Created calendar events - Shared: ${sharedResponse.id}, Staff: ${staffResponse.id}`);

    return {
      sharedEventId: sharedResponse.id,
      staffEventId: staffResponse.id,
    };
  } catch (error) {
    console.error('Error creating calendar booking:', error);
    throw error;
  }
}

/**
 * Cancel a calendar booking by deleting the events
 */
export async function cancelCalendarBooking(
  sharedMailboxEmail: string,
  staffEmail: string,
  sharedEventId: string,
  staffEventId: string,
  cancellationMessage?: string
): Promise<void> {
  const client = getGraphClient();

  try {
    // Cancel event in shared mailbox
    await client
      .api(`/users/${sharedMailboxEmail}/calendar/events/${sharedEventId}`)
      .delete();

    // Cancel event in staff calendar
    await client
      .api(`/users/${staffEmail}/calendar/events/${staffEventId}`)
      .delete();

    console.log(`✓ Cancelled calendar events - Shared: ${sharedEventId}, Staff: ${staffEventId}`);
  } catch (error) {
    console.error('Error cancelling calendar booking:', error);
    throw error;
  }
}

/**
 * Check if a specific time slot is available in a calendar
 */
export async function isTimeSlotAvailable(
  mailboxEmail: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const events = await getCalendarEvents(mailboxEmail, startTime, endTime);

    // Check if there are any conflicting events (not marked as free)
    const hasConflict = events.some((event) => {
      return event.showAs !== 'free';
    });

    return !hasConflict;
  } catch (error) {
    console.error(`Error checking availability for ${mailboxEmail}:`, error);
    return false;
  }
}

/**
 * Extract days of week from recurrence pattern
 */
function extractDaysOfWeek(recurrence: any): string[] {
  if (!recurrence || !recurrence.pattern) {
    return [];
  }

  const pattern = recurrence.pattern;
  if (pattern.type === 'weekly' && pattern.daysOfWeek) {
    return pattern.daysOfWeek.map((day: string) => day.toLowerCase());
  }

  if (pattern.type === 'daily') {
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  }

  return [];
}

/**
 * Get calendar free/busy information
 */
export async function getFreeBusy(
  emails: string[],
  startTime: Date,
  endTime: Date
): Promise<any> {
  const client = getGraphClient();

  try {
    const response = await client
      .api('/me/calendar/getSchedule')
      .post({
        schedules: emails,
        startTime: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC',
        },
        endTime: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC',
        },
        availabilityViewInterval: 30,
      });

    return response.value || [];
  } catch (error) {
    console.error('Error getting free/busy information:', error);
    throw error;
  }
}