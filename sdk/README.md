# LogLens SDK — Official Node.js Client Library

> **Production-grade, high-throughput, non-blocking log collection client library for the LogLens Real-time Observability Platform.**

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture & Design Principles](#architecture--design-principles)
3. [Installation](#installation)
4. [Quick Start (under 2 minutes)](#quick-start-under-2-minutes)
5. [Configuration API Reference](#configuration-api-reference)
6. [Logging Methods](#logging-methods)
7. [Payload Format Specification](#payload-format-specification)
8. [Example Express Integration](#example-express-integration)
9. [Crash-Safe Error Resilience](#crash-safe-error-resilience)
10. [Testing Scenario Walkthrough](#testing-scenario-walkthrough)
11. [Future Extensibility & AI Roadmap](#future-extensibility--ai-roadmap)

---

## Overview

The **LogLens SDK** allows Node.js backend applications to asynchronously collect, format, and dispatch logs to a central LogLens server cluster. 

### Ingestion Pipeline Flow:
```
Your Node.js App (LogLens SDK) 
        │ (Asynchronous HTTP POST)
        ▼
LogLens Backend Server (Port 5000)
        │ (API Key Authentication)
        ▼
Redis Task Queue (BullMQ)
        │ (Concurrent Job Processor)
        ▼
MongoDB Atlas Persistence
        │ (Socket.IO Real-time Stream)
        ▼
LogLens Web Dashboard UI (Port 3000)
```

---

## Architecture & Design Principles

The SDK adheres to a strict **Modular Layered Architecture**:

```
loglens-sdk/
├── index.js             <-- Public SDK Interface (Façade API)
└── src/
    ├── config.js        <-- Central Configuration Store (Singleton)
    ├── client.js        <-- Isolated Axios HTTP Transport Layer
    ├── logger.js        <-- Payload Formatting & Logging Facade
    ├── types.js         <-- Log Level Constants
    └── utils.js         <-- Validation, Normalization, & Timestamps
```

### Why File Separation Matters:
- **`config.js`**: Enforces configuration single-initialization. Immutable settings prevent runtime pollution.
- **`client.js`**: Encapsulates Axios. The HTTP client library is never leaked to the host app. If Axios is swapped for `undici` or `fetch` in future versions, user code remains untouched.
- **`logger.js`**: Formats standard payloads and defers network dispatch asynchronously using `setImmediate()`.
- **`types.js`**: Central string constants (`INFO`, `WARN`, `ERROR`, `DEBUG`, `FATAL`).
- **`utils.js`**: Handles timestamp generation and cycle-safe metadata JSON normalization.

---

## Installation

Inside your application directory:

```bash
npm install loglens-sdk
```

*(Or require locally via `require('./sdk')`)*.

---

## Quick Start (under 2 minutes)

```javascript
const loglens = require('loglens-sdk');

// 1. Initialize LogLens once during server startup
loglens.init({
  apiKey: process.env.LOGLENS_API_KEY,
  endpoint: 'http://localhost:5000',
  service: 'Inventory API Service'
});

// 2. Log events across your backend routes & middleware
loglens.info('Server started successfully');
loglens.warn('High memory usage detected', { usageMb: 820 });
loglens.error('Database connection timeout', { userId: 15, route: '/checkout' });
loglens.debug('Raw request headers', { headers: req.headers });
loglens.fatal('Unrecoverable process crash', { exitCode: 1 });
```

---

## Configuration API Reference

### `loglens.init(options)`

| Option | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `apiKey` | `string` | **Yes** | — | Project API Key generated from LogLens UI (`ll_live_...`) |
| `endpoint` | `string` | **Yes** | — | Base HTTP URL of LogLens server (e.g. `http://localhost:5000`) |
| `service` | `string` | No | `'default-service'` | Identifier for the microservice sending logs |
| `timeout` | `number` | No | `5000` | HTTP request timeout in milliseconds |
| `debug` | `boolean` | No | `false` | Enable console debug logs when SDK dispatches payloads |

---

## Logging Methods

All logging functions take a `message` string (or Error object) and an optional `metadata` object:

- `loglens.info(message, [metadata])` — Informational runtime events
- `loglens.warn(message, [metadata])` — Warnings and non-blocking issues
- `loglens.error(message, [metadata])` — Application errors and HTTP 500 failures
- `loglens.debug(message, [metadata])` — Verbose debugging data
- `loglens.fatal(message, [metadata])` — Critical system crashes or OOM failures

---

## Payload Format Specification

Every log payload sent over HTTP matches the LogLens backend ingestion contract:

```json
{
  "level": "error",
  "message": "Database connection timeout",
  "service": "Inventory API Service",
  "metadata": {
    "userId": 15,
    "route": "/checkout",
    "module": "AuthDatabase"
  },
  "timestamp": "2026-07-22T20:45:00.000Z"
}
```

---

## Example Express Integration

```javascript
const express = require('express');
const loglens = require('loglens-sdk');

const app = express();

loglens.init({
  apiKey: process.env.LOGLENS_API_KEY,
  endpoint: 'http://localhost:5000',
  service: 'Billing Microservice'
});

app.get('/payment', (req, res) => {
  loglens.info('Payment request received', { amount: 99.99 });
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  loglens.error(err.message, { stack: err.stack, path: req.path });
  res.status(500).send('Internal Error');
});

app.listen(4000);
```

---

## Crash-Safe Error Resilience

1. **Non-Blocking Execution**: Payload dispatches are deferred using `setImmediate()`, ensuring user HTTP request loops are never delayed.
2. **Silent Failure**: If the LogLens backend goes offline, Network errors are caught internally. The host application will **never crash** or throw uncaught exceptions due to telemetry failures.

---

## Testing Scenario Walkthrough

To verify the end-to-end flow:

1. **Start Backend Infrastructure**:
   ```bash
   docker-compose up -d
   cd backend && npm run dev
   ```
2. **Start Backend Worker Node**:
   ```bash
   cd backend && npm run dev:worker
   ```
3. **Start Frontend Dashboard**:
   ```bash
   cd frontend && npm run dev
   ```
4. **Run Example App**:
   ```bash
   cd example-express-app && npm start
   ```
5. **Trigger Log Routes**:
   - `curl http://localhost:4000/`
   - `curl http://localhost:4000/error`
6. **Verify in UI**:
   Open `http://localhost:3000/dashboard` to see logs streaming live in real time!

---


## Future Extensibility & AI Roadmap

The modular architecture of `loglens-sdk` is designed for seamless expansion in upcoming phases:
- **Phase Q (AI & LLM Root Cause)**: Adding `loglens.aiTrace(prompt, response)` by extending `logger.js` without breaking existing API methods.
- **Metrics & OpenTelemetry Tracing**: Adding `metrics.js` and `tracer.js` alongside `logger.js` in `src/`.
