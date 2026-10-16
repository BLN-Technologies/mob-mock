/**
 * Cargo Mobile V1 - Centralized Logging & Diagnostic Observability
 * Sanitizes and redacts commercially sensitive farmer data, credentials, and tokens.
 */

import { config } from '../config/env';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, any>;
  timestamp: string;
}

const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'secret', 'tin', 'nationalId'];

/**
 * Recursively redacts sensitive keys from log payloads.
 */
function sanitizePayload(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizePayload);

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object') {
      sanitized[key] = sanitizePayload(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export const logger = {
  debug(message: string, context?: string, data?: Record<string, any>): void {
    if (config.isDemo) {
      // In development / demo mode, record safe sanitized diagnostics
      this.writeLog('DEBUG', message, context, data);
    }
  },

  info(message: string, context?: string, data?: Record<string, any>): void {
    this.writeLog('INFO', message, context, data);
  },

  warn(message: string, context?: string, data?: Record<string, any>): void {
    this.writeLog('WARN', message, context, data);
  },

  error(message: string, context?: string, error?: any): void {
    const errorData = error instanceof Error
      ? { message: error.message, name: error.name }
      : error;
    this.writeLog('ERROR', message, context, errorData);
  },

  writeLog(level: LogLevel, message: string, context?: string, data?: any): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      context,
      data: sanitizePayload(data),
      timestamp: new Date().toISOString(),
    };
    return entry;
  },
};
