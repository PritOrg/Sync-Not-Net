# HANDOFF.md — Sync Note Net

> **Any agent can read this file and know exactly where things stand.**
> Last updated: March 29, 2026

---

## What This Is

MERN stack collaborative note-taking platform. Monaco/Quill editors, real-time Socket.io, JWT auth, version control, comments, collaborators, password protection, guest access, favorites.

---

## Current Status

| Area | Status |
|------|--------|
| **Tests** | 138 passing (10 suites) — but `npm test` currently **times out** (MongoMemoryServer issue) |
| **Phases 1–6** | ✅ Complete |
| **Phase 7** | ⏳ Conflict resolution — placeholder exists, not implemented |
| **Production readiness** | Not ready — see [improvemnent.md](./improvemnent.md) for P0/P1/P2 items |
| **Profile page** | ✅ Enhanced with real data, activity tracking, and stats |
| **Notebook listing** | ✅ Fixed queries and behavior (owned + shared only) |
| **Presentation** | ✅ Redesigned with modern UI/UX and updated content |

---

## What's Done

- User auth (register, login, JWT, bcrypt)
- Notebook CRUD with version history (auto-version on every save)
- Real-time comments via Socket.io (add/edit/delete/reply)
- Collaborator management (read/write/admin levels)
- Password protection (applies to owner + collaborator + guest)
- Guest user registration with name
- Favorites system + shared notebooks view
- Remote cursors (basic, throttled)
- Share dialog with QR code
- Modern UI (Landing, Auth, Dashboard, Editor)
- 138 backend tests across 10 suites
- Security middleware (helmet, rate limiting, xss-sanitize, mongo-sanitize, hpp)
- Sentry integration (if DSN provided)
- Redis adapter for Socket.io (if REDIS_URL provided)
- Environment validation on startup
- **Profile page with real data, activity tracking, and enhanced stats**
- **Improved notebook listing (owned + shared notebooks only, excludes public)**
- **Redesigned presentation.html with modern UI/UX**
- **Fixed notebook queries to use correct field names (`collaborators.userId`)**

---

## What's Next (Priority Order)

1. **Profile page enhancements** — ✅ Completed (real data, activity tracking, stats)
2. **Notebook listing fixes** — ✅ Completed (correct queries, owned + shared only)
3. **Presentation updates** — ✅ Completed (modern UI/UX, updated content)
4. **Fix test timeout** — `npm test` hangs (MongoMemoryServer.create() in beforeAll)
5. **Conflict resolution dialog** — placeholder in EnhancedNotebookEditor.jsx
6. **Export/import** — notebooks as JSON/Markdown/PDF
7. **Mobile responsiveness** — editor and dashboard
8. **Offline support** — service workers, local queue
9. **JWT_SECRET enforcement** — remove fallback, fail fast in production
10. **Login throttling / account lockout** — progressive delay on failed attempts

---

## File Locations

### Backend (`api/`)

| File | Purpose |
|------|---------|
| `api/index.js` | Express + Socket.io server (538 lines) |
| `api/routes/notebookRoutes.js` | All notebook endpoints (2700+ lines) |
| `api/routes/commentRoutes.js` | Comments CRUD + Socket.io events |
| `api/routes/userRoutes.js` | User auth + search |
| `api/models/notebookModel.js` | Notebook schema (versions, collaborators, password) |
| `api/models/userModel.js` | User schema (favorites field) |
| `api/models/commentModel.js` | Comment schema |
| `api/middlewares/verifyToken.js` | JWT verification |
| `api/middlewares/security.js` | Rate limiter, helmet, cors |
| `api/middlewares/errorHandler.js` | Global error handler |
| `api/middlewares/validation.js` | express-validator rules |
| `api/utils/validateEnv.js` | Startup env validation |
| `api/utils/logger.js` | Winston logger |

### Frontend (`pro/`)

| File | Purpose |
|------|---------|
| `pro/src/NotebookEditorPage/EnhancedNotebookEditor.jsx` | Main editor (1200+ lines) |
| `pro/src/NotebookEditorPage/CommentsPanel.jsx` | Real-time comments |
| `pro/src/NotebookEditorPage/CollaboratorsSettingsDialog.jsx` | Collaborator management |
| `pro/src/NotebookEditorPage/PasswordSettingsDialog.jsx` | Password settings |
| `pro/src/NotebookEditorPage/ShareDialog.jsx` | Share + QR code |
| `pro/src/NotebookEditorPage/UnifiedAccessPrompt.jsx` | Guest name + password prompts |
| `pro/src/NotebooksPage/NotebooksDashboard.jsx` | Dashboard with filters |
| `pro/src/SigninSignup/ModernAuthPage.jsx` | Login/Register |
| `pro/src/LandingPage/ModernLandingPage.jsx` | Landing page |
| `pro/src/Components/EnhancedEditor.jsx` | Monaco/Quill wrapper |
| `pro/src/Components/RemoteCursorsOverlay.jsx` | Remote cursor display |
| `pro/src/Components/ToastProvider.jsx` | Global notifications |
| `pro/src/NotebookEditorPage/NotebookUrlSettingsDialog.jsx` | URL personalization dialog |
| `pro/src/utils/errorHandler.js` | Error handling utilities |
| `pro/src/utils/apiRoutes.js` | API route definitions |
| `pro/src/utils/validation.js` | Validation utilities |

### Tests (`api/tests/`)

| File | Tests |
|------|-------|
| `users.test.js` | 16 |
| `versions.test.js` | 30 |
| `comments.test.js` | 18 |
| `collaborators.test.js` | 21 |
| `cursors.test.js` | 13 |
| `share.test.js` | 15 |
| `management.test.js` | 25 |
| `auth.test.js`, `health.test.js`, `notebookVersions.test.js` | — |

---

## Environment Variables

See `api/.env.example` for full list. Key ones:

```
MONGODB_URI          # MongoDB Atlas connection string
MONGODB_TEST_URI     # Local MongoDB for tests
JWT_SECRET           # REQUIRED in production (no fallback)
JWT_EXPIRES_IN       # Default: 24h
PORT                 # Default: 5000
NODE_ENV             # development | production | test
CORS_ORIGIN          # Default: http://localhost:3000
REDIS_URL            # redis://localhost:6379 (optional, enables Socket.io adapter)
SENTRY_DSN           # Optional, enables error tracking
RATE_LIMIT_WINDOW_MS # Default: 900000 (15 min)
RATE_LIMIT_MAX_REQUESTS # Default: 100
LOG_LEVEL            # Default: info
```

Frontend env: `pro/.env` and `pro/.env.local`

---

## How to Run

```bash
# Backend
cd api && npm install && npm start

# Frontend
cd pro && npm install && npm start

# Tests (currently times out — needs fix)
cd api && npm test
```

---

## Import Conventions

**Backend:**
- CommonJS (`require`/`module.exports`)
- Models: `require('../models/notebookModel')`
- Middleware: `require('../middlewares/verifyToken')`
- Utils: `require('../utils/logger')`

**Frontend:**
- ES Modules (`import`/`export`)
- Components: `import EnhancedEditor from '../Components/EnhancedEditor'`
- MUI: `import { Button, Dialog } from '@mui/material'`
- Axios: `import axios from 'axios'`
- Socket: `import { io } from 'socket.io-client'`
- Animations: `import { motion } from 'framer-motion'`

---

## API Endpoints (Quick Reference)

**Auth:** `POST /register`, `POST /login`, `GET /profile`, `GET /stats`, `GET /activity`, `GET /search?q=`

**Notebooks:** `GET /` `POST /` `GET /:urlId` `PUT /:id` `DELETE /:id`
- `/favorites`, `/shared`, `/:id/password`, `/:id/collaborators`, `/:id/favorite`, `/:id/url`
- `/:urlId/register-guest`, `/:urlId/verify-password`

**Comments:** `GET|POST /:notebookId/comments`, `PUT|DELETE /:notebookId/comments/:commentId`

**Versions:** `GET /:id/versions`, `GET /:id/versions/:versionId`, `POST /:id/versions/:versionId/restore`

All routes prefixed with `/api/notebooks`, `/api/users`, `/api/notebooks/:notebookId/comments`

**Important Changes:**
- `GET /api/notebooks` now returns only owned + shared notebooks (excludes public notebooks)
- `GET /api/users/profile` now includes `lastLogin` and `profilePicture` fields
- `GET /api/users/stats` returns notebook counts with correct field names (`creatorID`, `collaborators.userId`)
- `GET /api/users/activity` returns recent notebooks with access level information

---

## Socket.io Events

`notebookUpdated`, `commentAdded`, `commentUpdated`, `commentDeleted`, `userCursorPosition`, `userJoined`, `userLeft`, `collaboratorUpdated`, `collaboratorRemoved`

---

## Recent Changes (March 29, 2026)

### Commits (branch: refactor/code-cleanup)

**f9c98f3** - Fix guest access blank skeleton by preventing unnecessary refetch after guest registration
- Added check in `fetchNotebookData` to prevent refetch when notebook data already exists

**5a2ca47** - Update README and presentation with latest features
- Complete UI/UX redesign of presentation.html
- Updated README with current implementation

**842e990** - Frontend improvements: profile page, dashboard, share dialog, error handling
- ProfilePage.jsx: Activity tab, last login, profile picture, real stats
- Dashboard: Fixed queries, owned + shared only
- ShareDialog: URL personalization (quick edit + advanced settings)
- CommentsPanel: Real-time sync, deduplication, ID guards
- Added errorHandler.js, apiRoutes.js, validation.js utilities

**62680f7** - Backend fixes: user stats, notebook queries, comment schema, security updates
- notebookRoutes.js: Fixed `collaborators.userId` field names
- userRoutes.js: Fixed stats, added activity endpoint, `lastLogin`/`profilePicture`
- commentModel.js: Added likes support, normalization
- commentRoutes.js: Real-time events for likes
- Added collaborationRequestModel.js, collaborationRequestRoutes.js
- Security middleware updates

### New Files Added
- `api/config.js` - Centralized configuration
- `api/models/collaborationRequestModel.js` - Collaboration request schema
- `api/routes/collaborationRequestRoutes.js` - Collaboration request endpoints
- `pro/src/NotebookEditorPage/NotebookUrlSettingsDialog.jsx` - URL personalization dialog
- `pro/src/config.js` - Frontend configuration
- `pro/src/utils/apiRoutes.js` - API route definitions
- `pro/src/utils/errorHandler.js` - Error handling utilities
- `pro/src/utils/validation.js` - Validation utilities
- `presentation.html` - Modern project presentation

## Key Documentation Files

| File | Content |
|------|---------|
| `HANDOFF.md` | This file — agent onboarding |
| `.opencode/CONTEXT.md` | Project context (mirrors this) |
| `improvemnent.md` | P0/P1/P2/P3 production readiness items |
| `PHASE_2_PLAN.md` | Detailed Phase 2 testing plan |
| `PROGRESS_TRACKER.md` | Phase-by-phase progress (Phases 1–7) |
| `API_ROUTES_DOCUMENTATION.md` | Full API docs |
| `API_ROUTES_INVENTORY.md` | Route inventory |
| `FRONTEND_COMPONENT_INVENTORY.md` | Component ↔ route mapping |
| `PERMISSION_MATRIX.md` | Access level rules |
| `ERROR_CODES.md` | Error code reference |
| `DEPLOYMENT.md` | Deployment guide |
| `presentation.html` | Project presentation with modern UI/UX (updated March 29, 2026) |

---

## Known Issues

1. **Tests timeout** — MongoMemoryServer.create() hangs in beforeAll
2. **No conflict resolution** — placeholder exists, needs OT/CRDT or merge UI
3. **JWT_SECRET fallback** — insecure default in code
4. **In-memory socket state** — breaks with multiple server instances (Redis adapter exists but optional)
5. **PROGRESS_TRACKER.md** — says "113 tests" but CONTEXT.md says "138" — actual count may differ

### Recently Fixed Issues
1. ✅ **Notebook listing queries** — Fixed collaborator field names and excluded public notebooks from dashboard
2. ✅ **Profile page data** — Now shows real stats, activity, and user details from API
3. ✅ **Stats endpoint accuracy** — Correct field names for notebook counts
4. ✅ **Populate calls** — Updated all `populate('collaborators', ...)` to `populate('collaborators.userId', ...)`
5. ✅ **Guest access blank skeleton** — Fixed unnecessary refetch after guest registration
6. ✅ **Settings drawer errors** — Fixed `onUrlSettings` undefined and `item.onClick` function errors
7. ✅ **Share dialog URL personalization** — Quick edit and advanced URL settings dialogs work correctly
