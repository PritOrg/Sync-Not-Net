# Phase 2.1.2 Documentation Audit

Generated: March 23, 2026
Status: COMPLETE
Scope: API documentation consistency against current backend implementation

---

## Audit Summary

- Implemented route handlers scanned: 52
- Documentation files audited:
  - API_ROUTES_DOCUMENTATION.md
  - ERROR_CODES.md
  - PERMISSION_MATRIX.md
- Overall result: documentation is partially accurate, with significant drift in notebook permissions/sharing, versioning, and data model examples.

---

## Critical Findings

### 1) Documented routes that are not implemented

- POST /api/notebooks/:id/share
- GET /api/notebooks/:id/versions/:versionId
- POST /api/notebooks/:id/versions/:versionId/restore
- GET /api/notebooks/categories
- GET /api/notebooks/:id/export
- POST /api/notebooks/import
- GET /api/users/activity
- GET /api/notebooks/:id/activity
- GET /api/analytics/overview
- POST /api/notebooks/guest-access
- GET /api/notebooks/guest/:token

Impact: frontend integration work may target non-existent endpoints.

### 2) Implemented routes missing from docs

- GET /api/users/search
- GET /api/users/find/:id
- GET /api/users (admin route)
- PUT /api/notebooks/:id/url
- PUT /api/notebooks/:id/permissions
- PUT /api/notebooks/:id/collaborators
- PUT /api/notebooks/:id/settings/url
- PUT /api/notebooks/:id/settings
- PUT /api/notebooks/:id/tags
- Full tag route family in tagRoutes.js

Impact: missing docs for active endpoints increases integration and QA blind spots.

### 3) Parameter shape mismatches

- Guest registration is implemented as POST /api/notebooks/:urlIdentifier/register-guest, not :id.
- Password verification is implemented as POST /api/notebooks/:urlIdentifier/verify-password, not :id.
- Primary read route is GET /api/notebooks/:urlIdentifier, while docs emphasize GET /api/notebooks/:id.

Impact: callers using documented path params can hit wrong handlers or fail.

### 4) Response contract mismatch

- GET /api/users/profile active response is a flat object in the first handler (id, name, email, ...), but documentation describes { user: { ... } } envelope.

Impact: frontend consumers relying on documented shape can break.

---

## Code-Level Consistency Risks Found During Audit

These are not just documentation issues; they also affect endpoint behavior consistency:

- Duplicate route definition: GET /api/users/profile appears twice in userRoutes.js.
- Duplicate route definition: GET /api/notebooks/search appears twice in notebookRoutes.js.
- Duplicate route definition: GET /api/notebooks/tags appears twice in notebookRoutes.js.

Likely effect: earlier route handlers shadow later ones, making documented behavior ambiguous.

---

## ERROR_CODES.md Cross-Check

- Core codes used in routes are covered: 400, 401, 403, 404, 409, 429, 500, 503.
- Gap: 423 (Locked) is used in login flow for account lockout, but this code is not listed in the HTTP status table.

Action: add 423 to ERROR_CODES.md with lockout semantics.

---

## PERMISSION_MATRIX.md Cross-Check

Matrix currently reflects an older data model and permission vocabulary.

Mismatches:
- Matrix uses owner and permission fields, while active model uses creatorID and permissions enum: everyone | private | collaborators.
- Matrix documents collaborator levels view/edit/admin, but active notebook schema stores collaborator access as read/write.
- Several route examples in the matrix use paths or capabilities that do not exist in current code.

Action: rewrite matrix from active schema and active route guards.

---

## Recommended Remediation Order

1. Remove or consolidate duplicate route definitions in userRoutes.js and notebookRoutes.js.
2. Update API_ROUTES_DOCUMENTATION.md route list to match implemented endpoints and path params.
3. Align documented response payloads with actual responses for profile, notebook access, and settings routes.
4. Add missing 423 lockout code in ERROR_CODES.md.
5. Rewrite PERMISSION_MATRIX.md to match current schema and access checks.

---

## Exit Criteria for Phase 2.1.2

- Route list in docs is implementation-accurate.
- Path parameters are consistent (:id vs :urlIdentifier by endpoint).
- Response examples match actual payload shapes.
- Error code table includes all codes emitted by routes.
- Permission matrix reflects current data model and authorization behavior.
