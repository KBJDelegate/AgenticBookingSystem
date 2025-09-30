/**
 * Booking API Service
 * Handles all API calls from the React frontend to the Node.js backend
 */

import axios, { AxiosInstance } from 'axios';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

// Copenhagen timezone constant
const COPENHAGEN_TIMEZONE = 'Europe/Copenhagen';

// API base URL - can be configured via environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

class BookingApi {
  private api: AxiosInstance;

  constructor() {
    // Create axios instance with default config
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true // For cookie-based auth if needed
    });

    // Request interceptor for auth token
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get available services from Microsoft Bookings
   */
  async getServices(brand: 'B1' | 'B2') {
    try {
      const response = await this.api.get('/services', {
        params: { brand }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  /**
   * Get available time slots for a specific date and service
   */
  async getAvailableSlots(serviceId: string, date: Date) {
    try {
      const response = await this.api.get('/availability', {
        params: {
          serviceId,
          date: utcToZonedTime(date, COPENHAGEN_TIMEZONE).toISOString().split('T')[0] // YYYY-MM-DD format in Copenhagen timezone
        },
        // Disable caching to prevent 304 responses
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(formData: any) {
    try {
      // Format datetime preserving the local Copenhagen time values
      // The Date objects from the form represent Copenhagen local time
      // We need to format them as-is without timezone conversion
      const formatLocalDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      // Prepare booking data as JSON (for now, without file uploads)
      const bookingData = {
        brand: formData.brand || 'B1', // Default to B1 if not provided
        serviceId: formData.serviceId,
        meetingType: formData.meetingType,
        businessPurpose: formData.businessPurpose || false,
        startTime: formatLocalDateTime(formData.startDateTime),
        endTime: formatLocalDateTime(formData.endDateTime),
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        notes: formData.notes || ''
      };

      console.log('Sending booking data:', bookingData);

      const response = await this.api.post('/bookings', bookingData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Get booking details by ID
   */
  async getBooking(bookingId: string) {
    try {
      const response = await this.api.get(`/bookings/${bookingId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string) {
    try {
      const response = await this.api.delete(`/bookings/${bookingId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(
    bookingId: string,
    newStartTime: Date,
    newEndTime: Date
  ) {
    try {
      const response = await this.api.put(`/bookings/${bookingId}/reschedule`, {
        newStartTime: zonedTimeToUtc(newStartTime, COPENHAGEN_TIMEZONE).toISOString(),
        newEndTime: zonedTimeToUtc(newEndTime, COPENHAGEN_TIMEZONE).toISOString()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      throw error;
    }
  }

  /**
   * Validate customer email
   */
  async validateEmail(email: string) {
    try {
      const response = await this.api.post('/validate/email', { email });
      return response.data.valid;
    } catch (error) {
      console.error('Error validating email:', error);
      return false;
    }
  }

  /**
   * Upload documents for a booking
   */
  async uploadDocuments(bookingId: string, files: File[]) {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('documents', file);
      });
      formData.append('bookingId', bookingId);

      const response = await this.api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const bookingApi = new BookingApi();