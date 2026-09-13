# Worker Architecture

For high-volume logs, the flow should be asynchronous where the current architecture supports it:

```text
                 API
                  │
                  ▼
            Log Ingestion
                  │
                  ▼
             ┌────────┐
             │ Queue  │
             └───┬────┘
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
   Worker 1  Worker 2  Worker N
       │         │         │
       └─────────┼─────────┘
                 ▼
             Processing
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
   Database  Elasticsearch Analytics
```

If a worker fails:

```text
Job
 ↓
Worker
 ↓
Failure
 ↓
Retry with bounded backoff
 ↓
Success
```

or:

```text
Retry exhausted
       ↓
Dead Letter / Failure handling
       ↓
Operational visibility
```

And jobs should be **idempotent** where duplicate execution is possible.
