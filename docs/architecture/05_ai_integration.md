# LLM/ML Architecture

These should **not sit directly in the critical ingestion path unless the existing architecture specifically requires it**.

Better flow:

```text
                  Stored Logs
                      │
             ┌────────┴────────┐
             ▼                 ▼
            LLM               ML
             │                 │
             ▼                 ▼
       Explanation        Anomaly Detection
       Summarization      Pattern Detection
       Root Cause         Prediction
             │                 │
             └────────┬────────┘
                      ▼
                 API / Results
                      │
                      ▼
                   Frontend
```

That means if the LLM provider is unavailable:

```text
LLM unavailable
      ↓
Core LogLens continues working
      ↓
AI feature shows graceful degradation
```

The core logging/search platform should not unnecessarily die because an AI provider is down.
