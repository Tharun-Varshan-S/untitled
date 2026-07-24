/**
 * @file index.js
 * @description Official LogLens SDK Public Entry Point.
 * 
 * WHY THIS FILE EXISTS:
 * Encapsulates the entire SDK public interface. Exposes ONLY init(), info(), warn(), error(), 
 * debug(), and fatal(). Hides all internal implementation details (Axios, config storage, 
 * normalization logic) so developers have a clean, 2-minute setup experience.
 */

const config = require('./src/config');
const logger = require('./src/logger');
const { enableAutoCapture } = require('./src/autoCapture');

/**
 * LogLens SDK Interface
 */
const LogLens = {
  /**
   * Initializes the LogLens SDK.
   * Must be called once before sending logs.
   * 
   * @param {Object} options 
   * @param {string} options.apiKey - LogLens API Key from the UI
   * @param {string} options.endpoint - LogLens Backend Base URL (e.g. "http://localhost:5000")
   * @param {string} [options.service] - Service identifier name (e.g. "Inventory API")
   * @param {number} [options.timeout] - HTTP Timeout in ms (default: 5000)
   * @param {boolean} [options.debug] - Enable debug mode logs (default: false)
   * @param {boolean} [options.autoCapture=true] - Enable automatic console & uncaught error interception
   */
  init(options) {
    config.init(options);
    if (options && options.autoCapture !== false) {
      enableAutoCapture({
        autoCaptureConsole: options.autoCaptureConsole,
        autoCaptureExceptions: options.autoCaptureExceptions
      });
    }
  },

  /**
   * Send an INFO level log payload.
   * @param {string|Error} message 
   * @param {Object} [metadata] 
   */
  info(message, metadata) {
    logger.info(message, metadata);
  },

  /**
   * Send a WARN level log payload.
   * @param {string|Error} message 
   * @param {Object} [metadata] 
   */
  warn(message, metadata) {
    logger.warn(message, metadata);
  },

  /**
   * Send an ERROR level log payload.
   * @param {string|Error} message 
   * @param {Object} [metadata] 
   */
  error(message, metadata) {
    logger.error(message, metadata);
  },

  /**
   * Send a DEBUG level log payload.
   * @param {string|Error} message 
   * @param {Object} [metadata] 
   */
  debug(message, metadata) {
    logger.debug(message, metadata);
  },

  /**
   * Send a FATAL level log payload.
   * @param {string|Error} message 
   * @param {Object} [metadata] 
   */
  fatal(message, metadata) {
    logger.fatal(message, metadata);
  },
};

// Export CommonJS interface
module.exports = LogLens;
