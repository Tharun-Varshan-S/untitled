/**
 * tracing.helpers.ts
 *
 * Thin wrappers around the OTel API for manual instrumentation.
 * Used to add custom spans around BullMQ job handlers and AI service calls.
 *
 * Always safe to use — if OTel is not configured (test env, no SDK),
 * the API returns a NoopTracer that does nothing.
 */

import { trace, context, SpanStatusCode, type Tracer, type Span } from '@opentelemetry/api';

const SERVICE_TRACER_NAME = 'loglens-backend';

function getTracer(): Tracer {
  return trace.getTracer(SERVICE_TRACER_NAME);
}

/**
 * Wraps an async function in an OTel span.
 * The span ends automatically after the function resolves or throws.
 *
 * @example
 * const result = await withSpan('worker.processLog', { 'log.id': logId }, async (span) => {
 *   // ... do work ...
 *   return someValue;
 * });
 */
export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, async (span) => {
    span.setAttributes(attributes);
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Records an error on the current active span without ending it.
 * Used in try/catch blocks where the span is managed externally.
 */
export function recordSpanError(error: unknown): void {
  const span = trace.getActiveSpan();
  if (!span) return;
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error instanceof Error ? error.message : String(error),
  });
  span.recordException(error instanceof Error ? error : new Error(String(error)));
}

/**
 * Adds key-value attributes to the current active span.
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
  const span = trace.getActiveSpan();
  if (!span) return;
  span.setAttributes(attributes);
}
