/**
 * Microsoft Graph API Service
 * This service handles all interactions with Microsoft Graph API
 * including Bookings, Calendar, and Teams integration
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import logger from '../utils/logger';

// Types for our booking system
export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface BookingRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  start: Date;
  end: Date;
  notes?: string;
  isDigital: boolean;
}

export interface BookingResponse {
  id: string;
  customerName: string;
  customerEmail: string;
  start: Date;
  end: Date;
  joinUrl?: string; // Teams meeting link for digital meetings
  location?: string; // Physical location for in-person meetings
}

class GraphApiService {
  private graphClient: Client | null = null;
  private msalClient: ConfidentialClientApplication | null = null;
  private bookingBusinessId: string;

  constructor() {
    // Get booking business ID from environment variable
    this.bookingBusinessId = process.env.BOOKING_BUSINESS_ID || '';
    if (!this.bookingBusinessId) {
      logger.error('BOOKING_BUSINESS_ID environment variable is not set');
      throw new Error('BOOKING_BUSINESS_ID environment variable is required');
    }
    logger.info('GraphApiService initialized with business ID:', this.bookingBusinessId);
  }

  /**
   * Initialize MSAL client lazily
   */
  private initMsalClient(): void {
    if (this.msalClient) return;

    // Only initialize if we have real credentials
    const clientId = process.env.AZURE_CLIENT_ID;
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!clientId || !tenantId || !clientSecret ||
        clientId === 'placeholder-client-id' ||
        clientSecret === 'placeholder-client-secret') {
      logger.warn('Azure AD credentials not configured. Graph API calls will fail.');
      return;
    }

    const msalConfig = {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret
      }
    };

    this.msalClient = new ConfidentialClientApplication(msalConfig);
  }

  /**
   * Initialize the Graph API client with authentication
   */
  private async initializeClient(): Promise<void> {
    if (this.graphClient) return;

    // Initialize MSAL client if needed
    this.initMsalClient();

    if (!this.msalClient) {
      throw new Error('Azure AD credentials not configured. Please set AZURE_CLIENT_ID, AZURE_TENANT_ID, and AZURE_CLIENT_SECRET.');
    }

    try {
      // Get an access token
      const authResult = await this.msalClient.acquireTokenByClientCredential({
        scopes: ['https://graph.microsoft.com/.default']
      });

      if (!authResult) {
        throw new Error('Failed to acquire token');
      }

      // Create Graph client with the access token
      this.graphClient = Client.init({
        authProvider: (done) => {
          done(null, authResult.accessToken);
        }
      });

      logger.info('Graph API client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Graph API client:', error);
      throw error;
    }
  }

  /**
   * Get staff members for the booking business
   * Note: The Microsoft Graph Bookings API staffMembers endpoint has known issues
   * with Application permissions that cause UnknownError responses.
   * This is a documented Microsoft API limitation.
   */
  async getStaffMembers(): Promise<any[]> {
    await this.initializeClient();

    try {
      const response = await this.graphClient!
        .api(`/solutions/bookingBusinesses/${this.bookingBusinessId}/staffMembers`)
        .get();

      const staffMembers = response.value || [];

      // Log full staff member objects to see what data is available
      if (staffMembers.length > 0) {
        logger.info('Staff member details:', JSON.stringify(staffMembers, null, 2));
      }

      return staffMembers;
    } catch (error: any) {
      // The staffMembers endpoint is known to fail with UnknownError in Microsoft Graph
      // This is a Microsoft API issue, not a code issue
      logger.warn('Microsoft Graph staffMembers endpoint failed (known API issue):', error.code);

      // Return empty array instead of throwing to prevent the entire request from failing
      return [];
    }
  }

  /**
   * Get calendar events for a staff member directly from their Outlook calendar
   */
  private async getCalendarEvents(
    emailAddress: string,
    startDateTime: Date,
    endDateTime: Date
  ): Promise<any[]> {
    await this.initializeClient();

    try {
      const formatDateTime = (date: Date) => {
        return date.toISOString();
      };

      logger.info(`Getting calendar events for ${emailAddress} from ${startDateTime.toISOString()} to ${endDateTime.toISOString()}`);

      // Get calendar events directly from the user's calendar
      const response = await this.graphClient!
        .api(`/users/${emailAddress}/calendar/calendarView`)
        .query({
          startDateTime: formatDateTime(startDateTime),
          endDateTime: formatDateTime(endDateTime)
        })
        .select('subject,start,end,isAllDay,isCancelled,showAs')
        .top(100)
        .get();

      const events = response.value || [];
      logger.info(`Found ${events.length} calendar events for ${emailAddress}`);

      // Filter to only include events that block time (busy, oof, tentative)
      const busyEvents = events.filter((event: any) =>
        !event.isCancelled &&
        (event.showAs === 'busy' || event.showAs === 'oof' || event.showAs === 'tentative')
      );

      logger.info(`${busyEvents.length} events are blocking time`);

      return busyEvents;
    } catch (error) {
      logger.error('Error getting calendar events:', error);
      throw error;
    }
  }

  /**
   * Get available time slots for booking by checking staff calendar and existing bookings
   */
  async getAvailableTimeSlots(
    serviceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSlot[]> {
    try {
      await this.initializeClient();
      logger.info(`Getting available time slots for service ${serviceId} on ${startDate.toDateString()}`);

      // Get the service details to know the duration
      const services = await this.getServices();
      const service = services.find((s: any) => s.id === serviceId);

      if (!service) {
        logger.error(`Service ${serviceId} not found`);
        throw new Error('Service not found');
      }

      // Get service duration in minutes (defaultDuration is in ISO 8601 format)
      // Examples: "PT30M" = 30 minutes, "PT1H" = 60 minutes, "PT1H30M" = 90 minutes
      const duration = service.defaultDuration || 'PT30M';
      const hours = duration.match(/(\d+)H/);
      const minutes = duration.match(/(\d+)M/);
      const serviceDurationMinutes = (hours ? parseInt(hours[1]) * 60 : 0) + (minutes ? parseInt(minutes[1]) : 0);

      logger.info(`Service duration: ${serviceDurationMinutes} minutes`);

      // Get all staff members
      const staffMembers = await this.getStaffMembers();

      if (staffMembers.length === 0) {
        logger.warn('No staff members found');
        return [];
      }

      // Extract email addresses from staff members
      const staffEmails = staffMembers
        .map((staff: any) => staff.emailAddress || staff.email || staff.userPrincipalName)
        .filter((email: string | undefined) => email !== undefined && email !== null);

      logger.info(`Found ${staffEmails.length} staff emails out of ${staffMembers.length} staff members`);

      if (staffEmails.length === 0) {
        logger.warn('No staff emails found');
        return [];
      }

      // For simplicity, use the first staff member's calendar
      const staffEmail = staffEmails[0];

      // Get existing bookings for this date to avoid double-booking
      const existingBookings = await this.getBookingsForDate(startDate, endDate);
      logger.info(`Found ${existingBookings.length} existing bookings for this date`);

      // Collect all busy periods (calendar events + existing bookings)
      const busyPeriods: Array<{ start: Date; end: Date }> = [];

      // Add existing bookings to busy periods
      existingBookings.forEach((booking: any) => {
        const startTime = booking.startDateTime?.dateTime || booking.start?.dateTime;
        const endTime = booking.endDateTime?.dateTime || booking.end?.dateTime;

        if (startTime && endTime) {
          busyPeriods.push({
            start: new Date(startTime),
            end: new Date(endTime)
          });
        }
      });

      // Try to get calendar events
      try {
        const calendarEvents = await this.getCalendarEvents(staffEmail, startDate, endDate);

        // Add calendar events to busy periods
        calendarEvents.forEach((event: any) => {
          busyPeriods.push({
            start: new Date(event.start.dateTime),
            end: new Date(event.end.dateTime)
          });
        });

        logger.info(`Total busy periods: ${busyPeriods.length} (${existingBookings.length} bookings + ${calendarEvents.length} calendar events)`);
      } catch (calendarError: any) {
        logger.warn('Could not access calendar, using only existing bookings for availability');
      }

      // Generate time slots based on the service duration
      const allSlots = this.generateTimeSlots(startDate, endDate, serviceDurationMinutes);

      logger.info(`Generated ${allSlots.length} potential time slots for ${serviceDurationMinutes}-minute service`);

      // Get current time in CET/CEST timezone
      const now = new Date();

      // Filter out slots that overlap with any busy period OR are in the past
      const availableSlots = allSlots.filter(slot => {
        // Filter out past time slots - slot must start in the future
        if (slot.start <= now) {
          return false;
        }

        // Check if this slot overlaps with any busy period
        const hasConflict = busyPeriods.some((busy) => {
          // Check for overlap: slot starts before busy ends AND slot ends after busy starts
          return slot.start < busy.end && slot.end > busy.start;
        });

        return !hasConflict; // Only include slots without conflicts
      });

      logger.info(`Found ${availableSlots.length} available slots after filtering conflicts and past times`);
      return availableSlots;

    } catch (error) {
      logger.error('Error getting available time slots:', error);
      throw error;
    }
  }

  /**
   * Get existing bookings for a date range
   */
  private async getBookingsForDate(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      // Get all appointments for the booking business
      // Note: The Bookings API doesn't support complex filtering, so we get all and filter in memory
      const response = await this.graphClient!
        .api(`/solutions/bookingBusinesses/${this.bookingBusinessId}/appointments`)
        .top(100)
        .get();

      const allBookings = response.value || [];

      // Filter bookings that fall within our date range
      const filteredBookings = allBookings.filter((booking: any) => {
        const bookingStart = new Date(booking.startDateTime?.dateTime || booking.start?.dateTime);
        const bookingEnd = new Date(booking.endDateTime?.dateTime || booking.end?.dateTime);

        // Check if booking overlaps with our date range
        return bookingStart < endDate && bookingEnd > startDate;
      });

      logger.info(`Filtered ${filteredBookings.length} bookings from ${allBookings.length} total bookings for date range ${startDate.toISOString()} to ${endDate.toISOString()}`);

      return filteredBookings;
    } catch (error) {
      logger.error('Error getting existing bookings:', error);
      return []; // Return empty array if we can't get bookings
    }
  }

  /**
   * Generate time slots within a date range
   */
  private generateTimeSlots(startDate: Date, endDate: Date, intervalMinutes: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const current = new Date(startDate);

    // Business hours: 9 AM to 5 PM
    const businessStartHour = 9;
    const businessEndHour = 17;

    while (current < endDate) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + intervalMinutes * 60 * 1000);

      // Only include slots during business hours
      if (
        slotStart.getHours() >= businessStartHour &&
        slotEnd.getHours() <= businessEndHour &&
        slotEnd <= endDate
      ) {
        slots.push({
          start: slotStart,
          end: slotEnd,
          available: true
        });
      }

      current.setTime(current.getTime() + intervalMinutes * 60 * 1000);
    }

    return slots;
  }

  /**
   * Remove duplicate time slots that have the same start and end times
   */
  private deduplicateSlots(slots: TimeSlot[]): TimeSlot[] {
    const uniqueMap = new Map<string, TimeSlot>();

    for (const slot of slots) {
      const key = `${slot.start.toISOString()}-${slot.end.toISOString()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, slot);
      }
    }

    return Array.from(uniqueMap.values()).sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  /**
   * Create a new booking in Microsoft Bookings
   * This creates the appointment and generates Teams meeting if needed
   */
  async createBooking(bookingRequest: BookingRequest): Promise<BookingResponse> {
    try {
      await this.initializeClient();

      // Format datetime for Copenhagen timezone
      // The dates come in as UTC from the frontend
      // Microsoft Graph expects local time format (without 'Z') when timezone is specified
      // Since the times are already in UTC, we keep them as-is but format without 'Z'
      const formatDateTimeForBooking = (date: Date) => {
        // Convert UTC to Copenhagen local time offset (+01:00 or +02:00 depending on DST)
        // For simplicity, we'll send as UTC and let Graph API handle the timezone conversion
        // Format: "2024-01-15T14:30:00" (no 'Z', no offset)
        const isoString = date.toISOString();
        return isoString.substring(0, 19); // Remove 'Z' and milliseconds
      };

      // Prepare the booking data for Microsoft Bookings API
      const appointmentData: any = {
        "@odata.type": "#microsoft.graph.bookingAppointment",
        customerName: bookingRequest.customerName,
        customerEmailAddress: bookingRequest.customerEmail,
        customerPhone: bookingRequest.customerPhone,
        serviceId: bookingRequest.serviceId,
        startDateTime: {
          "@odata.type": "#microsoft.graph.dateTimeTimeZone",
          dateTime: formatDateTimeForBooking(bookingRequest.start),
          timeZone: 'W. Europe Standard Time'
        },
        endDateTime: {
          "@odata.type": "#microsoft.graph.dateTimeTimeZone",
          dateTime: formatDateTimeForBooking(bookingRequest.end),
          timeZone: 'W. Europe Standard Time'
        },
        customerNotes: bookingRequest.notes
      };

      // If it's a digital meeting, request online meeting
      if (bookingRequest.isDigital) {
        appointmentData.isLocationOnline = true;
      }

      try {
        // Create the appointment in Microsoft Bookings
        const appointment = await this.graphClient!
          .api(`/solutions/bookingBusinesses/${this.bookingBusinessId}/appointments`)
          .post(appointmentData);

        logger.info(`Booking created successfully: ${appointment.id}`);

        // Return the booking confirmation
        return {
          id: appointment.id,
          customerName: appointment.customerName,
          customerEmail: appointment.customerEmailAddress,
          start: new Date(appointment.startDateTime.dateTime),
          end: new Date(appointment.endDateTime.dateTime),
          joinUrl: appointment.joinWebUrl, // Teams meeting link
          location: appointment.serviceLocation?.address?.street
        };
      } catch (graphError: any) {
        logger.error('Microsoft Bookings API error:', {
          message: graphError.message,
          code: graphError.code,
          statusCode: graphError.statusCode,
          requestData: appointmentData,
          businessId: this.bookingBusinessId,
          error: graphError
        });
        throw graphError;
      }
    } catch (error) {
      logger.error('Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Get booking details by ID
   */
  async getBookingById(bookingId: string): Promise<any> {
    await this.initializeClient();

    try {
      const appointment = await this.graphClient!
        .api(`/solutions/bookingBusinesses/${this.bookingBusinessId}/appointments/${bookingId}`)
        .get();

      // Transform the appointment data to match our interface
      return {
        id: appointment.id,
        customerName: appointment.customerName || appointment.customers?.[0]?.name,
        customerEmail: appointment.customerEmailAddress || appointment.customers?.[0]?.emailAddress,
        customerPhone: appointment.customerPhone || appointment.customers?.[0]?.phone,
        serviceId: appointment.serviceId,
        serviceName: appointment.service?.displayName,
        start: new Date(appointment.start.dateTime),
        end: new Date(appointment.end.dateTime),
        status: appointment.appointmentLabel || 'confirmed',
        notes: appointment.customerNotes,
        joinUrl: appointment.joinWebUrl,
        location: appointment.serviceLocation?.address?.street || appointment.serviceLocation?.displayName,
        isOnline: appointment.isLocationOnline,
        createdDateTime: appointment.createdDateTime,
        lastUpdatedDateTime: appointment.lastUpdatedDateTime
      };
    } catch (error) {
      logger.error(`Error getting booking ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel an existing booking
   */
  async cancelBooking(bookingId: string): Promise<void> {
    await this.initializeClient();

    try {
      await this.graphClient!
        .api(`/solutions/bookingBusinesses/${this.bookingBusinessId}/appointments/${bookingId}/cancel`)
        .post({
          cancellationMessage: 'Booking cancelled by customer'
        });

      logger.info(`Booking ${bookingId} cancelled successfully`);
    } catch (error) {
      logger.error('Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * Assign staff members to a booking
   */
  async assignStaffToBooking(bookingId: string, staffMemberIds: string[]): Promise<void> {
    await this.initializeClient();

    try {
      await this.graphClient!
        .api(`/solutions/bookingBusinesses/${this.bookingBusinessId}/appointments/${bookingId}`)
        .patch({
          '@odata.type': '#microsoft.graph.bookingAppointment',
          staffMemberIds: staffMemberIds
        });

      logger.info(`Staff assigned to booking ${bookingId}: ${staffMemberIds.join(', ')}`);
    } catch (error) {
      logger.error('Error assigning staff to booking:', error);
      throw error;
    }
  }

  /**
   * Get list of available services from Microsoft Bookings
   */
  async getServices(): Promise<any[]> {
    await this.initializeClient();

    try {
      const response = await this.graphClient!
        .api(`/solutions/bookingBusinesses/${this.bookingBusinessId}/services`)
        .get();

      return response.value || [];
    } catch (error) {
      logger.error('Error getting services:', error);
      throw error;
    }
  }

  /**
   * Debug: Get all booking businesses available to this app
   */
  async getBookingBusinesses(): Promise<any[]> {
    await this.initializeClient();

    try {
      const response = await this.graphClient!
        .api('/solutions/bookingBusinesses')
        .get();

      logger.info('Available booking businesses:', response.value);
      return response.value || [];
    } catch (error) {
      logger.error('Error getting booking businesses:', error);
      throw error;
    }
  }

  /**
   * Debug: Get specific business details
   */
  async getBusinessDetails(businessId?: string): Promise<any> {
    await this.initializeClient();
    const id = businessId || this.bookingBusinessId;

    try {
      const response = await this.graphClient!
        .api(`/solutions/bookingBusinesses/${id}`)
        .get();

      logger.info(`Business details for ${id}:`, response);
      return response;
    } catch (error) {
      logger.error(`Error getting business details for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Admin: Get all bookings with filtering and pagination
   */
  async getAllBookings(filters: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    customerEmail?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    try {
      await this.initializeClient();

      // Build query parameters for Microsoft Graph API
      // Note: We fetch ALL bookings and then filter/paginate in memory
      // because we need to filter out past bookings after fetching
      let query = `/solutions/bookingBusinesses/${this.bookingBusinessId}/appointments`;
      const queryParams: string[] = [];

      if (filters.startDate) {
        queryParams.push(`$filter=start/dateTime ge '${filters.startDate.toISOString()}'`);
      }

      if (filters.endDate) {
        if (queryParams.length > 0) {
          queryParams[0] += ` and end/dateTime le '${filters.endDate.toISOString()}'`;
        } else {
          queryParams.push(`$filter=end/dateTime le '${filters.endDate.toISOString()}'`);
        }
      }

      // Fetch a large number to ensure we get all bookings for proper pagination
      queryParams.push(`$top=500`);

      if (queryParams.length > 0) {
        query += '?' + queryParams.join('&');
      }

      try {
        const response = await this.graphClient!
          .api(query)
          .get();

        // Fetch all services to map serviceId to serviceName
        const services = await this.getServices();
        const serviceMap = new Map(services.map((s: any) => [s.id, s.displayName]));

        // Fetch all staff members to map staffMemberIds to staff names
        const staffMembers = await this.getStaffMembers();
        const staffMap = new Map(staffMembers.map((s: any) => [s.id, s.displayName]));

        // Transform data for frontend
        const bookings = response.value?.map((appointment: any) => {
          // Handle both start/end and startDateTime/endDateTime formats
          const startTime = appointment.start?.dateTime || appointment.startDateTime?.dateTime;
          const endTime = appointment.end?.dateTime || appointment.endDateTime?.dateTime;

          // Get staff member names from IDs
          const staffMemberIds = appointment.staffMemberIds || [];
          const assignedStaff = staffMemberIds
            .map((id: string) => ({
              id,
              name: staffMap.get(id) || 'Unknown Staff'
            }))
            .filter((staff: any) => staff.name !== 'Unknown Staff');

          return {
            id: appointment.id,
            customerName: appointment.customerName || appointment.customers?.[0]?.name,
            customerEmail: appointment.customerEmailAddress || appointment.customers?.[0]?.emailAddress,
            customerPhone: appointment.customerPhone || appointment.customers?.[0]?.phone,
            serviceId: appointment.serviceId,
            serviceName: serviceMap.get(appointment.serviceId) || 'Unknown Service',
            start: startTime ? new Date(startTime) : null,
            end: endTime ? new Date(endTime) : null,
            status: appointment.appointmentLabel || 'confirmed',
            notes: appointment.customerNotes,
            joinUrl: appointment.joinWebUrl,
            location: appointment.serviceLocation?.address?.street || appointment.serviceLocation?.displayName,
            isOnline: appointment.isLocationOnline,
            createdDateTime: appointment.createdDateTime,
            lastUpdatedDateTime: appointment.lastUpdatedDateTime,
            staffMemberIds: staffMemberIds,
            assignedStaff: assignedStaff
          };
        }).filter((booking: any) => booking.start && booking.end) || [];

        // Apply client-side filtering for email if Graph API doesn't support it
        let filteredBookings = bookings;

        // Filter out past bookings (where end time is before current time)
        const now = new Date();
        filteredBookings = filteredBookings.filter((booking: any) =>
          booking.end && new Date(booking.end) > now
        );

        if (filters.customerEmail) {
          filteredBookings = filteredBookings.filter((booking: any) =>
            booking.customerEmail?.toLowerCase().includes(filters.customerEmail!.toLowerCase())
          );
        }

        if (filters.status) {
          filteredBookings = filteredBookings.filter((booking: any) =>
            booking.status?.toLowerCase() === filters.status!.toLowerCase()
          );
        }

        // Sort by start datetime (earliest first)
        filteredBookings.sort((a: any, b: any) => {
          const dateA = new Date(a.start).getTime();
          const dateB = new Date(b.start).getTime();
          return dateA - dateB;
        });

        // Apply pagination if needed
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const startIndex = (page - 1) * limit;
        const paginatedBookings = filteredBookings.slice(startIndex, startIndex + limit);

        return {
          bookings: paginatedBookings,
          pagination: {
            page,
            limit,
            total: filteredBookings.length,
            totalPages: Math.ceil(filteredBookings.length / limit)
          }
        };

      } catch (graphError: any) {
        logger.error('Microsoft Graph API error:', graphError.message);
        throw graphError;
      }
    } catch (error) {
      logger.error('Error getting all bookings:', error);
      throw error;
    }
  }

  /**
   * Admin: Get booking statistics
   */
  async getBookingStats(filters: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    try {
      await this.initializeClient();

      // Get all bookings within the date range
      const bookingsData = await this.getAllBookings({
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: 1000 // Get a large number to calculate stats
      });

      const bookings = bookingsData.bookings;

      // Calculate real statistics from actual bookings
      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed').length;
      const cancelledBookings = bookings.filter((b: any) => b.status === 'cancelled').length;
      const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const bookingsToday = bookings.filter((b: any) => {
        const bookingDate = new Date(b.start);
        return bookingDate >= today && bookingDate < tomorrow;
      }).length;

      // Calculate popular time slots
      const timeSlotCounts: { [key: string]: number } = {};
      bookings.forEach((b: any) => {
        const hour = new Date(b.start).getHours();
        const timeKey = `${hour.toString().padStart(2, '0')}:00`;
        timeSlotCounts[timeKey] = (timeSlotCounts[timeKey] || 0) + 1;
      });

      const popularTimeSlots = Object.entries(timeSlotCounts)
        .map(([time, count]) => ({ time, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate popular services
      const serviceCounts: { [key: string]: { name: string, count: number } } = {};
      bookings.forEach((b: any) => {
        if (b.serviceId && b.serviceName) {
          if (!serviceCounts[b.serviceId]) {
            serviceCounts[b.serviceId] = { name: b.serviceName, count: 0 };
          }
          serviceCounts[b.serviceId].count++;
        }
      });

      const popularServices = Object.entries(serviceCounts)
        .map(([serviceId, data]) => ({ serviceId, name: data.name, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      return {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        pendingBookings,
        bookingsToday,
        popularTimeSlots,
        popularServices
      };
    } catch (error) {
      logger.error('Error getting booking stats:', error);
      throw error;
    }
  }

}

export default new GraphApiService(); 
