/**
 * @file client.js
 * @description HTTP Transport Layer using Axios for LogLens SDK.
 * 
 * WHY THIS FILE EXISTS:
 * Encapsulates all network logic. It constructs the Axios client, manages headers,
 * enforces timeouts, and implements silent error handling so host applications
 * never crash due to network or logging backend failures.
 */

const axios = require('axios');
const config = require('./config');

class LogLensClient {
  /**
   * Asynchronously posts a log payload to the LogLens backend ingestion API.
   * 
   * @param {Object} payload 
   * @param {string} payload.level - 'info' | 'warn' | 'error' | 'debug' | 'fatal'
   * @param {string} payload.message - Log message
   * @param {string} payload.service - Service name
   * @param {Object} payload.metadata - Contextual metadata object
   * @param {string} payload.timestamp - ISO timestamp
   */
  async sendLog(payload) {
    // Check if SDK has been initialized
    if (!config.isInitialized()) {
      if (config.isDebug()) {
        console.warn('[LogLens SDK Warning]: Cannot send log. loglens.init() has not been called.');
      }
      return;
    }

    const endpoint = `${config.getEndpoint()}/api/v1/logs/ingest`;
    const apiKey = config.getApiKey();
    const timeout = config.getTimeout();

    try {
      // Non-blocking HTTP POST request using Axios
      await axios.post(endpoint, payload, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: timeout,
      });

      if (config.isDebug()) {
        console.log(`[LogLens SDK]: Log sent successfully [${payload.level.toUpperCase()}]: ${payload.message}`);
      }
    } catch (error) {
      /**
       * CRITICAL CRASH PREVENTION RULE:
       * The SDK must NEVER throw uncaught errors or crash the host application.
       * If the LogLens backend server is unreachable, times out, or returns a 5xx error,
       * fail silently and print an optional warning if debug mode is active.
       */
      if (config.isDebug()) {
        const errorMsg = error.response
          ? `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`
          : error.message;
        console.warn(`[LogLens SDK Warning]: Failed to dispatch log payload to ${endpoint} -> ${errorMsg}`);
      }
    }
  }
}

// Export singleton HTTP client instance
module.exports = new LogLensClient();
