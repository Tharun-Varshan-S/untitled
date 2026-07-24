/**
 * @file config.js
 * @description Central State Configuration Container for LogLens SDK.
 * 
 * WHY THIS FILE EXISTS:
 * Manages the global SDK configuration state. Enforces initialization validation,
 * stores default settings (e.g. timeout, service name), and provides accessors
 * to keep config parameters immutable from outside modules.
 */

const { validateConfig, cleanUrl } = require('./utils');

class ConfigStore {
  constructor() {
    this._initialized = false;
    this._apiKey = '';
    this._endpoint = '';
    this._service = 'default-service';
    this._timeout = 5000; // Default 5 second HTTP timeout
    this._debug = false;
  }

  /**
   * Initializes the LogLens SDK configuration.
   * Enforces init() to be called only once.
   * 
   * @param {Object} options 
   * @param {string} options.apiKey - LogLens API Key
   * @param {string} options.endpoint - LogLens Backend Base URL (e.g. "http://localhost:5000")
   * @param {string} [options.service] - Service identifier (e.g. "Payment API")
   * @param {number} [options.timeout] - HTTP request timeout in ms (default: 5000)
   * @param {boolean} [options.debug] - Enable verbose SDK warning logs (default: false)
   */
  init(options) {
    if (this._initialized) {
      if (this._debug) {
        console.warn('[LogLens SDK Warning]: loglens.init() has already been called. Ignoring duplicate initialization.');
      }
      return;
    }

    const { valid, errors } = validateConfig(options);
    if (!valid) {
      const message = `[LogLens SDK Error]: Invalid initialization parameters:\n  - ${errors.join('\n  - ')}`;
      console.error(message);
      return;
    }

    this._apiKey = options.apiKey.trim();
    this._endpoint = cleanUrl(options.endpoint.trim());
    if (options.service && typeof options.service === 'string') {
      this._service = options.service.trim();
    }
    if (typeof options.timeout === 'number' && options.timeout > 0) {
      this._timeout = options.timeout;
    }
    if (typeof options.debug === 'boolean') {
      this._debug = options.debug;
    }

    this._initialized = true;

    if (this._debug) {
      console.log(`[LogLens SDK]: Initialized for service "${this._service}" targeting "${this._endpoint}".`);
    }
  }

  isInitialized() {
    return this._initialized;
  }

  getApiKey() {
    return this._apiKey;
  }

  getEndpoint() {
    return this._endpoint;
  }

  getService() {
    return this._service;
  }

  getTimeout() {
    return this._timeout;
  }

  isDebug() {
    return this._debug;
  }
}

// Export a singleton instance across the process
module.exports = new ConfigStore();
