/**
 * @file autoCapture.js
 * @description Automatic Console and Process Error interceptor for LogLens SDK.
 * 
 * WHY THIS FILE EXISTS:
 * Automatically captures existing console logs (info, warn, error) and unhandled
 * Node.js exceptions/rejections so developers get zero-config logging without
 * manually replacing console calls across their codebase.
 */

const logger = require('./logger');

let isEnabled = false;
let isCapturing = false;

/**
 * Check if the log message originated from LogLens SDK internal output
 * to prevent infinite recursive logging loops.
 */
function isInternalLog(args) {
  const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  return msg.includes('[LogLens') || msg.includes('LogLens SDK');
}

/**
 * Enable automatic interception of console outputs and uncaught process errors.
 * @param {Object} [options]
 * @param {boolean} [options.autoCaptureConsole=true] - Intercept console.log/warn/error
 * @param {boolean} [options.autoCaptureExceptions=true] - Intercept uncaughtException & unhandledRejection
 */
function enableAutoCapture(options = {}) {
  if (isEnabled) return;
  isEnabled = true;

  const captureConsole = options.autoCaptureConsole !== false;
  const captureExceptions = options.autoCaptureExceptions !== false;

  if (captureConsole) {
    // 1. Intercept console.log -> LogLens INFO
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog.apply(console, args);
      if (isCapturing || isInternalLog(args)) return;
      isCapturing = true;
      try {
        const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        logger.info(msg, { source: 'console.log' });
      } catch (err) {
        // Ignore internal capture error
      } finally {
        isCapturing = false;
      }
    };

    // 2. Intercept console.warn -> LogLens WARN
    const originalWarn = console.warn;
    console.warn = (...args) => {
      originalWarn.apply(console, args);
      if (isCapturing || isInternalLog(args)) return;
      isCapturing = true;
      try {
        const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        logger.warn(msg, { source: 'console.warn' });
      } catch (err) {
        // Ignore internal capture error
      } finally {
        isCapturing = false;
      }
    };

    // 3. Intercept console.error -> LogLens ERROR
    const originalError = console.error;
    console.error = (...args) => {
      originalError.apply(console, args);
      if (isCapturing || isInternalLog(args)) return;
      isCapturing = true;
      try {
        const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        logger.error(msg, { source: 'console.error' });
      } catch (err) {
        // Ignore internal capture error
      } finally {
        isCapturing = false;
      }
    };
  }

  if (captureExceptions) {
    // 4. Capture Uncaught Exceptions (Server Crashes)
    process.on('uncaughtException', (err) => {
      try {
        logger.fatal(err, { source: 'uncaughtException' });
      } catch (e) {
        // Ignore
      }
    });

    // 5. Capture Unhandled Promise Rejections
    process.on('unhandledRejection', (reason) => {
      try {
        logger.error(reason instanceof Error ? reason : String(reason), { source: 'unhandledRejection' });
      } catch (e) {
        // Ignore
      }
    });
  }
}

module.exports = { enableAutoCapture };
