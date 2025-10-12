# Improvement Plan & Findings — Sync-Not-Net

Date: 2025-10-12

This document lists findings from a quick audit of the repository and a prioritized plan of improvements to make the service production-ready. It also summarizes small safe fixes already applied to the `api/` codebase during the audit.

## Summary of quick fixes already applied

- api/models/notebookModel.js
  - Updated `permissions` enum from `['everyone','creator-only','collaborators']` to `['everyone','private','collaborators']` so it matches route logic that expects `private`.

- api/index.js
  - Replaced brittle collaborator checks (ObjectId includes) with safe string comparisons: `collaborators.some(c => c.toString() === socket.userId)`.
  - Enabled auth rate limiting for `/api/users/login` and `/api/users/register` when `NODE_ENV === 'production'`.
  - Added a simple in-memory per-IP socket connection counter (configurable via `SOCKET_MAX_CONNECTIONS_PER_IP`, default `10`) to reduce socket DoS risk. Count is decremented on disconnect.

These were small, low-risk improvements to fix immediate mismatches and surface-level security/availability risks.

## High-level findings (major items)

1) Secrets & configuration
   - `JWT_SECRET` fallback present in code (dangerous in prod). Require a JWT secret via env in production and fail fast if missing.
   - Add `.env.example` listing required vars: MONGODB_URI, JWT_SECRET, NODE_ENV, PORT, CORS_ORIGIN, REDIS_URL (if applicable), SOCKET_MAX_CONNECTIONS_PER_IP, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS.

2) Authentication & account security
   - Improve token lifecycle: short-lived JWT access tokens and refresh tokens; support token revocation/blacklisting if needed.
   - Add account lockout or progressive delay for repeated failed login attempts.

3) Socket.IO scaling and reliability
   - Current socket state (activeUsers, notebookUsers, ipConnections) is in-memory which breaks when scaling to multiple nodes. Use Redis adapter for socket.io (e.g., `@socket.io/redis-adapter`) and store per-IP and per-room state in Redis.
   - Replace the simple in-memory ipConnections with a Redis counter when you deploy multiple instances.

4) Concurrency model for collaborative edits
   - The current server implements simple version checks and increments `notebook.version` on save. This is fine for basic usage but will break under concurrent edits by multiple editors.
   - Consider implementing Operational Transformation (OT) or CRDT-based synchronization for reliable conflict resolution (e.g., Automerge, Yjs, or implementing via server-side transformation). This is a non-trivial change.

5) Input validation and sanitization
   - There is validation middleware present (`api/middlewares/validation.js`) — ensure all routes use it consistently.
   - Protect any endpoints that accept free-form content (HTML, XML) against XSS, injection, and malicious attachments. Current project includes `express-xss-sanitizer` and mongo sanitize — keep those in place and test thoroughly.

6) Rate limiting and abuse protection
   - General limiter exists but consider using a distributed rate limiter (Redis-backed) for multi-instance deployments.

7) Logging, observability, and error reporting
   - Consider integrating structured logs (winston JSON outputs) and a central error tracking tool (Sentry). Add request IDs to correlate HTTP and socket events. Ensure logging of security-relevant events (failed logins, invalid tokens, rate-limit hits).

8) Testing
   - Add unit tests for auth, notebook creation, password verification, and socket events.
9) Deployment
   - Use HTTPS with a reverse proxy (nginx) or platform-managed TLS. Use PM2 or Docker + orchestration (Kubernetes/App Service) for process management.
   - If you plan to allow file uploads or large notebooks, add streaming and chunking.

## Medium/minor issues & cleanups

- Duplicate and inconsistent routes exist in `api/routes/userRoutes.js` (several `GET /search` blocks and duplicate `/profile`). Consolidate and remove duplicates.
- Avoid console.log in production code — use the `logger` utility.
- Protect responses that can leak PII. When returning user lists for collaborator search, limit fields returned and avoid exposing emails unless necessary.
- Add indexes to MongoDB collections for fields used in lookups: `urlIdentifier`, `creatorID`, `updatedAt`, `tags`.
- Add `limit`/`max` checks to endpoints accepting arrays (collaborators, tags) to prevent abuse and huge payloads (there are some validations already; ensure they cover all endpoints).

## Concrete file-level action items (prioritized)

P0 — must do before production:
- Enforce presence of `JWT_SECRET` in production and remove fallback secret. Files: `api/index.js`, `api/middlewares/verifyToken.js`.
- Move socket shared state to Redis and use `@socket.io/redis-adapter`. Files: `api/index.js` (socket init) and a new `api/utils/socketStore.js` (wrapper around Redis). Add `REDIS_URL` env.
- Ensure rate limiters are Redis-backed for distributed rate limiting: `express-rate-limit` with redis store.

P1 — high priority:
- Implement login throttling/account lockouts (userRoutes.js + security middleware). Add alerts on repeated failed attempts.
- Implement safer collaborator comparison and ensure route-level checks match socket checks (already updated in some places).
- Add server-side content scanning/sanitization and size limits for notebook content.

P2 — medium priority:
- Add integration tests for socket flows and notebook updates. Use Jest + supertest + socket.io-client for testing.
- Add Sentry or equivalent for error reporting.

P3 — optional/longer term:
- Implement OT/CRDT for collaborative editing (Yjs or Automerge). This will likely require changes to both `pro` (frontend editor) and `api` (sync server)
- Add a background job to compact old notebook versions and rotate logs.

## Closing notes

I focused on server-side items because they are higher-risk from a security and availability perspective. The frontend (`pro/`) also needs review for security headers, correct CORS usage, token storage best practices, and editor integration if you plan to move to OT/CRDT.
