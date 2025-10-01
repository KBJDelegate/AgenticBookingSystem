import { getGraphClient } from '@/lib/graph/client';

export interface BookingWorkTimeSlot {
  startTime: string; // e.g., "10:00:00.0000000"
  endTime: string;   // e.g., "14:00:00.0000000"
}

export interface BookingWorkHours {
  day: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  timeSlots: BookingWorkTimeSlot[];
}

export interface BookingBusiness {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    countryOrRegion?: string;
    postalCode?: string;
  };
  webSiteUrl?: string;
  defaultCurrencyIso?: string;
  businessHours?: BookingWorkHours[];
}

export interface BookingService {
  id: string;
  displayName: string;
  description?: string;
  defaultDuration?: string;
  defaultPrice?: number;
  defaultPriceType?: string;
  isHiddenFromCustomers?: boolean;
  staffMemberIds?: string[];
}

export interface BookingStaffMember {
  id: string;
  displayName: string;
  emailAddress?: string;
  role?: string;
  useBusinessHours?: boolean;
  availabilityIsAffectedByPersonalCalendar?: boolean;
}

export interface BookingAppointment {
  id: string;
  startDateTime: {
    dateTime: string;
    timeZone: string;
  };
  endDateTime: {
    dateTime: string;
    timeZone: string;
  };
  customerName?: string;
  customerEmailAddress?: string;
  customerPhone?: string;
  serviceId: string;
  serviceName?: string;
  staffMemberIds?: string[];
  optOutOfCustomerEmail?: boolean;
}

/**
 * Get all booking businesses (shared calendars) in the organization
 * https://learn.microsoft.com/en-us/graph/api/bookingbusiness-list
 */
export async function getBookingBusinesses(): Promise<BookingBusiness[]> {
  const client = getGraphClient();

  try {
    const response = await client
      .api('/solutions/bookingBusinesses')
      .get();

    return response.value || [];
  } catch (error) {
    console.error('Error fetching booking businesses:', error);
    throw error;
  }
}

/**
 * Get a specific booking business by ID including business hours
 */
export async function getBookingBusiness(businessId: string): Promise<BookingBusiness> {
  const client = getGraphClient();

  try {
    const response = await client
      .api(`/solutions/bookingBusinesses/${businessId}`)
      .select('id,displayName,email,phone,address,webSiteUrl,defaultCurrencyIso,businessHours')
      .get();

    return response;
  } catch (error) {
    console.error(`Error fetching booking business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Get all services for a specific booking business
 * https://learn.microsoft.com/en-us/graph/api/bookingbusiness-list-services
 */
export async function getBookingServices(businessId: string): Promise<BookingService[]> {
  const client = getGraphClient();

  try {
    const response = await client
      .api(`/solutions/bookingBusinesses/${businessId}/services`)
      .get();

    return response.value || [];
  } catch (error) {
    console.error(`Error fetching services for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Get all staff members for a specific booking business
 * https://learn.microsoft.com/en-us/graph/api/bookingbusiness-list-staffmembers
 */
export async function getBookingStaffMembers(businessId: string): Promise<BookingStaffMember[]> {
  const client = getGraphClient();

  try {
    const response = await client
      .api(`/solutions/bookingBusinesses/${businessId}/staffMembers`)
      .get();

    return response.value || [];
  } catch (error) {
    console.error(`Error fetching staff members for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Get all appointments for a specific booking business
 * https://learn.microsoft.com/en-us/graph/api/bookingbusiness-list-appointments
 */
export async function getBookingAppointments(
  businessId: string,
  startDate?: Date,
  endDate?: Date
): Promise<BookingAppointment[]> {
  const client = getGraphClient();

  try {
    let query = client.api(`/solutions/bookingBusinesses/${businessId}/appointments`);

    // Add date filtering if provided
    if (startDate && endDate) {
      const filter = `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`;
      query = query.filter(filter);
    }

    const response = await query.get();

    return response.value || [];
  } catch (error) {
    console.error(`Error fetching appointments for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Create a new appointment in a booking business
 * https://learn.microsoft.com/en-us/graph/api/bookingbusiness-post-appointments
 */
export async function createBookingAppointment(
  businessId: string,
  appointment: Partial<BookingAppointment>
): Promise<BookingAppointment> {
  const client = getGraphClient();

  try {
    const response = await client
      .api(`/solutions/bookingBusinesses/${businessId}/appointments`)
      .post(appointment);

    return response;
  } catch (error) {
    console.error(`Error creating appointment for business ${businessId}:`, error);
    throw error;
  }
}

/**
 * Cancel a booking appointment
 * https://learn.microsoft.com/en-us/graph/api/bookingappointment-cancel
 */
export async function cancelBookingAppointment(
  businessId: string,
  appointmentId: string,
  cancellationMessage?: string
): Promise<void> {
  const client = getGraphClient();

  try {
    await client
      .api(`/solutions/bookingBusinesses/${businessId}/appointments/${appointmentId}/cancel`)
      .post({
        cancellationMessage: cancellationMessage || 'Appointment cancelled'
      });
  } catch (error) {
    console.error(`Error cancelling appointment ${appointmentId}:`, error);
    throw error;
  }
}

/**
 * Get a specific booking appointment
 * https://learn.microsoft.com/en-us/graph/api/bookingappointment-get
 */
export async function getBookingAppointment(
  businessId: string,
  appointmentId: string
): Promise<BookingAppointment | null> {
  const client = getGraphClient();

  try {
    const response = await client
      .api(`/solutions/bookingBusinesses/${businessId}/appointments/${appointmentId}`)
      .get();
    return response;
  } catch (error: any) {
    // If appointment doesn't exist (deleted/cancelled), return null
    if (error.statusCode === 404) {
      return null;
    }
    console.error(`Error fetching appointment ${appointmentId}:`, error);
    throw error;
  }
}

/**
 * Get staff availability
 * https://learn.microsoft.com/en-us/graph/api/bookingbusiness-getstaffavailability
 */
export async function getStaffAvailability(
  businessId: string,
  staffIds: string[],
  startDateTime: Date,
  endDateTime: Date
): Promise<any> {
  const client = getGraphClient();

  try {
    const response = await client
      .api(`/solutions/bookingBusinesses/${businessId}/getStaffAvailability`)
      .post({
        staffIds,
        startDateTime: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'UTC'
        },
        endDateTime: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'UTC'
        }
      });

    return response;
  } catch (error) {
    console.error(`Error fetching staff availability:`, error);
    throw error;
  }
}
