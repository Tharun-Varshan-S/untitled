# LogLens – Beginner's Handbook & Technical Guide

> **Production-grade AI-Powered Log Monitoring, Real-time Observability, and Distributed Queue Analysis Platform.**

---

## Welcome to LogLens!

**LogLens** is a full-stack, enterprise-grade log observability platform built to ingest, process, aggregate, and analyze high-volume log streams in real time. 

If you are a beginner backend or full-stack developer, this **Handbook** will walk you step-by-step through how a real-world, scalable log monitoring system works—from HTTP ingestion to distributed message queues, database persistence, real-time WebSockets, and interactive Next.js dashboards.

---

## What Problem Does LogLens Solve?

When software applications scale to millions of users, microservices generate millions of log lines per minute. Processing these logs synchronously inside an HTTP request loop crashes web servers and creates extreme latency.

**LogLens solves this using an Asynchronous Distributed Architecture**:
1. **Instant Ingestion**: Log requests are received by the API and immediately enqueued into **Redis / BullMQ** in under `5ms` (HTTP 202 Accepted).
2. **Background Processing**: Independent worker nodes pull jobs from the queue, persist them to **MongoDB**, and calculate analytics without blocking user requests.
3. **AI Root-Cause Analysis**: High-severity error spikes are debounced and processed by AI models to identify bug root causes automatically.
4. **Real-time Streaming**: **Socket.IO** broadcasts new logs and metrics to the **Next.js** web dashboard instantly.

---

## 🏗️ System Architecture

LogLens employs an asynchronous, distributed architecture designed to ingest high-volume log streams without blocking user requests. The architecture is structured to provide high availability, real-time observability, and AI-driven insights.

### 1. High-Level Overview
![Conceptual Architecture](docs/architecture/conceptual-architecture.svg)

The system is broken down into four core layers:
- **Ingestion Layer:** Receives logs via a REST API and instantly enqueues them (HTTP 202 Accepted, < 5ms).
- **Buffer/Queue Pipeline:** Utilizes **BullMQ** and **Redis** to safely buffer incoming traffic, preventing data loss during traffic spikes and outages.
- **Storage Layer:** Background worker nodes process jobs from the queue and persist normalized log data into **MongoDB**.
- **Real-Time & AI Subsystems:** 
  - **Socket.IO** broadcasts new logs instantly to connected Web Clients.
  - Debounced triggers invoke the **FastAPI AI Engine** to analyze root causes of high-severity error spikes.

### 2. Component Architecture
![Component Architecture](docs/architecture/component-architecture.svg)

### 3. Data Flow Lifecycle
![Sequence Diagram](docs/architecture/sequence-diagram.svg)

1. **Generation:** Applications integrate the `loglens-sdk` to send asynchronous log payloads.
2. **Buffering:** The Node.js Express API Gateway receives the payload and adds the job to BullMQ (`delayed`, `waiting`, or `scheduled`).
3. **Processing:** Independent worker clusters pull jobs from Redis, validate the payloads, and insert them into MongoDB.
4. **Broadcasting:** Worker nodes emit events to Socket.IO rooms, pushing live data to the Next.js dashboard.
5. **AI Analysis:** Anomalies or error spikes trigger the Python FastAPI AI service for semantic root-cause analysis.

> **💡 Note:** For more detailed diagrams including **Deployment Infrastructure** and **Data Flow (Level 1 DFD)**, explore the [`docs/architecture`](docs/architecture/) directory or open the interactive viewer at [`docs/architecture/index.html`](docs/architecture/index.html).

---

## Complete Tech Stack

### Backend Infrastructure (`/backend`)
- **Runtime**: Node.js (TypeScript)
- **API Framework**: Express.js
- **Task Queue & Scheduling**: BullMQ v5 & ioredis
- **Queue Monitoring**: Bull Board (`@bull-board/express`)
- **In-Memory Cache & Message Broker**: Redis 7+
- **Primary Database**: MongoDB (Mongoose ORM)
- **Real-Time Communication**: Socket.IO (with Redis Adapter for horizontal scaling)
- **Authentication**: JWT (JSON Web Tokens) & API Key Hashing
- **Logging**: Winston Logger
- **Test Framework**: Jest & Supertest

### Frontend Application (`/frontend`)
- **Framework**: Next.js 16 (App Router) & React 19
- **Styling**: Tailwind CSS & Lucide Icons
- **Server State Management**: TanStack Query (React Query v5)
- **Client/UI State Management**: Zustand
- **Data Visualization**: Recharts
- **Real-Time Connection**: Socket.IO Client
- **Test Framework**: Vitest & React Testing Library

### Official Client Library (`loglens-sdk` / `/sdk`)
- **Package Name**: `loglens-sdk`
- **HTTP Transport**: Axios
- **Architecture**: Modular Facade (`init`, `info`, `warn`, `error`, `debug`, `fatal`)
- **Execution Model**: Asynchronous & Non-blocking (`setImmediate`)
- **Fault Tolerance**: Crash-proof silent error handling (never crashes host application)
- **Sample App**: `example-express-app`

---

## Project Directory Structure (Handbook & Map)

```
loglens/
├── README.md                      <-- Project Overview & Beginner Handbook
├── docker-compose.yml             <-- One-click Redis & MongoDB infrastructure
├── shared/                        <-- Shared TypeScript Contracts & Socket Events
│   └── socket/                    <-- Typed Socket.IO event payloads & room definitions
│
├── backend/                       <-- Node.js + Express + BullMQ Backend Services
│   ├── src/
│   │   ├── api/                   <-- Express HTTP Route Controllers & Handlers
│   │   ├── config/                <-- Environment Variable loaders & Redis config
│   │   ├── controllers/           <-- Request/Response controllers (Auth, Ingestion, Analytics)
│   │   ├── jobs/                  <-- Phase P Distributed Queue Architecture
│   │   │   ├── config/            <-- Delay, Retry, and Cron Scheduler Presets
│   │   │   │   ├── delay.config.ts
│   │   │   │   ├── retry.config.ts
│   │   │   │   └── scheduler.config.ts
│   │   │   ├── payloads/          <-- Pass-by-Reference DTO Schemas & Validators
│   │   │   ├── log.queue.ts       <-- BullMQ Queue instance ('log-ingestion')
│   │   │   ├── log.producer.ts    <-- Enqueue helper functions (Immediate, Delayed, Scheduled)
│   │   │   ├── log.scheduler.ts   <-- Job Scheduler registration & management
│   │   │   ├── log.worker.ts      <-- Worker processor router & cluster factory
│   │   │   ├── log.monitoring.ts  <-- Inspection APIs & Metric calculation
│   │   │   ├── board.ts           <-- Bull Board Dashboard UI Adapter
│   │   │   ├── test-delayed-jobs.ts       <-- Interactive Delayed Job test script
│   │   │   ├── test-repeatable-jobs.ts    <-- Interactive Repeatable Job test script
│   │   │   ├── test-queue-monitoring.ts   <-- Interactive Queue Monitoring test script
│   │   │   ├── test-scaling-workers.ts    <-- Interactive Worker Cluster test script
│   │   │   └── test-phase-p-integration.ts<-- Master End-to-End Integration test script
│   │   ├── middleware/            <-- Auth Guard, Rate Limiting, API Key Validation
│   │   ├── models/                <-- Mongoose Database Schemas (Log, Project, User, ApiKey)
│   │   ├── repositories/          <-- Database Access Layer (Data abstraction)
│   │   ├── services/              <-- Business Logic Layer (Analytics computation, Auth)
│   │   ├── socket/                <-- Socket.IO setup, authentication, and room broadcasters
│   │   ├── index.ts               <-- Web API Server entry point
│   │   └── worker.ts              <-- Standalone Worker Process entry point
│   └── package.json
│
├── sdk/                           <-- LogLens Official Client SDK (npm: loglens-sdk)
│   ├── index.js                   <-- Facade API (init, info, warn, error, debug, fatal)
│   ├── README.md                  <-- SDK Developer & Architecture Guide
│   └── src/                       <-- Config, Axios Client, Logger, Types & Utils
│
├── example-express-app/           <-- Example Express App integrating LogLens SDK
│   └── server.js
│
└── frontend/                      <-- Next.js 16 App Router Frontend
    ├── src/
    │   ├── app/                   <-- Next.js Pages (Dashboard, Analytics, Projects, Auth)
    │   ├── components/            <-- Reusable UI Components & Charts
    │   ├── features/              <-- Domain-specific Feature modules
    │   ├── hooks/                 <-- Custom TanStack Query & Socket Hooks
    │   ├── providers/             <-- React Context Providers (QueryClient, Auth, Socket)
    │   ├── store/                 <-- Zustand Client UI State management
    │   └── services/              <-- Axios API HTTP Clients
    └── package.json
```

---

## Beginner Concepts Guide

### 1. Job Lifecycle in BullMQ
Every job enqueued in LogLens moves through distinct lifecycle states:
- **`delayed`**: Held in Redis ZSET until a delay duration expires or a future timestamp is reached.
- **`waiting`**: Ready in Redis LIST/STREAM for a worker node to process.
- **`active`**: Currently being executed by a worker process.
- **`completed`**: Finished successfully. Job data stored temporarily for audit/monitoring.
- **`failed`**: Encountered an error. Retried automatically if attempts remain, or moved to failed storage.

### 2. Pass-by-Reference Payload Pattern
To optimize Redis memory performance, job payloads store lightweight identifiers (`projectId`, `logId`) and metadata rather than bloated raw objects.

### 3. Non-Recoverable Failure Handling (`UnrecoverableError`)
If a job payload fails schema validation (e.g. invalid version or missing required fields), retrying 3 times will never fix the data format. The worker throws `new UnrecoverableError(...)` to bypass retries and fail the job immediately.

---

## Quickstart Guide: Running LogLens

You can run the entire LogLens architecture using either Docker (One-Click Setup) or Locally (for active development).

### Method 1: Running Everything with Docker (Recommended)

LogLens includes a master `docker-compose.yml` file that orchestrates the entire application (Frontend, Node Backend, FastAPI AI Service, and Redis).

1. Ensure Docker Desktop is installed and running on your machine.
2. From the root `loglens/` directory, run this command to build and start everything:
   ```bash
   docker-compose up --build
   ```
   *(Wait until you see `Server started on port 4000` and `Ready in XXXms` for the frontend)*

   **💡 Pro Tip:** You only need the `--build` flag the very first time, or if you install new NPM packages/change the source code. For everyday use, you can just run:
   ```bash
   docker-compose up
   ```

3. **Where to go in your browser:**
   - **The Dashboard (Frontend):** Open **[http://localhost:3000](http://localhost:3000)** to interact with the app.
   - **Node.js API (Backend):** Runs on `http://localhost:4000` (Note: opening this directly in a browser will show `Cannot GET /` because it's a backend API without a homepage. This is expected!)
   - **AI Service:** Runs on `http://localhost:8000` (Also an API, opening directly will show `{"detail":"Not Found"}`).

   *Note: If you see Chrome Developer Tools CSP (Content Security Policy) errors like `content.js` or `.well-known/appspecific/com.chrome.devtools.json` in the console of `localhost:3000`, you can safely ignore them. These are caused by your browser extensions (like React DevTools or Adblockers) and do not affect the LogLens app.*

4. **Health Checks (How to verify it's working):**
   If you want to verify the APIs are up and healthy, you can check these endpoints:
   - **AI Service Health:** Open `http://localhost:8000/health` (Should return `{"status": "ok"}`)
   - **Backend Queue Health:** Open `http://localhost:4000/api/v1/queues/metrics` (Should return JSON with queue stats)
   - **BullMQ Dashboard:** Open `http://localhost:4000/admin/queues` to see the live queue processor UI.

5. **Stopping the Application:**
   To stop all services, press `Ctrl+C` in your terminal, and then clean up the network by running:
   ```bash
   docker-compose down
   ```

---

### Method 2: Running Locally (For Active Development)

If you are actively coding and want hot-reloading enabled, you should run the services locally in separate terminal windows. 

**Terminal 1: Start Redis**
Use Docker to spin up just the database layer in the background:
```bash
docker-compose up -d redis
```

**Terminal 2: Start the Node.js Backend**
```bash
cd backend
npm install
npm run dev
```

**Terminal 3: Start the FastAPI AI Service**
```bash
cd loglens-ai
source venv/bin/activate
uvicorn app.main:app --reload
```

**Terminal 4: Start the Next.js Frontend**
```bash
cd frontend
npm install
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) (or 5173 depending on your dev script) in your browser.*

---

### Step 5: Test Real-time Ingestion with the Demo App

To simulate logs being sent from an external application:

1. Create a project in the LogLens Dashboard (http://localhost:3000).
2. Generate an API Key for that project.
3. Open `demo-external-app.js` in the root folder and paste your key:
   ```javascript
   const API_KEY = 'YOUR_API_KEY_HERE';
   ```
4. Run the demo script in a new terminal:
   ```bash
   node demo-external-app.js
   ```
5. Watch the logs stream live into your LogLens Dashboard!

---

## Testing & Verification Suite

LogLens includes comprehensive integration and automated test suites.

### 1. Run Complete Backend Unit & Integration Tests
```bash
cd backend
npm test
```
*Runs Jest suites verifying Authentication, Log Ingestion, WebSockets, API Keys, Delayed Jobs, Repeatable Schedulers, Queue Monitoring, and Worker Scaling.*

### 2. Run Interactive Queue Verification Scripts

**Verify Master Phase P Integration Pipeline:**
```bash
cd backend
npx ts-node src/jobs/test-phase-p-integration.ts
```

**Verify Scaling Worker Clusters:**
```bash
cd backend
npx ts-node src/jobs/test-scaling-workers.ts
```

**Verify Queue Monitoring & Bull Board APIs:**
```bash
cd backend
npx ts-node src/jobs/test-queue-monitoring.ts
```

**Verify Delayed Jobs:**
```bash
cd backend
npx ts-node src/jobs/test-delayed-jobs.ts
```

**Verify Repeatable Jobs:**
```bash
cd backend
npx ts-node src/jobs/test-repeatable-jobs.ts
```

### 3. Run Frontend Tests
```bash
cd frontend
npx vitest run
```

---

## Implementation Phases Completed

- **Phase A-E**: Authentication (JWT), MongoDB Schemas, Projects & API Key Hashing.
- **Phase F-G**: Ingestion Engine & Log Parsing Pipeline.
- **Phase H**: Log Analytics & Aggregation Engine.
- **Phase I-K**: Next.js 16 Migration, TanStack Query (Server State), Zustand (UI State).
- **Phase L-M**: Real-Time Dashboard UI & Recharts Data Visualization.
- **Phase N**: Horizontal Socket.IO Infrastructure & Secure WebSocket Room Broadcasting.
- **Phase P.5 (Completed)**: LogLens Client SDK (`loglens-sdk`) & Example Integration
  - Modular layered architecture (`config.js`, `client.js`, `logger.js`, `types.js`, `utils.js`).
  - Non-blocking asynchronous dispatch (`setImmediate`) & crash-proof HTTP resilience.
  - Public facade API (`init`, `info`, `warn`, `error`, `debug`, `fatal`).
  - Fully verified using the `example-express-app` integration.

---

## LogLens Client SDK Quick Start (`loglens-sdk`)

Install the official client SDK in any third-party Node.js application to stream logs directly to your LogLens platform:

```javascript
const loglens = require('loglens-sdk'); // Or require('./sdk')

// Initialize once during app startup
loglens.init({
  apiKey: process.env.LOGLENS_API_KEY,
  endpoint: 'http://localhost:5000',
  service: 'Inventory API Service'
});

// Send logs asynchronously
loglens.info('Server Started on port 4000');
loglens.warn('Memory usage warning', { memoryUsageMb: 850 });
loglens.error('Database connection timeout', { userId: 15, route: '/checkout' });
```
*For complete SDK documentation, architectural design, and payload specs, see [`sdk/README.md`](file:///media/tharun-varshan-s/passport/SRI%20ESHWAR%20COLLEGE%20%20OF%20ENGINEERING/SECE%203RD%20YEAR/5TH%20SEM/PROJECT/loglens/sdk/README.md).*

---

## API & Event Reference for Developers

### REST Ingestion Endpoint
`POST /api/v1/projects/:id/logs`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-api-key": "loglens_key_live_xxx..."
}
```

**Body:**
```json
{
  "level": "error",
  "message": "Database transaction timeout during checkout",
  "service": "payment-service",
  "metadata": {
    "userId": "usr_9921",
    "cartId": "cart_881"
  }
}
```

**Response (HTTP 202 Accepted):**
```json
{
  "success": true,
  "message": "Log enqueued for asynchronous processing",
  "data": {
    "status": "queued",
    "jobId": "378",
    "projectId": "60c72b2f9b1d8b2a3c4d5e6f"
  }
}
```

### Queue Monitoring Endpoints
- `GET /admin/queues`: Bull Board Dashboard UI.
- `GET /api/v1/queues/metrics`: Returns JSON health metrics for active queues.
- `GET /api/v1/queues/failed`: Returns failed job summaries and stacktraces.

---

## Contributing & Support
Feel free to open issues or submit pull requests to enhance LogLens. Happy coding!
