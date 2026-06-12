import express, { Express } from 'express';
import cors from 'cors';
import { registerRoutes } from './api';
import { errorMiddleware } from './middleware/error.middleware';

const app: Express = express();
app.use(cors());
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
    res.json({ success: true, project: req.project ?? null, apiKey: req.apiKey ?? null });
  });
}

export default app;
