import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/env';
import { registerRoutes } from './api';
import { errorMiddleware } from './middleware/error.middleware';
import { requestLoggingMiddleware } from './middleware/requestLogging.middleware';

const app: Express = express();

// Security headers
app.use(helmet());

// Response compression (gzip)
app.use(compression());

// Request logging
app.use(requestLoggingMiddleware);

// CORS with whitelist
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000').split(',').map(origin => origin.trim());
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  optionsSuccessStatus: 200,
}));

app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

registerRoutes(app);
app.use(errorMiddleware);

// Test-only route to validate API key authentication middleware
if (process.env.NODE_ENV === 'test') {
  // lazy import to avoid production dependency
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { authenticateApiKey } = require('./middleware/authenticateApiKey.middleware');
  app.post('/api/v1/_test/auth', authenticateApiKey, (req, res) => {
    res.json({ success: true, project: (req as any).project ?? null, apiKey: (req as any).apiKey ?? null });
  });
}

export default app;
