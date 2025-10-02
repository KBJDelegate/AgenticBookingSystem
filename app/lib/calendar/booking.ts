import { createCalendarBooking, cancelCalendarBooking, getCalendarEvents } from './service';
import { checkSlotAvailability } from './availability';
import { parseISO, format } from 'date-fns';
import { getGraphClient } from '@/lib/graph/client';

export interface BookingDetails {
  id: string;
  sharedEventId: string;
  staffEventId: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startTime: Date;
  endTime: Date;
  sharedMailbox: string;
  staffEmail: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  createdAt: Date;
}

export interface CreateBookingInput {
  sharedMailboxEmail: string;
  staffEmail: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

// In-memory storage for booking mappings (in production, use a database)
const bookingMappings = new Map<string, BookingDetails>();

/**
 * Create a new booking in the calendar system
 */
export async function createBooking(input: CreateBookingInput): Promise<BookingDetails> {
  const {
    sharedMailboxEmail,
    staffEmail,
    serviceName,
    customerName,
    customerEmail,
    customerPhone,
    startTime,
    endTime,
    notes
  } = input;

  // Verify the slot is still available
  const availability = await checkSlotAvailability(
    sharedMailboxEmail,
    staffEmail,
    startTime,
    endTime
  );

  if (!availability.available) {
    throw new Error(`Booking failed: ${availability.reason || 'Slot is no longer available'}`);
  }

  try {
    // Create the calendar events
    const { sharedEventId, staffEventId } = await createCalendarBooking(
      sharedMailboxEmail,
      staffEmail,
      customerName,
      customerEmail,
      customerPhone,
      serviceName,
      startTime,
      endTime
    );

    // Generate a unique booking ID
    const bookingId = generateBookingId();

    // Store the booking details
    const bookingDetails: BookingDetails = {
      id: bookingId,
      sharedEventId,
      staffEventId,
      serviceName,
      customerName,
      customerEmail,
      customerPhone,
      startTime,
      endTime,
      sharedMailbox: sharedMailboxEmail,
      staffEmail,
      status: 'confirmed',
      createdAt: new Date()
    };

    bookingMappings.set(bookingId, bookingDetails);

    // Send confirmation email (optional)
    await sendBookingConfirmation(bookingDetails);

    console.log(`✓ Booking created successfully: ${bookingId}`);
    return bookingDetails;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw new Error('Failed to create booking');
  }
}

/**
 * Cancel an existing booking
 */
export async function cancelBooking(
  bookingId: string,
  cancellationReason?: string
): Promise<void> {
  const booking = bookingMappings.get(bookingId);

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status === 'cancelled') {
    throw new Error('Booking is already cancelled');
  }

  try {
    // Cancel the calendar events
    await cancelCalendarBooking(
      booking.sharedMailbox,
      booking.staffEmail,
      booking.sharedEventId,
      booking.staffEventId,
      cancellationReason
    );

    // Update booking status
    booking.status = 'cancelled';
    bookingMappings.set(bookingId, booking);

    // Send cancellation email (optional)
    await sendCancellationEmail(booking, cancellationReason);

    console.log(`✓ Booking cancelled successfully: ${bookingId}`);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw new Error('Failed to cancel booking');
  }
}

/**
 * Get booking details by ID
 */
export function getBookingById(bookingId: string): BookingDetails | null {
  return bookingMappings.get(bookingId) || null;
}

/**
 * Get all bookings for a customer
 */
export async function getCustomerBookings(
  customerEmail: string,
  sharedMailboxEmail: string,
  startDate?: Date,
  endDate?: Date
): Promise<BookingDetails[]> {
  const bookings: BookingDetails[] = [];

  // If no date range specified, use default range
  if (!startDate) {
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1); // 1 month ago
  }

  if (!endDate) {
    endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // 3 months ahead
  }

  try {
    // Get events from the shared calendar
    const events = await getCalendarEvents(
      sharedMailboxEmail,
      startDate,
      endDate,
      false
    );

    // Filter events for this customer
    for (const event of events) {
      if (event.attendees) {
        const isCustomerAttending = event.attendees.some(
          (attendee: any) =>
            attendee.emailAddress?.address?.toLowerCase() === customerEmail.toLowerCase()
        );

        if (isCustomerAttending && event.showAs === 'busy') {
          // Try to find the booking in our mappings
          let bookingDetails = findBookingByEventId(event.id);

          if (!bookingDetails) {
            // Create a booking details object from the calendar event
            bookingDetails = {
              id: event.id,
              sharedEventId: event.id,
              staffEventId: '', // Unknown from this context
              serviceName: extractServiceName(event.subject),
              customerName: extractCustomerName(event.subject),
              customerEmail,
              startTime: parseISO(event.start.dateTime),
              endTime: parseISO(event.end.dateTime),
              sharedMailbox: sharedMailboxEmail,
              staffEmail: extractStaffEmail(event.attendees),
              status: 'confirmed',
              createdAt: new Date() // Unknown actual creation date
            };
          }

          bookings.push(bookingDetails);
        }
      }
    }

    return bookings;
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    throw error;
  }
}

/**
 * Get bookings for a specific staff member
 */
export async function getStaffBookings(
  staffEmail: string,
  startDate: Date,
  endDate: Date
): Promise<BookingDetails[]> {
  const bookings: BookingDetails[] = [];

  try {
    // Get events from the staff calendar
    const events = await getCalendarEvents(
      staffEmail,
      startDate,
      endDate,
      false
    );

    // Filter for booking events
    for (const event of events) {
      if (event.subject?.includes('[Booking]') && event.showAs === 'busy') {
        // Try to find the booking in our mappings
        let bookingDetails = findBookingByEventId(event.id);

        if (!bookingDetails) {
          // Create a booking details object from the calendar event
          bookingDetails = {
            id: event.id,
            sharedEventId: '', // Unknown from this context
            staffEventId: event.id,
            serviceName: extractServiceName(event.subject),
            customerName: extractCustomerName(event.subject),
            customerEmail: extractCustomerEmail(event.attendees),
            startTime: parseISO(event.start.dateTime),
            endTime: parseISO(event.end.dateTime),
            sharedMailbox: event.location?.displayName || '',
            staffEmail,
            status: 'confirmed',
            createdAt: new Date() // Unknown actual creation date
          };
        }

        bookings.push(bookingDetails);
      }
    }

    return bookings;
  } catch (error) {
    console.error('Error fetching staff bookings:', error);
    throw error;
  }
}

/**
 * Helper function to generate a unique booking ID
 */
function generateBookingId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BK-${timestamp}-${random}`.toUpperCase();
}

/**
 * Helper function to find booking by event ID
 */
function findBookingByEventId(eventId: string): BookingDetails | null {
  for (const [_, booking] of bookingMappings) {
    if (booking.sharedEventId === eventId || booking.staffEventId === eventId) {
      return booking;
    }
  }
  return null;
}

/**
 * Extract service name from event subject
 */
function extractServiceName(subject: string): string {
  // Subject format: "[Booking] ServiceName - CustomerName" or "ServiceName - CustomerName"
  const match = subject.match(/(?:\[Booking\]\s*)?([^-]+)\s*-/);
  return match ? match[1].trim() : 'Unknown Service';
}

/**
 * Extract customer name from event subject
 */
function extractCustomerName(subject: string): string {
  // Subject format: "ServiceName - CustomerName"
  const parts = subject.split('-');
  return parts.length > 1 ? parts[parts.length - 1].trim() : 'Unknown Customer';
}

/**
 * Extract staff email from attendees
 */
function extractStaffEmail(attendees?: any[]): string {
  if (!attendees || attendees.length === 0) return '';
  // Find attendee that isn't the customer
  const staff = attendees.find(
    (attendee: any) =>
      attendee.type === 'required' &&
      !attendee.emailAddress?.address?.includes('@customer') // Adjust based on your domain
  );
  return staff?.emailAddress?.address || '';
}

/**
 * Extract customer email from attendees
 */
function extractCustomerEmail(attendees?: any[]): string {
  if (!attendees || attendees.length === 0) return '';
  // Find the first attendee (usually the customer)
  return attendees[0]?.emailAddress?.address || '';
}

/**
 * Send booking confirmation email
 */
async function sendBookingConfirmation(booking: BookingDetails): Promise<void> {
  const client = getGraphClient();

  const emailContent = {
    message: {
      subject: `Booking Confirmation - ${booking.serviceName}`,
      body: {
        contentType: 'HTML',
        content: `
          <h2>Booking Confirmation</h2>
          <p>Dear ${booking.customerName},</p>
          <p>Your booking has been confirmed with the following details:</p>
          <ul>
            <li><strong>Service:</strong> ${booking.serviceName}</li>
            <li><strong>Date:</strong> ${format(booking.startTime, 'EEEE, MMMM d, yyyy')}</li>
            <li><strong>Time:</strong> ${format(booking.startTime, 'h:mm a')} - ${format(booking.endTime, 'h:mm a')}</li>
            <li><strong>Booking ID:</strong> ${booking.id}</li>
          </ul>
          <p>A calendar invitation has been sent to your email address.</p>
          <p>If you need to cancel or reschedule, please contact us.</p>
          <br>
          <p>Best regards,<br>Your Booking Team</p>
        `
      },
      toRecipients: [
        {
          emailAddress: {
            address: booking.customerEmail
          }
        }
      ]
    },
    saveToSentItems: true
  };

  try {
    await client
      .api(`/users/${booking.sharedMailbox}/sendMail`)
      .post(emailContent);

    console.log(`✓ Confirmation email sent to ${booking.customerEmail}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw - email failure shouldn't fail the booking
  }
}

/**
 * Send cancellation email
 */
async function sendCancellationEmail(
  booking: BookingDetails,
  reason?: string
): Promise<void> {
  const client = getGraphClient();

  const emailContent = {
    message: {
      subject: `Booking Cancellation - ${booking.serviceName}`,
      body: {
        contentType: 'HTML',
        content: `
          <h2>Booking Cancellation</h2>
          <p>Dear ${booking.customerName},</p>
          <p>Your booking has been cancelled:</p>
          <ul>
            <li><strong>Service:</strong> ${booking.serviceName}</li>
            <li><strong>Original Date:</strong> ${format(booking.startTime, 'EEEE, MMMM d, yyyy')}</li>
            <li><strong>Original Time:</strong> ${format(booking.startTime, 'h:mm a')} - ${format(booking.endTime, 'h:mm a')}</li>
            <li><strong>Booking ID:</strong> ${booking.id}</li>
            ${reason ? `<li><strong>Reason:</strong> ${reason}</li>` : ''}
          </ul>
          <p>If you would like to reschedule, please visit our booking page.</p>
          <br>
          <p>Best regards,<br>Your Booking Team</p>
        `
      },
      toRecipients: [
        {
          emailAddress: {
            address: booking.customerEmail
          }
        }
      ]
    },
    saveToSentItems: true
  };

  try {
    await client
      .api(`/users/${booking.sharedMailbox}/sendMail`)
      .post(emailContent);

    console.log(`✓ Cancellation email sent to ${booking.customerEmail}`);
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    // Don't throw - email failure shouldn't fail the cancellation
  }
}

/**
 * Reschedule an existing booking
 */
export async function rescheduleBooking(
  bookingId: string,
  newStartTime: Date,
  newEndTime: Date
): Promise<BookingDetails> {
  const booking = bookingMappings.get(bookingId);

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status === 'cancelled') {
    throw new Error('Cannot reschedule a cancelled booking');
  }

  // Check new slot availability
  const availability = await checkSlotAvailability(
    booking.sharedMailbox,
    booking.staffEmail,
    newStartTime,
    newEndTime
  );

  if (!availability.available) {
    throw new Error(`Rescheduling failed: ${availability.reason || 'New slot is not available'}`);
  }

  try {
    // Cancel old booking
    await cancelCalendarBooking(
      booking.sharedMailbox,
      booking.staffEmail,
      booking.sharedEventId,
      booking.staffEventId,
      'Rescheduled to a new time'
    );

    // Create new booking
    const { sharedEventId, staffEventId } = await createCalendarBooking(
      booking.sharedMailbox,
      booking.staffEmail,
      booking.customerName,
      booking.customerEmail,
      booking.customerPhone,
      booking.serviceName,
      newStartTime,
      newEndTime
    );

    // Update booking details
    booking.sharedEventId = sharedEventId;
    booking.staffEventId = staffEventId;
    booking.startTime = newStartTime;
    booking.endTime = newEndTime;

    bookingMappings.set(bookingId, booking);

    console.log(`✓ Booking rescheduled successfully: ${bookingId}`);
    return booking;
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    throw new Error('Failed to reschedule booking');
  }
}