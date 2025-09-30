/**
 * Microsoft Graph API Service
 * This service handles all interactions with Microsoft Graph API
 * including Bookings, Calendar, and Teams integration
 */

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
    // Temporary fix: hardcode the business ID since env loading isn't working
    this.bookingBusinessId = 'BookingAPIKF@CRM278672.onmicrosoft.com';
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
   * Get available time slots for booking
   * This generates available appointment times based on business hours
   * TODO: Integrate with Microsoft Bookings calendar once staff is configured
   */
  async getAvailableTimeSlots(
    _serviceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSlot[]> {
    // For now, generate available slots based on business hours without MS Graph
    // TODO: Query actual bookings from Microsoft Bookings once staff is configured

    try {
      logger.info(`Generating time slots for ${startDate.toDateString()}`);

      // Generate time slots (1 hour slots during business hours)
      const slots: TimeSlot[] = [];
      const current = new Date(startDate);
      current.setHours(9, 0, 0, 0); // Start at 9 AM

      const dayEnd = new Date(startDate);
      dayEnd.setHours(17, 0, 0, 0); // End at 5 PM

      while (current < dayEnd) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + 60 * 60000); // 1 hour slots

        // Skip lunch hour (12-13)
        if (slotStart.getHours() !== 12) {
          slots.push({
            start: slotStart,
            end: slotEnd,
            available: true
          });
        }

        current.setHours(current.getHours() + 1);
      }

      logger.info(`Generated ${slots.length} available slots for ${startDate.toDateString()}`);
      return slots;
    } catch (error) {
      logger.error('Error getting available time slots:', error);
      throw error;
    }
  }

  /**
   * Create a new booking in Microsoft Bookings
   * This creates the appointment and generates Teams meeting if needed
   */
  async createBooking(bookingRequest: BookingRequest): Promise<BookingResponse> {
    try {
      await this.initializeClient();

      // Prepare the booking data for Microsoft Bookings API
      const appointmentData: any = {
        "@odata.type": "#microsoft.graph.bookingAppointment",
        customerName: bookingRequest.customerName,
        customerEmailAddress: bookingRequest.customerEmail,
        customerPhone: bookingRequest.customerPhone,
        serviceId: bookingRequest.serviceId,
        startDateTime: {
          "@odata.type": "#microsoft.graph.dateTimeTimeZone",
          dateTime: bookingRequest.start.toISOString(),
          timeZone: 'UTC'
        },
        endDateTime: {
          "@odata.type": "#microsoft.graph.dateTimeTimeZone",
          dateTime: bookingRequest.end.toISOString(),
          timeZone: 'UTC'
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

      if (filters.limit) {
        queryParams.push(`$top=${filters.limit}`);
      }

      if (queryParams.length > 0) {
        query += '?' + queryParams.join('&');
      }

      try {
        const response = await this.graphClient!
          .api(query)
          .get();

        // Transform data for frontend
        const bookings = response.value?.map((appointment: any) => ({
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
        })) || [];

        // Apply client-side filtering for email if Graph API doesn't support it
        let filteredBookings = bookings;
        if (filters.customerEmail) {
          filteredBookings = bookings.filter((booking: any) =>
            booking.customerEmail?.toLowerCase().includes(filters.customerEmail!.toLowerCase())
          );
        }

        if (filters.status) {
          filteredBookings = filteredBookings.filter((booking: any) =>
            booking.status?.toLowerCase() === filters.status!.toLowerCase()
          );
        }

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