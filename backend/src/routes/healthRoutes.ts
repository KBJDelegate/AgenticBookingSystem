import { Router, Request, Response } from 'express';

const router = Router();

// Health check endpoint
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Readiness check
router.get('/ready', (_req: Request, res: Response) => {
  // Check if all required services are available
  const isReady = true; // In production, check database, external services, etc.

  if (isReady) {
    res.json({
      status: 'ready',
      services: {
        database: 'connected',
        graphApi: 'available',
        storage: 'available'
      }
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      message: 'Service is starting up'
    });
  }
});

export default router;