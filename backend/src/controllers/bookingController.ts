/**
 * Booking Controller
 * Handles all booking-related HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import graphApiService from '../services/graphApiService';
import notificationService from '../services/notificationService';
import documentService from '../services/documentService';
import logger from '../utils/logger';

// Extended Request type for file uploads
interface MulterRequest extends Request {
  files?: any[];
}

export class BookingController {
  /**
   * Create a new booking
   * POST /api/v1/bookings
   */
  async createBooking(req: MulterRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.error('Validation errors:', errors.array());
        logger.error('Request body:', req.body);
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const {
        customerName,
        customerEmail,
        customerPhone,
        serviceId,
        startTime,
        endTime,
        meetingType,
        notes,
        brand // B1 or B2
      } = req.body;

      logger.info(`Creating booking for ${customerEmail}`);

      // Step 1: Get service details to determine the correct duration
      const services = await graphApiService.getServices();
      const service = services.find((s: any) => s.id === serviceId);

      if (!service) {
        res.status(400).json({
          success: false,
          error: 'Service not found'
        });
        return;
      }

      // Extract service duration from ISO 8601 format
      // Examples: "PT30M" = 30 minutes, "PT1H" = 60 minutes, "PT1H30M" = 90 minutes
      const duration = service.defaultDuration || 'PT30M';
      const hours = duration.match(/(\d+)H/);
      const minutes = duration.match(/(\d+)M/);
      const serviceDurationMinutes = (hours ? parseInt(hours[1]) * 60 : 0) + (minutes ? parseInt(minutes[1]) : 0);

      // Calculate the correct end time based on service duration
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(startDateTime.getTime() + serviceDurationMinutes * 60 * 1000);

      logger.info(`Service "${service.displayName}" duration: ${serviceDurationMinutes} minutes`);
      logger.info(`Booking time: ${startDateTime.toISOString()} to ${endDateTime.toISOString()}`);

      // Step 2: Create booking in Microsoft Bookings with correct duration
      const booking = await graphApiService.createBooking({
        customerName,
        customerEmail,
        customerPhone,
        serviceId,
        start: startDateTime,
        end: endDateTime,
        notes,
        isDigital: meetingType === 'digital'
      });

      // Step 2: Handle document uploads if any
      let documentUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        documentUrls = await documentService.uploadDocuments(
          req.files,
          booking.id
        );
      }

      // Step 3: Send notifications (email and SMS)
      await notificationService.sendBookingConfirmation({
        booking,
        brand,
        documentUrls
      });

      // Step 4: Return success response
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: {
          bookingId: booking.id,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          meetingTime: booking.start,
          meetingType,
          joinUrl: booking.joinUrl,
          location: booking.location,
          confirmationSent: true
        }
      });

    } catch (error) {
      logger.error('Error creating booking:', error);
      next(error);
    }
  }

  /**
   * Get booking details
   * GET /api/v1/bookings/:id
   */
  async getBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Fetch booking details from Microsoft Bookings
      const booking = await graphApiService.getBookingById(id);

      res.json({
        success: true,
        data: booking
      });

    } catch (error) {
      logger.error('Error getting booking:', error);
      next(error);
    }
  }

  /**
   * Cancel a booking
   * DELETE /api/v1/bookings/:id
   */
  async cancelBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      logger.info(`Cancelling booking ${id}`);

      // Cancel in Microsoft Bookings
      await graphApiService.cancelBooking(id);

      // Send cancellation notification
      await notificationService.sendCancellationNotification(id, reason);

      res.json({
        success: true,
        message: 'Booking cancelled successfully'
      });

    } catch (error) {
      logger.error('Error cancelling booking:', error);
      next(error);
    }
  }

  /**
   * Reschedule a booking
   * PUT /api/v1/bookings/:id/reschedule
   */
  async rescheduleBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newStartTime, newEndTime } = req.body;

      logger.info(`Rescheduling booking ${id}`);

      // In a real implementation, you would:
      // 1. Cancel the old booking
      // 2. Create a new booking with the new time
      // 3. Send rescheduling notifications

      res.json({
        success: true,
        message: 'Booking rescheduled successfully',
        data: {
          bookingId: id,
          newStartTime,
          newEndTime
        }
      });

    } catch (error) {
      logger.error('Error rescheduling booking:', error);
      next(error);
    }
  }

  /**
   * Debug: Get all booking businesses available to this app
   * GET /api/v1/debug/businesses
   */
  async getBookingBusinesses(_req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Getting all booking businesses...');

      const businesses = await graphApiService.getBookingBusinesses();

      res.json({
        success: true,
        data: businesses
      });

    } catch (error) {
      logger.error('Error getting booking businesses:', error);
      next(error);
    }
  }

  /**
   * Debug: Get specific business details
   * GET /api/v1/debug/business/:id?
   */
  async getBusinessDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      logger.info(`Getting business details for: ${id || 'current'}`);

      const business = await graphApiService.getBusinessDetails(id);

      res.json({
        success: true,
        data: business
      });

    } catch (error) {
      logger.error('Error getting business details:', error);
      next(error);
    }
  }

  /**
   * Admin: Get all bookings with filtering and pagination
   * GET /api/v1/admin/bookings
   */
  async getAllBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        startDate,
        endDate,
        status,
        customerEmail,
        page = '1',
        limit = '10'
      } = req.query;

      logger.info('Admin fetching all bookings with filters:', {
        startDate, endDate, status, customerEmail, page, limit
      });

      // Get bookings from Microsoft Graph API
      const bookings = await graphApiService.getAllBookings({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: status as string,
        customerEmail: customerEmail as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: bookings
      });

    } catch (error) {
      logger.error('Error getting all bookings:', error);
      next(error);
    }
  }

  /**
   * Admin: Get booking statistics
   * GET /api/v1/admin/stats
   */
  async getBookingStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;

      logger.info('Admin fetching booking statistics');

      const stats = await graphApiService.getBookingStats({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error getting booking stats:', error);
      next(error);
    }
  }

  /**
   * Debug: Get all services from Microsoft Bookings
   * GET /api/v1/debug/services
   */
  async getServices(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Getting services from Microsoft Bookings');

      const services = await graphApiService.getServices();

      res.json({
        success: true,
        data: services
      });

    } catch (error) {
      logger.error('Error getting services:', error);
      next(error);
    }
  }

  /**
   * Get all staff members
   * GET /api/v1/staff
   */
  async getStaffMembers(_req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Getting staff members from Microsoft Bookings');

      const staffMembers = await graphApiService.getStaffMembers();

      res.json({
        success: true,
        data: staffMembers
      });

    } catch (error) {
      logger.error('Error getting staff members:', error);
      next(error);
    }
  }

  /**
   * Assign staff to a booking
   * PUT /api/v1/admin/bookings/:id/assign-staff
   */
  async assignStaffToBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { staffMemberIds } = req.body;

      logger.info(`Assigning staff to booking ${id}:`, staffMemberIds);

      if (!Array.isArray(staffMemberIds)) {
        res.status(400).json({
          success: false,
          message: 'staffMemberIds must be an array'
        });
        return;
      }

      await graphApiService.assignStaffToBooking(id, staffMemberIds);

      res.json({
        success: true,
        message: 'Staff assigned successfully'
      });

    } catch (error) {
      logger.error('Error assigning staff to booking:', error);
      next(error);
    }
  }
}

export default new BookingController();