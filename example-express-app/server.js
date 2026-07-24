/**
 * @file server.js
 * @description Example Express Application demonstrating LogLens SDK Integration.
 * 
 * Flow:
 * Express Application -> LogLens SDK -> HTTP Post -> LogLens Backend -> Redis -> BullMQ -> Mongo -> UI
 */

const express = require('express');
const path = require('path');
require('dotenv').config();

// Require the LogLens SDK
const loglens = require('../sdk');

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize LogLens SDK
loglens.init({
  apiKey: process.env.LOGLENS_API_KEY || 'll_live_00pi24dkGecQU31aA83PzhaqY1lKQaG0jdCA5pzeBqc', // Replace with your key
  endpoint: process.env.LOGLENS_ENDPOINT || 'http://localhost:5000',
  service: 'Inventory API Service',
  debug: true, // Output SDK debugging logs to console
});

app.use(express.json());

// Route 1: Home Route
app.get('/', (req, res) => {
  loglens.info('Homepage visited', { userAgent: req.headers['user-agent'] });
  res.json({ message: 'Welcome to Inventory API Service!' });
});

// Route 2: Login Route
app.post('/login', (req, res) => {
  const { username } = req.body || { username: 'john_doe' };
  loglens.info(`User login attempt for ${username}`, {
    username,
    route: '/login',
    ip: req.ip || '127.0.0.1',
  });
  res.json({ success: true, user: username });
});

// Route 3: Payment Route (Warn Level)
app.post('/payment', (req, res) => {
  const amount = req.body.amount || 149.99;
  loglens.warn('Payment retry attempt #2', {
    amount,
    gateway: 'stripe',
    retryCount: 2,
    status: 'pending',
  });
  res.json({ status: 'payment_warning', message: 'High latency detected during checkout' });
});

// Route 4: Error Route (Error Level)
app.get('/error', (req, res) => {
  loglens.error('Database Connection Failed', {
    userId: 15,
    route: '/error',
    module: 'AuthDatabase',
    errorCode: 'ERR_CONN_TIMEOUT',
  });
  res.status(500).json({ error: 'Database transaction failed' });
});

// Route 5: Fatal Route (Fatal Level)
app.get('/fatal', (req, res) => {
  loglens.fatal('Unrecoverable Out Of Memory Exception', {
    memoryUsageMb: 2048,
    threadId: 4,
    nodeEnv: 'production',
  });
  res.status(500).json({ error: 'Fatal error triggered' });
});

app.listen(PORT, () => {
  console.log(`🚀 Example Express App running on http://localhost:${PORT}`);
  loglens.info(`Server Started on port ${PORT}`);
});
