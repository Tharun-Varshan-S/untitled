import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { logQueue } from './log.queue';
import { logger } from '../utils/logger';

/**
 * Configure and initialize Bull Board monitoring UI.
 */
export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(logQueue)],
  serverAdapter,
});

logger.info(`📊 [Bull Board] Monitoring UI initialized at '/admin/queues'`);
