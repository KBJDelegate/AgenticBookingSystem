import { Router } from 'express';
import bookingController from '../controllers/bookingController';

const router = Router();

// Admin routes for booking management
router.get('/bookings', bookingController.getAllBookings);
router.get('/stats', bookingController.getBookingStats);

export default router;