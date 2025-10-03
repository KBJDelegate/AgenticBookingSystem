import {
  getCalendarEvents,
  getRecurringAvailableSlots as getRecurringMeetings,
  isTimeSlotAvailable,
  CalendarEvent
} from './service';
import {
  addMinutes,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
  endOfDay,
  isAfter,
  isBefore,
  getDay
} from 'date-fns';

export interface AvailableSlot {
  start: Date;
  end: Date;
  serviceName?: string;
  duration: number;
  isRecurring: boolean;
  recurringId?: string;
}

/**
 * Get available time slots from a shared mailbox calendar
 * Recurring meetings with specific patterns represent available slots
 */
export async function getAvailableSlots(
  sharedMailboxEmail: string,
  staffEmail: string,
  startDate: Date,
  endDate: Date,
  serviceDuration: number,
  availabilityPattern: string = 'Available'
): Promise<AvailableSlot[]> {
  const availableSlots: AvailableSlot[] = [];

  try {
    // Get all calendar events from the shared mailbox
    const sharedCalendarEvents = await getCalendarEvents(
      sharedMailboxEmail,
      startDate,
      endDate,
      true
    );

    console.log(`[Availability] Found ${sharedCalendarEvents.length} total events in ${sharedMailboxEmail}`);
    console.log('[Availability] Events:', sharedCalendarEvents.map(e => ({
      subject: e.subject,
      showAs: e.showAs,
      type: e.type,
      start: e.start.dateTime,
      end: e.end.dateTime
    })));

    // Filter for events that represent available slots
    const availabilityEvents = sharedCalendarEvents.filter(event =>
      event.subject?.includes(availabilityPattern) &&
      (event.showAs === 'free' || event.showAs === 'tentative')
    );

    console.log(`[Availability] Found ${availabilityEvents.length} availability events matching pattern "${availabilityPattern}"`);

    // Process each availability event
    for (const event of availabilityEvents) {
      const eventStart = parseISO(event.start.dateTime);
      const eventEnd = parseISO(event.end.dateTime);

      console.log(`[Processing] ${event.subject} on ${format(eventStart, 'yyyy-MM-dd HH:mm')}`);

      // If the available slot is longer than the service duration,
      // we can offer multiple booking times within it
      const slotDuration = Math.round((eventEnd.getTime() - eventStart.getTime()) / 60000);

      if (slotDuration >= serviceDuration) {
        // Generate booking slots within this availability window
        const bookingSlots = generateBookingSlotsWithinWindow(
          eventStart,
          eventEnd,
          serviceDuration
        );

        console.log(`  - Generated ${bookingSlots.length} potential slots, checking each individually...`);

        // Check availability for each individual slot
        for (const slot of bookingSlots) {
          const sharedAvailable = await isTimeSlotAvailable(
            sharedMailboxEmail,
            slot.start,
            slot.end
          );

          const staffAvailable = await isTimeSlotAvailable(
            staffEmail,
            slot.start,
            slot.end
          );

          console.log(`    - Slot ${format(slot.start, 'HH:mm')}-${format(slot.end, 'HH:mm')}: shared=${sharedAvailable}, staff=${staffAvailable}`);

          if (sharedAvailable && staffAvailable) {
            availableSlots.push({
              ...slot,
              isRecurring: event.type === 'occurrence' || event.type === 'seriesMaster',
              recurringId: event.id
            });
          }
        }
      }
    }

    // Sort slots by start time
    availableSlots.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Filter out slots on the current day (only show tomorrow onwards)
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const futureSlots = availableSlots.filter(slot => slot.start >= tomorrow);

    console.log(`[Availability] Generated ${availableSlots.length} total available slots, ${futureSlots.length} after filtering out today`);

    return futureSlots;
  } catch (error) {
    console.error('Error getting available slots:', error);
    throw error;
  }
}

/**
 * Generate booking slots within an availability window
 */
function generateBookingSlotsWithinWindow(
  windowStart: Date,
  windowEnd: Date,
  serviceDuration: number,
  intervalMinutes: number = 30
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  let currentSlotStart = new Date(windowStart);

  while (currentSlotStart < windowEnd) {
    const currentSlotEnd = addMinutes(currentSlotStart, serviceDuration);

    // Ensure the slot fits within the window
    if (currentSlotEnd <= windowEnd) {
      slots.push({
        start: new Date(currentSlotStart),
        end: new Date(currentSlotEnd),
        duration: serviceDuration,
        isRecurring: false
      });
    }

    // Move to next potential slot
    currentSlotStart = addMinutes(currentSlotStart, intervalMinutes);
  }

  return slots;
}

/**
 * Get available slots based on recurring patterns
 */
export async function getRecurringAvailableSlots(
  sharedMailboxEmail: string,
  staffEmail: string,
  startDate: Date,
  endDate: Date,
  serviceDuration: number
): Promise<AvailableSlot[]> {
  const slots: AvailableSlot[] = [];

  try {
    // Get recurring availability patterns from shared mailbox
    const recurringSlots = await getRecurringMeetings(
      sharedMailboxEmail,
      startDate,
      endDate,
      'Available'
    );

    // Process each day in the date range
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
      const dayOfWeek = format(currentDate, 'EEEE').toLowerCase();

      // Find recurring patterns for this day
      const dayPatterns = recurringSlots.filter(pattern =>
        pattern.daysOfWeek.includes(dayOfWeek)
      );

      for (const pattern of dayPatterns) {
        // Parse the time from the pattern
        const [startHour, startMinute] = pattern.startTime.split(':').map(Number);
        const [endHour, endMinute] = pattern.endTime.split(':').map(Number);

        const slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMinute, 0, 0);

        const slotEnd = new Date(currentDate);
        slotEnd.setHours(endHour, endMinute, 0, 0);

        // Generate booking slots within this recurring window
        const bookingSlots = generateBookingSlotsWithinWindow(
          slotStart,
          slotEnd,
          serviceDuration
        );

        // Check availability for each slot
        for (const slot of bookingSlots) {
          const sharedAvailable = await isTimeSlotAvailable(
            sharedMailboxEmail,
            slot.start,
            slot.end
          );

          const staffAvailable = await isTimeSlotAvailable(
            staffEmail,
            slot.start,
            slot.end
          );

          if (sharedAvailable && staffAvailable && slot.start >= new Date()) {
            slots.push({
              ...slot,
              isRecurring: true,
              recurringId: pattern.seriesMasterId
            });
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sort by start time
    slots.sort((a, b) => a.start.getTime() - b.start.getTime());

    return slots;
  } catch (error) {
    console.error('Error getting recurring available slots:', error);
    throw error;
  }
}

/**
 * Quick availability check for a specific time slot
 */
export async function checkSlotAvailability(
  sharedMailboxEmail: string,
  staffEmail: string,
  startTime: Date,
  endTime: Date
): Promise<{ available: boolean; reason?: string }> {
  try {
    // Check shared mailbox availability
    const sharedAvailable = await isTimeSlotAvailable(
      sharedMailboxEmail,
      startTime,
      endTime
    );

    if (!sharedAvailable) {
      return {
        available: false,
        reason: 'Time slot is not available in the shared calendar'
      };
    }

    // Check staff availability
    const staffAvailable = await isTimeSlotAvailable(
      staffEmail,
      startTime,
      endTime
    );

    if (!staffAvailable) {
      return {
        available: false,
        reason: 'Staff member is not available at this time'
      };
    }

    return { available: true };
  } catch (error) {
    console.error('Error checking slot availability:', error);
    return {
      available: false,
      reason: 'Error checking availability'
    };
  }
}

/**
 * Find the next available slot from current time
 */
export async function getNextAvailableSlot(
  sharedMailboxEmail: string,
  staffEmail: string,
  serviceDuration: number,
  maxDaysAhead: number = 14
): Promise<AvailableSlot | null> {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + maxDaysAhead);

  const slots = await getAvailableSlots(
    sharedMailboxEmail,
    staffEmail,
    startDate,
    endDate,
    serviceDuration
  );

  return slots.length > 0 ? slots[0] : null;
}

/**
 * Get availability summary for a date range
 */
export async function getAvailabilitySummary(
  sharedMailboxEmail: string,
  staffEmail: string,
  startDate: Date,
  endDate: Date,
  serviceDuration: number
): Promise<{
  totalSlots: number;
  availableByDate: Map<string, AvailableSlot[]>;
  nextAvailable: AvailableSlot | null;
}> {
  const slots = await getAvailableSlots(
    sharedMailboxEmail,
    staffEmail,
    startDate,
    endDate,
    serviceDuration
  );

  const availableByDate = new Map<string, AvailableSlot[]>();

  for (const slot of slots) {
    const dateKey = format(slot.start, 'yyyy-MM-dd');
    if (!availableByDate.has(dateKey)) {
      availableByDate.set(dateKey, []);
    }
    availableByDate.get(dateKey)!.push(slot);
  }

  return {
    totalSlots: slots.length,
    availableByDate,
    nextAvailable: slots.length > 0 ? slots[0] : null
  };
}