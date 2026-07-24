/**
 * @file utils.js
 * @description Helper utilities for validation, timestamp generation, and metadata normalization.
 * 
 * WHY THIS FILE EXISTS:
 * Encapsulates reusable utility logic so logging code stays clean, testable, and robust.
 */

/**
 * Returns an ISO-8601 formatted timestamp string.
 * @returns {string} e.g. "2026-07-22T20:45:00.000Z"
 */
function getIsoTimestamp() {
  return new Date().toISOString();
}

/**
 * Validates initialization parameters passed to loglens.init().
 * @param {Object} options 
 * @param {string} options.apiKey - LogLens Project API Key
 * @param {string} options.endpoint - LogLens Server Base URL
 * @param {string} [options.service] - Service identifier name
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateConfig(options) {
  const errors = [];

  if (!options || typeof options !== 'object') {
    errors.push('Configuration must be a non-null object.');
    return { valid: false, errors };
  }

  if (!options.apiKey || typeof options.apiKey !== 'string' || !options.apiKey.trim()) {
    errors.push('apiKey is required and must be a non-empty string.');
  }

  if (!options.endpoint || typeof options.endpoint !== 'string' || !options.endpoint.trim()) {
    errors.push('endpoint is required and must be a non-empty string.');
  } else {
    // Ensure valid URL format
    try {
      new URL(options.endpoint);
    } catch (e) {
      errors.push(`Invalid endpoint URL: "${options.endpoint}". Must be a valid HTTP/HTTPS URL.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normalizes metadata into a safe JSON-serializable object.
 * Prevents circular reference crashes during JSON serialization.
 * 
 * @param {any} metadata 
 * @returns {Object} Clean metadata object
 */
function normalizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  // Handle Error instances passed directly as metadata
  if (metadata instanceof Error) {
    return {
      name: metadata.name,
      message: metadata.message,
      stack: metadata.stack,
    };
  }

  try {
    // Cycle-safe JSON normalization
    const cache = new Set();
    const serialized = JSON.stringify(metadata, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular]';
        }
        cache.add(value);
      }
      return value;
    });
    return JSON.parse(serialized);
  } catch (err) {
    return { unserializableMetadata: String(metadata) };
  }
}

/**
 * Strips trailing slashes from URLs.
 * @param {string} url 
 * @returns {string}
 */
function cleanUrl(url) {
  return url ? url.replace(/\/+$/, '') : '';
}

module.exports = {
  getIsoTimestamp,
  validateConfig,
  normalizeMetadata,
  cleanUrl,
};
