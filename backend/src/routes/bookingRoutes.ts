import { Router } from 'express';
import bookingController from '../controllers/bookingController';
import { validateBooking } from '../middleware/validation';

const router = Router();

// Create a new booking
router.post('/', validateBooking, bookingController.createBooking);

// Get booking by ID
router.get('/:id', bookingController.getBooking);

// Cancel booking
router.delete('/:id', bookingController.cancelBooking);

// Reschedule booking
router.put('/:id/reschedule', bookingController.rescheduleBooking);

// Debug routes
router.get('/debug/businesses', bookingController.getBookingBusinesses);
router.get('/debug/business/:id?', bookingController.getBusinessDetails);
router.get('/debug/services', bookingController.getServices);

export default router;