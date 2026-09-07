# LogLens AI Service Test Suite Documentation

This directory contains the production-quality, multi-tiered test suite for the **LogLens FastAPI AI Microservice**.

## 1. Testing Pyramid Architecture

```text
             E2E Tests (1-2 Flows)
            /                     \
       Integration Tests (APIs, Middleware, Auth, Resilience)
        /                                                     \
   Unit Tests (Schemas, Settings, Providers, PromptBuilder, Services)
```

- **Unit Tests (`tests/unit/`)**: Blazing-fast tests isolating schemas, prompt builders, provider error mapping, and settings.
- **Integration Tests (`tests/integration/`)**: Fast HTTP integration tests using `httpx.AsyncClient` with `ASGITransport` verifying FastAPI routing, authentication headers (`X-Service-Key`), `X-Request-ID` correlation middleware, error handlers, and concurrency.
- **E2E Tests (`tests/e2e/`)**: Contract tests simulating end-to-end payload exchanges between the Express Node.js backend and the FastAPI service.

## 2. Test Execution Commands

Run all tests:
```bash
pytest
```

Run tests with verbose output:
```bash
pytest -v
```

Run tests with line and branch code coverage report:
```bash
pytest --cov=app --cov-report=term-missing
```

Run unit tests only:
```bash
pytest tests/unit
```

Run integration tests only:
```bash
pytest tests/integration
```

Run E2E tests only:
```bash
pytest tests/e2e
```

## 3. Key Design Principles

1. **Zero Real External API Calls**: All tests utilize `FakeProvider` or mocked Groq SDK objects, guaranteeing 100% deterministic execution and zero API costs.
2. **Secret scrubbing**: API keys and service keys are never exposed in logs or test assertions.
3. **Pydantic v2 Strict Validation**: Validation rules are systematically tested for missing fields, minimum length bounds, invalid types, and malformed inputs.
