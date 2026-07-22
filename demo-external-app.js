/**
 * LogLens - External Project Integration Test Script
 * 
 * Usage:
 *   1. Create a project in LogLens UI (http://localhost:3000/projects)
 *   2. Generate an API Key in the UI
 *   3. Replace `YOUR_API_KEY_HERE` below with your key
 *   4. Run: `node demo-external-app.js`
 *   5. Open http://localhost:3000/dashboard to watch logs stream live!
 */

const LOGLENS_URL = 'http://localhost:5000/api/v1/logs/ingest';
const API_KEY = 'YOUR_API_KEY_HERE'; // <-- Put your generated LogLens API Key here

async function sendLog(level, message, service, metadata = {}) {
  try {
    const response = await fetch(LOGLENS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        level,
        message,
        service,
        metadata,
        timestamp: new Date().toISOString()
      })
    });

    const data = await response.json();
    console.log(`[${level.toUpperCase()}] Log sent successfully:`, data);
  } catch (error) {
    console.error('Failed to send log to LogLens:', error.message);
  }
}

// Simulating an external application sending logs
async function runDemo() {
  console.log('🚀 Starting External App Log Simulation...');
  
  await sendLog('info', 'Payment service initialized', 'payment-service', { environment: 'production' });
  await sendLog('warn', 'High memory usage detected (82%)', 'order-processor', { host: 'node-02' });
  await sendLog('error', 'Database transaction deadlock on checkout', 'payment-service', { userId: 'usr_9981', amount: 149.99 });
  await sendLog('info', 'User session renewed', 'auth-service', { userId: 'usr_9981' });

  console.log('✅ All logs sent! Check your LogLens Dashboard at http://localhost:3000/dashboard');
}

runDemo();
