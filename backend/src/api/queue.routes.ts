import { Router, Request, Response, NextFunction } from 'express';
import { getQueueMetrics, getFailedJobsSummary, cleanQueueHistory } from '../jobs/log.monitoring';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/v1/queues/metrics
 * Returns real-time BullMQ queue state counts, failure rates, and queue health status.
 */
router.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await getQueueMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/queues/failed
 * Returns a summary of failed jobs for root cause analysis.
 */
router.get('/failed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const failedJobs = await getFailedJobsSummary(limit);
    res.json({
      success: true,
      count: failedJobs.length,
      data: failedJobs,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/queues/clean
 * Triggers manual queue history cleanup of old completed & failed jobs.
 */
router.post('/clean', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gracePeriodMs = Number(req.body.gracePeriodMs) || 3600000; // default 1 hour
    const result = await cleanQueueHistory(gracePeriodMs);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
