# Error Classification Architecture

Don't do:

```text
if message contains "Mongo":
    database
```

as the primary architecture.

Instead, the classifier should use **real service context**:

```text
                     LOG / ERROR
                         │
                         ▼
               ┌──────────────────┐
               │ Structured       │
               │ Context          │
               └────────┬─────────┘
                        │
              ┌─────────┼─────────┐
              │         │         │
              ▼         ▼         ▼
           Service    Exception  Trace
           Metadata    Type      Context
              │         │         │
              └─────────┼─────────┘
                        ▼
                ┌───────────────┐
                │ Classification│
                │ Engine        │
                └───────┬───────┘
                        │
          ┌─────────────┼──────────────┐
          ▼             ▼              ▼
       Service       Category       Severity
          │             │              │
          └─────────────┼──────────────┘
                        ▼
                Normalized Error
```

So if your architecture has a payment service, database service, authentication service, worker, etc., the classifier should use real service context.

If the structured context is unavailable, use this fallback hierarchy:

```text
Structured context
       ↓
Exception / stack information
       ↓
Known metadata
       ↓
Controlled fallback classification
       ↓
Unknown / Unclassified
```

**Do not force an incorrect classification.**

`unknown` is better than falsely saying `database`.
