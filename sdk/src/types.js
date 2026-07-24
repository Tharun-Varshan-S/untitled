/**
 * @file types.js
 * @description Centralized Log Level Constants and Types Definition for LogLens SDK.
 * 
 * WHY THIS FILE EXISTS:
 * Single source of truth for valid log levels. Prevents string typos across the SDK
 * and ensures future extensions (e.g. TRACE, METRICS, AI_SPAN) can be added cleanly 
 * without breaking existing code.
 */

const LOG_LEVELS = Object.freeze({
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug',
  FATAL: 'fatal',
});

module.exports = {
  LOG_LEVELS,
};
