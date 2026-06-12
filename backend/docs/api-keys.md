# API Keys — LogLens

This document contains example requests and responses for the API Key management system.

Base path: `/api/v1`

Environment variables used in examples: `{{base_url}}`, `{{auth_token}}`, `{{projectId}}`, `{{apiKeyId}}`, `{{raw_api_key}}`

---

Create API Key

Request:

POST /api/v1/projects/:projectId/api-keys

Headers:
- `Authorization: Bearer <jwt>`

Body:

{
  "name": "ingest-key-1"
}

Success Response (201):

{
  "success": true,
  "data": {
    "id": "60f7c2...",
    "name": "ingest-key-1",
    "prefix": "abc12345",
    "rawKey": "ll_live_..."  // raw key shown only once
  }
}

Error cases:
- 401 Unauthorized: missing/invalid JWT
- 404 Project not found
- 409 Duplicate name

---

List API Keys

GET /api/v1/projects/:projectId/api-keys

Success Response (200):

{
  "success": true,
  "data": [
    { "id": "...", "name": "ingest-key-1", "prefix": "abc12345", "revoked": false, "createdAt": "...", "lastUsedAt": null }
  ]
}

---

Get single API Key

GET /api/v1/api-keys/:id

Success Response (200):
{
  "success": true,
  "data": { "id": "...", "name": "ingest-key-1", "prefix": "abc12345", "revoked": false, "createdAt": "...", "lastUsedAt": null }
}

---

Revoke API Key

PATCH /api/v1/api-keys/:id/revoke

Response (200):

{
  "success": true,
  "data": { "id": "...", "revoked": true }
}

If already revoked, response is idempotent and returns revoked=true.

---

Delete API Key

DELETE /api/v1/api-keys/:id

Response (200):

{
  "success": true,
  "message": "API key deleted"
}

---

Authentication Example (Ingestion)

Request (example log ingestion endpoint):

POST /api/v1/logs
Headers: `x-api-key: ll_live_<...>`

Success (200/201 depending on ingestion endpoint):

- If API key valid: request proceeds and `req.project` is attached by `authenticateApiKey` middleware.
- If API key missing/invalid/revoked: 401 with appropriate error code (e.g., `API_KEY_INVALID`, `API_KEY_REVOKED`).
