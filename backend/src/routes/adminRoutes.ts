import { Router } from 'express';
import bookingController from '../controllers/bookingController';

const router = Router();

// Admin routes for booking management
router.get('/bookings', bookingController.getAllBookings);
router.get('/stats', bookingController.getBookingStats);
router.put('/bookings/:id/assign-staff', bookingController.assignStaffToBooking);

export default router;