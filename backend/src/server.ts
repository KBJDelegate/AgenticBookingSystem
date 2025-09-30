import dotenv from 'dotenv';
import app from './app';
import logger from './utils/logger';

// Load environment variables
dotenv.config({ path: '.env' });

const PORT = process.env.PORT || 3001;

// Debug: Log the business ID to verify it's loaded correctly
logger.info('Loaded BOOKING_BUSINESS_ID:', process.env.BOOKING_BUSINESS_ID);

// Start the server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('Press CTRL-C to stop');
});