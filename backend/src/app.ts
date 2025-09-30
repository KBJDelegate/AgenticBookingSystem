import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { json, urlencoded } from 'express';

// Import routes
import bookingRoutes from './routes/bookingRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import healthRoutes from './routes/healthRoutes';
import adminRoutes from './routes/adminRoutes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration - allow multiple frontend URLs
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5177',
    'http://172.17.0.2:5175',
    'http://172.17.0.2:5177',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// API Routes
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/availability', availabilityRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/admin', adminRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'KF Insurance Booking System API',
    version: '1.0.0',
    endpoints: {
      bookings: '/api/v1/bookings',
      availability: '/api/v1/availability',
      health: '/api/v1/health',
      admin: '/api/v1/admin'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Global error handler
app.use(errorHandler);

export default app;