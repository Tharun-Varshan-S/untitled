import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;
let app: any;
let rawKey: string;
let projectId: string;

// ─── shared helpers ──────────────────────────────────────────────────────────

const validLog = () => ({
  level: 'info',
  message: 'Service started',
  service: 'auth-service',
  metadata: { host: 'node-1', pid: 1234 },
});

const validBatch = () => [
  { level: 'info', message: 'Login', service: 'auth-service' },
  { level: 'warn', message: 'Slow query', service: 'db-service', metadata: { ms: 450 } },
  { level: 'error', message: 'Crash', service: 'worker', metadata: { code: 500 } },
];

// ─── lifecycle ───────────────────────────────────────────────────────────────

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.NODE_ENV = 'test';

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { connectDB } = require('../config/database');
  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  app = require('../app').default;

  // ── seed: user → project → api key ────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const UserModel = require('../models/User').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const bcrypt = require('bcryptjs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { signJwt } = require('../utils/jwt');

  const passwordHash = await bcrypt.hash('password', 8);
  const user = await UserModel.create({ name: 'Tester', email: 'tester@example.com', passwordHash });
  const token = signJwt({ userId: user._id.toString() });

  const projRes = await request(app)
    .post('/api/v1/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'ingestion-test', description: 'test project' });
  expect(projRes.status).toBe(201);
  projectId = projRes.body.data.id as string;

  const keyRes = await request(app)
    .post(`/api/v1/projects/${projectId}/api-keys`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'test-ingest-key' });
  expect(keyRes.status).toBe(201);
  rawKey = keyRes.body.data.rawKey as string;
  expect(rawKey).toMatch(/^ll_live_/);
}, 40000);

afterAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { disconnectDB } = require('../config/database');
  await disconnectDB();
  if (mongod) await mongod.stop();
});

// ─── single ingest ───────────────────────────────────────────────────────────

describe('POST /api/v1/logs/ingest', () => {
  it('201 – valid log is persisted', async () => {
    const res = await request(app)
      .post('/api/v1/logs/ingest')
      .set('x-api-key', rawKey)
      .send(validLog());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      level: 'info',
      message: 'Service started',
      service: 'auth-service',
      projectId,
    });
    expect(res.body.data.id).toBeDefined();
  });

  it('400 – missing level returns LOG_LEVEL_REQUIRED', async () => {
    const res = await request(app)
      .post('/api/v1/logs/ingest')
      .set('x-api-key', rawKey)
      .send({ message: 'No level', service: 'svc' });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('LOG_LEVEL_REQUIRED');
  });

  it('400 – invalid level returns LOG_LEVEL_INVALID', async () => {
    const res = await request(app)
      .post('/api/v1/logs/ingest')
      .set('x-api-key', rawKey)
      .send({ level: 'critical-error', message: 'Bad level', service: 'svc' });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('LOG_LEVEL_INVALID');
  });

  it('400 – missing message returns LOG_MESSAGE_REQUIRED', async () => {
    const res = await request(app)
      .post('/api/v1/logs/ingest')
      .set('x-api-key', rawKey)
      .send({ level: 'info', service: 'svc' });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('LOG_MESSAGE_REQUIRED');
  });

  it('400 – missing service returns LOG_SERVICE_REQUIRED', async () => {
    const res = await request(app)
      .post('/api/v1/logs/ingest')
      .set('x-api-key', rawKey)
      .send({ level: 'info', message: 'ok' });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('LOG_SERVICE_REQUIRED');
  });

  it('401 – missing x-api-key header', async () => {
    const res = await request(app)
      .post('/api/v1/logs/ingest')
      .send(validLog());

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('API_KEY_REQUIRED');
  });

  it('401 – malformed api key (no ll_live_ prefix)', async () => {
    const res = await request(app)
      .post('/api/v1/logs/ingest')
      .set('x-api-key', 'totally-wrong-key')
      .send(validLog());

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('API_KEY_MALFORMED');
  });

  it('401 – valid-format key that does not exist in DB', async () => {
    const res = await request(app)
      .post('/api/v1/logs/ingest')
      .set('x-api-key', 'll_live_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
      .send(validLog());

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('API_KEY_INVALID');
  });
});

// ─── bulk ingest ─────────────────────────────────────────────────────────────

describe('POST /api/v1/logs/bulk', () => {
  it('201 – valid batch is fully inserted', async () => {
    const batch = validBatch();
    const res = await request(app)
      .post('/api/v1/logs/bulk')
      .set('x-api-key', rawKey)
      .send(batch);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalReceived).toBe(batch.length);
    expect(res.body.data.totalInserted).toBe(batch.length);
  });

  it('400 – empty array is rejected', async () => {
    const res = await request(app)
      .post('/api/v1/logs/bulk')
      .set('x-api-key', rawKey)
      .send([]);

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('LOG_BULK_EMPTY');
  });

  it('400 – non-array body is rejected', async () => {
    const res = await request(app)
      .post('/api/v1/logs/bulk')
      .set('x-api-key', rawKey)
      .send({ level: 'info', message: 'oops', service: 'svc' });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('LOG_BULK_PAYLOAD_INVALID');
  });

  it('400 – invalid level in one item propagates item index', async () => {
    const res = await request(app)
      .post('/api/v1/logs/bulk')
      .set('x-api-key', rawKey)
      .send([
        { level: 'info', message: 'ok', service: 'svc' },
        { level: 'FATAL', message: 'bad', service: 'svc' },
      ]);

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('LOG_LEVEL_INVALID');
    expect(res.body.message).toMatch(/Item 1/);
  });

  it('401 – missing x-api-key header', async () => {
    const res = await request(app)
      .post('/api/v1/logs/bulk')
      .send(validBatch());

    expect(res.status).toBe(401);
  });
});

// ─── rate limiting ───────────────────────────────────────────────────────────

describe('Rate limiter on ingestion endpoints', () => {
  it('429 – 121st request within 1-minute window is blocked', async () => {
    // The limiter allows 120 req/min. We fire 121 sequential requests
    // against /ingest. The last one must be rejected with 429.
    let lastStatus = 0;
    for (let i = 0; i < 121; i++) {
      const res = await request(app)
        .post('/api/v1/logs/ingest')
        .set('x-api-key', rawKey)
        .send(validLog());
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  }, 60000);
});
