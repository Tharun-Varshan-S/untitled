/**
 * @file logger.js
 * @description Core Logging Interface exposing level methods (info, warn, error, debug, fatal).
 * 
 * WHY THIS FILE EXISTS:
 * Contains the public logging APIs. Constructs standard log payloads and delegates
 * network transportation to client.js asynchronously.
 */

const client = require('./client');
const config = require('./config');
const { LOG_LEVELS } = require('./types');
const { getIsoTimestamp, normalizeMetadata } = require('./utils');

class Logger {
  /**
   * Internal helper to format payload and trigger transport.
   * @private
   */
  _log(level, message, metadata = {}) {
    // Coerce message to string if an object/error was passed
    let logMessage = message;
    let logMetadata = metadata;

    if (message instanceof Error) {
      logMessage = message.message;
      logMetadata = { ...normalizeMetadata(message), ...metadata };
    } else if (typeof message === 'object' && message !== null) {
      logMessage = JSON.stringify(message);
    } else {
      logMessage = String(message || '');
    }

    const payload = {
      level: level,
      message: logMessage,
      service: config.getService(),
      metadata: normalizeMetadata(logMetadata),
      timestamp: getIsoTimestamp(),
    };

    // Non-blocking asynchronous dispatch
    setImmediate(() => {
      client.sendLog(payload);
    });
  }

  /**
   * Log an informational message.
   * @param {string|Error} message 
   * @param {Object} [metadata] 
   */
  info(message, metadata) {
    this._log(LOG_LEVELS.INFO, message, metadata);
  }

  /**
   * Log a warning message.
   * @param {string|Error} message 
   * @param {Object} [metadata] 
   */
  warn(message, metadata) {
    this._log(LOG_LEVELS.WARN, message, metadata);
  }

  /**
   * Log an error message.
   * @param {string|Error} message 
   * @param {Object} [metadata] 
   */
  error(message, metadata) {
    this._log(LOG_LEVELS.ERROR, message, metadata);
  }

  /**
   * Log a debug message.
   * @param {string|Error} message 
   * @param {Object} [metadata] 
   */
  debug(message, metadata) {
    this._log(LOG_LEVELS.DEBUG, message, metadata);
  }

  /**
   * Log a fatal application crash/critical error.
   * @param {string|Error} message 
   * @param {Object} [metadata] 
   */
  fatal(message, metadata) {
    this._log(LOG_LEVELS.FATAL, message, metadata);
  }
}

module.exports = new Logger();
