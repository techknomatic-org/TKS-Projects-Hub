import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';


import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import featuresRouter from './routes/features.js';
import userStoriesRouter from './routes/userStories.js';
import auditLogsRouter from './routes/auditLogs.js';
import reportsRouter from './routes/reports.js';
import notificationsRouter from './routes/notifications.js';
import requirementsMappingRouter from './routes/requirementsMapping.js';
import usersRouter from './routes/users.js';


import { initSocket } from './lib/socket.js';
import logger from './lib/logger.js';
import errorMiddleware from './middlewares/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Validate required environment variables on startup
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'AZURE_CLIENT_ID', 'AZURE_TENANT_ID'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(`[CRITICAL ERROR] Startup validation failed. Missing variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security Hardening: Helmet headers
app.use(helmet());

// Logging integration: Morgan + Winston streams
const morganFormat = ':method :url :status :res[content-length] - :response-time ms';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Security Hardening: Rate Limiters
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { success: false, message: 'Rate limit exceeded. Too many requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting rules
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

app.use(express.json());

// Main routes
app.use('/api/auth', authRouter);
app.use('/api', productsRouter);
app.use('/api', featuresRouter);
app.use('/api', userStoriesRouter);
app.use('/api', auditLogsRouter);
app.use('/api', reportsRouter);
app.use('/api', notificationsRouter);
app.use('/api', requirementsMappingRouter);
app.use('/api', usersRouter);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Root API listing
app.get('/', (req, res) => {
  res.send('TKS Product Development Tracking API is running.');
});

// Wrap express server inside HTTP server to attach Socket.IO
const server = http.createServer(app);
initSocket(server);

// Global Error Handler
app.use(errorMiddleware);

server.listen(PORT, () => {
  logger.info(`==================================================`);
  logger.info(`🚀 TKS API Server with Socket.IO is running on port: ${PORT}`);
  logger.info(`🔐 Bypass MS Auth status: ${process.env.BYPASS_MICROSOFT_AUTH === 'true'}`);
  logger.info(`==================================================`);
});
