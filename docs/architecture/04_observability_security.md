# Observability Architecture

Your observability layer sits across the entire system rather than being another isolated service.

```text
                     REQUEST
                        │
                        ▼
                      API
                        │
                 Trace Context
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
           Service    Worker    Database
              │         │         │
              └─────────┼─────────┘
                        │
                 Trace / Span
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
        Logs          Metrics       Traces
          │             │             │
          ▼             ▼             ▼
      LogLens       Metrics       Tracing
      Pipeline      Backend       Backend
          │             │             │
          └─────────────┼─────────────┘
                        ▼
                 Observability UI
```

This allows something like:

```text
Error
 ↓
Service
 ↓
Request ID
 ↓
Trace ID
 ↓
Span
 ↓
Database operation
```

instead of treating each log as an isolated text record.

---

# Security Architecture

Security should surround the whole system:

```text
                    ┌───────────────────────────┐
                    │        SECURITY           │
                    │                           │
                    │ Authentication            │
                    │ Authorization             │
                    │ Input Validation          │
                    │ Rate Limiting              │
                    │ Secret Management          │
                    │ Encryption                 │
                    │ Log Redaction              │
                    │ CORS / Network Controls   │
                    └─────────────┬─────────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
         Frontend              Backend              Workers
                                  │                    │
                                  ▼                    ▼
                              Database             Queue
                                  │
                                  ▼
                             Elasticsearch
```

Secrets should come from the appropriate runtime/deployment configuration, **never from source code**.
