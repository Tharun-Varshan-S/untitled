# LogLens Architecture Documentation

This folder contains the complete architecture documentation for the LogLens system, structured around the actual system flow and component responsibilities rather than forcing every technology into a flat structure.

## Important Principle
**Logs come from services → ingestion → processing/classification → storage/search → analysis → UI**, with observability, workers, security, and deployment supporting the whole system.

## Documents Index
1. [High-Level Overview & Log Flow](./01_high_level_overview.md)
2. [Error Classification Architecture](./02_error_classification.md)
3. [Worker & Async Pipeline Architecture](./03_worker_pipeline.md)
4. [Observability & Security Architecture](./04_observability_security.md)
5. [AI / ML Integration Architecture](./05_ai_integration.md)
6. [Deployment & CI/CD Architecture](./06_deployment_cicd.md)
7. [Final Complete Architecture & Principles](./07_final_architecture.md)
