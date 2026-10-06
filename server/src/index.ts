import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './utils/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { initializeSocket } from './socket';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import groupRoutes from './routes/group.routes';
import expenseRoutes from './routes/expense.routes';
import settlementRoutes from './routes/settlement.routes';
import inviteRoutes from './routes/invite.routes';
import notificationRoutes from './routes/notification.routes';
import uploadRoutes from './routes/upload.routes';

const app: Application = express();
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // In development: Allow localhost on any port
    if (env.NODE_ENV === 'development' && 
        (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true);
    }
    
    // Allow configured URLs (both local and production)
    if (origin === env.WEB_APP_URL || origin === env.APP_URL) {
      return callback(null, true);
    }
    
    // Production: Allow any HTTPS origin (for deployed Flutter web app)
    if (env.NODE_ENV === 'production' && origin.startsWith('https://')) {
      return callback(null, true);
    }
    
    // Log and reject others
    logger.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Request logging
app.use(pinoHttp({ logger }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/me', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', expenseRoutes); // Includes /api/categories and /api/groups/:id/expenses
app.use('/api', settlementRoutes); // Includes /api/groups/:id/balances and /api/groups/:id/settlements
app.use('/api', inviteRoutes); // Includes /api/invites/* and /api/groups/:id/invites
app.use('/api/notifications', notificationRoutes);
app.use('/api', notificationRoutes); // Also includes /api/push-tokens
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = env.PORT;

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  logger.info(`📍 API base: http://localhost:${PORT}/api`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
  logger.info(`⚡ Socket.io enabled for real-time updates`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
