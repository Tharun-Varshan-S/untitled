# AWS EC2 Deployment Architecture

Since the EC2 deployment is completed, the production topology conceptually looks like this:

```text
                         INTERNET
                             │
                           HTTPS
                             │
                             ▼
                    ┌─────────────────┐
                    │     AWS EC2     │
                    │                 │
                    │ Reverse Proxy   │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
               Frontend             Backend
                                       │
                           ┌───────────┼───────────┐
                           │           │           │
                           ▼           ▼           ▼
                       Database     Search      Queue
                           │           │           │
                           │           │           ▼
                           │           │        Workers
                           │           │
                           └───────────┼───────────┘
                                       │
                                       ▼
                                Observability
```

The exact containers/services come from the repository, not from this conceptual diagram.

---

# CI/CD Architecture

Your complete delivery flow:

```text
Developer
    │
    ▼
GitHub
    │
    ▼
Pull Request / Push
    │
    ▼
┌──────────────────────┐
│        CI            │
│                      │
│ Install              │
│ Lint                 │
│ Type Check           │
│ Unit Tests           │
│ Integration Tests    │
│ Build                │
│ Security Checks      │
│ Docker Build         │
└──────────┬───────────┘
           │
        PASS?
        /   \
      NO     YES
      │       │
      ▼       ▼
   Stop     Artifact
               │
               ▼
             CD
               │
               ▼
         Deploy to AWS
               │
               ▼
         Health Checks
               │
               ▼
         Smoke Tests
               │
               ▼
          Production
```

Do not add a CI/CD stage just because the diagram contains it. Verify what the current pipeline actually does.
