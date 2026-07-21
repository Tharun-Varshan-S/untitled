import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;
let app: any;
let token: string;
let projectId: string;
let otherToken: string; // belongs to a different user (wrong owner)

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

  // ── seed: primary user + project ─────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const UserModel = require('../models/User').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const bcrypt = require('bcryptjs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { signJwt } = require('../utils/jwt');

  const hash = await bcrypt.hash('password', 8);
  const user = await UserModel.create({ name: 'Analytics User', email: 'analytics@example.com', passwordHash: hash });
  token = signJwt({ userId: user._id.toString() });

  const projRes = await request(app)
    .post('/api/v1/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'analytics-test', description: 'analytics integration tests' });
  expect(projRes.status).toBe(201);
  projectId = projRes.body.data.id as string;

  // ── seed: second user (wrong owner) ──────────────────────────────────────
  const other = await UserModel.create({ name: 'Other User', email: 'other@example.com', passwordHash: hash });
  otherToken = signJwt({ userId: other._id.toString() });
}, 40000);

afterAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { disconnectDB } = require('../config/database');
  await disconnectDB();
  if (mongod) await mongod.stop();
});

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Seed some logs directly into the DB so analytics queries return real data */
const seedLogs = async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const LogModel = require('../models/Log').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Types } = require('mongoose');

  const pId = new Types.ObjectId(projectId);
  const now = new Date();

  await LogModel.insertMany([
    { projectId: pId, level: 'info',  message: 'Started',       service: 'auth-service',   createdAt: now },
    { projectId: pId, level: 'warn',  message: 'Slow query',    service: 'db-service',     createdAt: now },
    { projectId: pId, level: 'error', message: 'Crash',         service: 'worker-service', createdAt: now },
    { projectId: pId, level: 'info',  message: 'Request ok',    service: 'auth-service',   createdAt: now },
    { projectId: pId, level: 'error', message: 'Timeout',       service: 'db-service',     createdAt: now },
  ]);
};

// ─── empty database ───────────────────────────────────────────────────────────

describe('Analytics — empty database', () => {
  it('GET /overview returns zeroes when no logs exist', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${token}`)
      .query({ projectId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ totalLogs: 0, totalErrors: 0, totalWarnings: 0, services: 0, logsPerMinute: 0 });
  });

  it('GET /log-levels returns zeroes when no logs exist', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/log-levels')
      .set('Authorization', `Bearer ${token}`)
      .query({ projectId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ info: 0, warn: 0, error: 0 });
  });

  it('GET /services returns empty array when no logs exist', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/services')
      .set('Authorization', `Bearer ${token}`)
      .query({ projectId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /trends returns empty array when no logs exist', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/trends')
      .set('Authorization', `Bearer ${token}`)
      .query({ projectId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─── endpoints with data ──────────────────────────────────────────────────────

describe('Analytics — overview endpoint', () => {
  beforeAll(seedLogs);

  it('200 – returns correct totals', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${token}`)
      .query({ projectId });

    expect(res.status).toBe(200);
    expect(res.body.totalLogs).toBe(5);
    expect(res.body.totalErrors).toBe(2);
    expect(res.body.totalWarnings).toBe(1);
    expect(res.body.services).toBe(3); // auth-service, db-service, worker-service
  });
});

describe('Analytics — log-levels endpoint', () => {
  it('200 – returns counts per level', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/log-levels')
      .set('Authorization', `Bearer ${token}`)
      .query({ projectId });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ info: 2, warn: 1, error: 2 });
  });
});

describe('Analytics — services endpoint', () => {
  it('200 – returns services sorted by count descending', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/services')
      .set('Authorization', `Bearer ${token}`)
      .query({ projectId });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // Each item must have service and count fields
    for (const item of res.body) {
      expect(typeof item.service).toBe('string');
      expect(typeof item.count).toBe('number');
    }

    // Results must be in descending count order
    for (let i = 1; i < res.body.length; i++) {
      expect(res.body[i - 1].count).toBeGreaterThanOrEqual(res.body[i].count);
    }
  });
});

describe('Analytics — trends endpoint', () => {
  it('200 – returns array of { date, count } sorted ascending', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/trends')
      .set('Authorization', `Bearer ${token}`)
      .query({ projectId });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    for (const item of res.body) {
      expect(typeof item.date).toBe('string');
      expect(typeof item.count).toBe('number');
      // date must match YYYY-MM-DD format
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

// ─── invalid projectId ────────────────────────────────────────────────────────

describe('Analytics — invalid projectId', () => {
  const endpoints = ['/overview', '/log-levels', '/services', '/trends'];

  it.each(endpoints)('GET /analytics%s returns 400 INVALID_PROJECT_ID for malformed id', async (path) => {
    const res = await request(app)
      .get(`/api/v1/analytics${path}`)
      .set('Authorization', `Bearer ${token}`)
      .query({ projectId: 'not-a-valid-object-id' });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('INVALID_PROJECT_ID');
  });

  it.each(endpoints)('GET /analytics%s returns 400 PROJECT_ID_REQUIRED when projectId is missing', async (path) => {
    const res = await request(app)
      .get(`/api/v1/analytics${path}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('PROJECT_ID_REQUIRED');
  });
});

// ─── unauthorized access ──────────────────────────────────────────────────────

describe('Analytics — unauthorized access', () => {
  const endpoints = ['/overview', '/log-levels', '/services', '/trends'];

  it.each(endpoints)('GET /analytics%s returns 401 when no token provided', async (path) => {
    const res = await request(app)
      .get(`/api/v1/analytics${path}`)
      .query({ projectId });

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });

  it.each(endpoints)('GET /analytics%s returns 401 with malformed Bearer token', async (path) => {
    const res = await request(app)
      .get(`/api/v1/analytics${path}`)
      .set('Authorization', 'Bearer totally.invalid.token')
      .query({ projectId });

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });
});

// ─── wrong owner access ───────────────────────────────────────────────────────

describe('Analytics — wrong owner access', () => {
  const endpoints = ['/overview', '/log-levels', '/services', '/trends'];

  it.each(endpoints)('GET /analytics%s returns 404 when project belongs to another user', async (path) => {
    const res = await request(app)
      .get(`/api/v1/analytics${path}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .query({ projectId });

    // getProjectById throws PROJECT_NOT_FOUND when ownerId doesn't match
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('PROJECT_NOT_FOUND');
  });
});
