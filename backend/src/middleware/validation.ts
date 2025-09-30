import { body, ValidationChain } from 'express-validator';

export const validateBooking: ValidationChain[] = [
  body('customerName')
    .trim()
    .notEmpty().withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('customerEmail')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('customerPhone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[\d\s\+\-\(\)]+$/).withMessage('Invalid phone number format'),

  body('serviceId')
    .notEmpty().withMessage('Service selection is required'),

  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .isISO8601().withMessage('Invalid date format'),

  body('endTime')
    .notEmpty().withMessage('End time is required')
    .isISO8601().withMessage('Invalid date format'),

  body('meetingType')
    .notEmpty().withMessage('Meeting type is required')
    .isIn(['digital', 'physical']).withMessage('Meeting type must be digital or physical'),

  body('brand')
    .notEmpty().withMessage('Brand is required')
    .isIn(['B1', 'B2']).withMessage('Brand must be B1 or B2'),

  body('businessPurpose')
    .isBoolean().withMessage('Business purpose must be a boolean'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];