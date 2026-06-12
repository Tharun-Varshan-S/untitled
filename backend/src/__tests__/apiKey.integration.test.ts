import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;
let app: any;
let connectDB: any;
let disconnectDB: any;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV = 'test';

  // require after setting env (avoid dynamic ESM import in Jest environment)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const db = require('../config/database');
  connectDB = db.connectDB;
  disconnectDB = db.disconnectDB;
  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  app = require('../app').default;
});

afterAll(async () => {
  await disconnectDB();
  if (mongod) await mongod.stop();
});

test('create project, create api key, authenticate with key', async () => {
  // create a user directly
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const UserModel = require('../models/User').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ProjectModel = require('../models/Project').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const bcrypt = require('bcryptjs');

  const passwordHash = await bcrypt.hash('password', 8);
  const user = await UserModel.create({ name: 'Test', email: 't@example.com', passwordHash });

  // sign jwt
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { signJwt } = require('../utils/jwt');
  const token = signJwt({ userId: user._id.toString() });

  // create project via API
  const createProjectRes = await request(app)
    .post('/api/v1/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'proj', description: 'desc' });
  expect(createProjectRes.status).toBe(201);
  const projectId = createProjectRes.body.data.id as string;

  // create api key
  const createKeyRes = await request(app)
    .post(`/api/v1/projects/${projectId}/api-keys`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'ingest-key' });
  expect(createKeyRes.status).toBe(201);
  const rawKey = createKeyRes.body.data.rawKey as string;
  expect(rawKey).toMatch(/^ll_live_/);

  // call test auth endpoint with x-api-key
  const authRes = await request(app)
    .post('/api/v1/_test/auth')
    .set('x-api-key', rawKey)
    .send({});
  expect(authRes.status).toBe(200);
  expect(authRes.body.success).toBe(true);
  expect(authRes.body.project).toBeDefined();
  expect(authRes.body.project.id).toBe(projectId);
});
