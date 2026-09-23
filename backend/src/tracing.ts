/**
 * tracing.ts — OpenTelemetry instrumentation bootstrap.
 *
 * MUST be imported before any other module in index.ts via --require or
 * the explicit import at the top of the entry point.
 *
 * What is traced:
 * - HTTP requests (via auto-instrumentation)
 * - MongoDB operations (via mongoose/mongodb auto-instrumentation)
 * - Redis operations (via ioredis auto-instrumentation)
 * - BullMQ job processing (spans around worker job handlers)
 *
 * OTLP exporter endpoint: configured via OTEL_EXPORTER_OTLP_ENDPOINT env var.
 * When the env var is absent, traces are exported to console in dev mode.
 *
 * This module is safe to import unconditionally — if OTEL is not configured
 * (no OTLP endpoint, NODE_ENV=test) it registers a NoopTracerProvider.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? 'loglens-backend';
const SERVICE_VERSION = process.env.npm_package_version ?? '1.0.0';
const OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// Never trace in test environments — it adds noise and timeouts
// Also respect the standard OTEL_SDK_DISABLED env var (used in CI)
const OTEL_DISABLED = process.env.OTEL_SDK_DISABLED === 'true';

if (NODE_ENV !== 'test' && !OTEL_DISABLED) {
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
    'deployment.environment': NODE_ENV,
  });

  const spanProcessors = [];

  if (OTLP_ENDPOINT) {
    // Production: export to OTLP collector (Jaeger, Tempo, etc.)
    const otlpExporter = new OTLPTraceExporter({
      url: OTLP_ENDPOINT,
    });
    spanProcessors.push(new BatchSpanProcessor(otlpExporter));
  } else if (NODE_ENV === 'development') {
    // Development: log spans to console for visibility
    spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }
  // In production without OTLP endpoint, spans are still collected for context propagation
  // but not exported. This is intentional — we do not want silent export failures in prod.

  const sdk = new NodeSDK({
    resource,
    spanProcessors,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable file system instrumentation — too noisy, negligible value
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
        // Disable DNS — redundant with HTTP traces
        '@opentelemetry/instrumentation-dns': {
          enabled: false,
        },
        '@opentelemetry/instrumentation-http': {
          // Suppress health check spans — they pollute traces
          ignoreIncomingRequestHook: (request) => {
            const url = request.url ?? '';
            return url === '/health' || url === '/api/v1/health';
          },
        },
      }),
    ],
  });

  sdk.start();

  // Graceful shutdown: flush pending spans before process exit
  process.on('SIGTERM', () => {
    sdk.shutdown().catch((err) => {
      console.error('OTel SDK shutdown error:', err);
    });
  });

  process.on('SIGINT', () => {
    sdk.shutdown().catch((err) => {
      console.error('OTel SDK shutdown error:', err);
    });
  });
}
