import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import { sanitizeLogOutput } from './logSanitizer';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format that sanitizes messages before writing to any transport.
// This ensures API keys, tokens, and secrets are redacted from all log outputs.
const sanitizeFormat = format((info) => {
  info.message = sanitizeLogOutput(info.message);
  return info;
})();

const logFormat = format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level.toUpperCase()} ${message}`;
});

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    sanitizeFormat,
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(logsDir, 'app.log') }),
  ],
});

