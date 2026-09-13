# 1. High-Level Architecture

```text
                           ┌─────────────────────────┐
                           │        USERS            │
                           │ Developer / Admin       │
                           └────────────┬────────────┘
                                        │
                                        │ HTTPS
                                        ▼
                    ┌────────────────────────────────────┐
                    │              FRONTEND              │
                    │          React / Next.js           │
                    │                                    │
                    │ • Dashboard                        │
                    │ • Live Logs                         │
                    │ • Search                            │
                    │ • Filters                           │
                    │ • Error Analytics                   │
                    │ • Service View                      │
                    │ • Log Details                       │
                    │ • Trace Details                    │
                    │ • AI Analysis                       │
                    └───────────────┬────────────────────┘
                                    │
                     REST / HTTP + WebSocket
                                    │
                                    ▼
                 ┌─────────────────────────────────────────┐
                 │             API / BACKEND               │
                 │                                         │
                 │ • Authentication                         │
                 │ • Authorization                          │
                 │ • Request Validation                     │
                 │ • Log APIs                               │
                 │ • Search APIs                            │
                 │ • Analytics APIs                         │
                 │ • Error APIs                             │
                 │ • WebSocket Gateway                      │
                 │ • Health / Readiness                     │
                 └──────────────┬──────────────────────────┘
                                │
                ┌───────────────┼────────────────┐
                │               │                │
                ▼               ▼                ▼
        ┌──────────────┐ ┌──────────────┐ ┌───────────────┐
        │ Log Ingestion│ │ Search       │ │ AI / ML       │
        │ Service      │ │ Service      │ │ Service       │
        └──────┬───────┘ └──────┬───────┘ └───────┬───────┘
               │                │                 │
               ▼                │                 │
        ┌──────────────┐        │                 │
        │ Queue /      │        │                 │
        │ Broker       │        │                 │
        └──────┬───────┘        │                 │
               │                │                 │
               ▼                │                 │
        ┌──────────────┐        │                 │
        │ Log Worker   │        │                 │
        │ / Processor  │        │                 │
        └──────┬───────┘        │                 │
               │                │                 │
       ┌───────┼────────┐       │                 │
       │       │        │       │                 │
       ▼       ▼        ▼       ▼                 ▼
   Parse    Normalize  Classify Elasticsearch   LLM / ML
                     │
                     │
                     ▼
              ┌──────────────┐
              │ Persistence  │
              │ Database     │
              └──────────────┘
```

---

# 2. Actual LogLens Log Flow

This is the core of the project. It illustrates where the original application logs come from and how they flow through the system:

```text
        ┌───────────────────────┐
        │   APPLICATIONS        │
        │                       │
        │ Service A             │
        │ Service B             │
        │ Service C             │
        │ Worker                │
        │ External Services     │
        └───────────┬───────────┘
                    │
                    │ Logs
                    ▼
          ┌─────────────────────┐
          │   LOG INGESTION     │
          │                     │
          │ HTTP / File /       │
          │ Stream / Existing   │
          │ ingestion mechanism │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │   VALIDATION        │
          │                     │
          │ • Schema validation │
          │ • Size limits       │
          │ • Sanitization      │
          │ • Timestamp         │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │   NORMALIZATION     │
          │                     │
          │ • Timestamp         │
          │ • Severity          │
          │ • Message           │
          │ • Source            │
          │ • Metadata          │
          │ • Trace context     │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │ SERVICE DETECTION   │
          │                     │
          │ Structured metadata │
          │ + runtime context   │
          │ + fallback rules    │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │ ERROR CLASSIFIER    │
          │                     │
          │ Service             │
          │ Category            │
          │ Severity            │
          │ Error Type          │
          └──────────┬──────────┘
                     │
                     ├───────────────────┐
                     │                   │
                     ▼                   ▼
             ┌──────────────┐     ┌──────────────┐
             │ Database     │     │ Elasticsearch│
             │              │     │              │
             │ Persistence  │     │ Search       │
             │ Metadata     │     │ Filtering    │
             └──────────────┘     │ Aggregation  │
                                  └───────┬──────┘
                                          │
                                          ▼
                                  ┌──────────────┐
                                  │ Analytics    │
                                  │              │
                                  │ Errors       │
                                  │ Services     │
                                  │ Trends       │
                                  │ Aggregations │
                                  └───────┬──────┘
                                          │
                     ┌────────────────────┼─────────────────┐
                     │                    │                 │
                     ▼                    ▼                 ▼
              ┌────────────┐      ┌────────────┐     ┌────────────┐
              │ REST API   │      │ WebSocket  │     │ AI / ML    │
              └─────┬──────┘      └─────┬──────┘     └─────┬──────┘
                    │                   │                  │
                    └───────────────────┼──────────────────┘
                                        ▼
                              ┌──────────────────┐
                              │    FRONTEND      │
                              │                  │
                              │ Dashboard        │
                              │ Logs             │
                              │ Errors           │
                              │ Search           │
                              │ Analytics        │
                              │ AI Insights      │
                              └──────────────────┘
```
