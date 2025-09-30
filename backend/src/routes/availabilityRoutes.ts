import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import graphApiService from '../services/graphApiService';
import logger from '../utils/logger';

const router = Router();

// Get available time slots
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { serviceId, date } = req.query;

    if (!serviceId || !date) {
      res.status(400).json({
        success: false,
        error: 'serviceId and date are required parameters'
      });
      return;
    }

    const startDate = new Date(date as string);
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);

    const slots = await graphApiService.getAvailableTimeSlots(
      serviceId as string,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    logger.error('Error fetching availability:', error);
    next(error);
  }
});

// Get services
router.get('/services', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await graphApiService.getServices();

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    logger.error('Error fetching services:', error);
    next(error);
  }
});

export default router;