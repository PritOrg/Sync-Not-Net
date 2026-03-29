<p align="center">
  <img src="https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge&logo=mongodb" alt="MERN Stack" />
  <img src="https://img.shields.io/badge/Tests-138%20passing-brightgreen?style=for-the-badge&logo=jest" alt="Tests" />
  <img src="https://img.shields.io/badge/Real--time-Socket.io-black?style=for-the-badge&logo=socket.io" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js" alt="Node.js" />
</p>

<h1 align="center">Sync Note Net</h1>

<p align="center">
  Collaborative note-taking platform with real-time editing, version control, and rich collaboration features.
</p>

<p align="center">
  <a href="#-features">Features</a> &bull;
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#-architecture">Architecture</a> &bull;
  <a href="#-api-reference">API</a> &bull;
  <a href="#-deployment">Deployment</a> &bull;
  <a href="#-testing">Testing</a>
</p>

---

## What is Sync Note Net?

Sync Note Net is a full-stack collaborative note-taking platform built with the MERN stack. Create rich-text or code notebooks, collaborate in real-time with Socket.io, track version history, manage collaborators with granular permissions, and share notebooks with password protection and guest access.

**Key capabilities:**
- Rich text editing (Quill) and code editing (Monaco) in the same platform
- Real-time collaboration with remote cursors and live updates
- Full version history with restore and diff comparison
- Collaborator management with read/write/admin access levels
- Password protection and guest access with QR code sharing
- Favorites, search, and notebook organization

---

## Features

| Feature | Description |
|---------|-------------|
| **Rich Text Editor** | Quill-based WYSIWYG editor for notes and documents |
| **Code Editor** | Monaco Editor (VS Code engine) with syntax highlighting |
| **Real-time Collaboration** | Socket.io-powered live editing with presence indicators |
| **Remote Cursors** | See other users' cursor positions in real-time |
| **Version History** | Every save creates a version; restore any previous state |
| **Version Comparison** | Side-by-side diff view between any two versions |
| **Comments** | Threaded comments with replies, real-time updates |
| **Collaborators** | Add users with read/write/admin permission levels |
| **Password Protection** | Protect notebooks with bcrypt-hashed passwords |
| **Guest Access** | Unauthenticated users can register as guests and view |
| **Favorites** | Star notebooks for quick access |
| **Share Dialog** | Shareable links with QR code generation |
| **Auto-save** | Configurable auto-save with visual indicators |
| **Responsive UI** | Material UI with Framer Motion animations |
| **Centralized Error Handling** | API error utilities for consistent user feedback |

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- **MongoDB** 6.0+ (local or Atlas)
- **npm** or **yarn**

### One-command start

```bash
git clone https://github.com/PritOrg/Sync-Not-Net.git
cd Sync-Not-Net
npm run setup    # installs dependencies + creates .env files
npm start        # starts backend (port 5000) + frontend (port 3000)
```

### Manual setup

```bash
# Backend
cd api
cp .env.example .env    # edit with your MongoDB URI and JWT_SECRET
npm install
npm start               # runs on http://localhost:5000

# Frontend (new terminal)
cd pro
npm install
npm start               # runs on http://localhost:3000
```

### Environment Variables

**`api/.env`:**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sync-note-net
JWT_SECRET=your-super-secure-secret-minimum-32-characters
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
REDIS_URL=redis://localhost:6379          # optional, enables Socket.io adapter
SENTRY_DSN=                               # optional, enables error tracking
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

**`pro/.env`:**
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

---

## Architecture

```
Sync-Not-Net/
├── api/                          # Backend (Express + Socket.io)
│   ├── index.js                  # Server entry point, Socket.io setup
│   ├── routes/
│   │   ├── userRoutes.js         # Auth, profile, user search
│   │   ├── notebookRoutes.js     # Notebook CRUD, versions, collaborators, sharing
│   │   └── commentRoutes.js      # Comments CRUD + real-time
│   ├── models/
│   │   ├── userModel.js          # User schema (bcrypt, lockout)
│   │   ├── notebookModel.js      # Notebook schema (versions, collaborators, password)
│   │   ├── commentModel.js       # Comment schema (threaded replies)
│   │   ├── notebookVersionModel.js  # Version snapshots
│   │   └── tagModel.js           # Tag schema
│   ├── middlewares/
│   │   ├── verifyToken.js        # JWT verification
│   │   ├── security.js           # Helmet, rate limiting, CORS
│   │   ├── errorHandler.js       # Global error handler
│   │   └── validation.js         # express-validator rules
│   └── utils/
│       ├── logger.js             # Winston logger
│       ├── validateEnv.js        # Startup env validation
│       └── xmlContent.js         # XML content conversion
│
├── pro/                          # Frontend (React + Material UI)
│   └── src/
│       ├── NotebookEditorPage/
│       │   ├── EnhancedNotebookEditor.jsx    # Main editor (1200+ lines)
│       │   ├── CommentsPanel.jsx             # Real-time comments
│       │   ├── CollaboratorsSettingsDialog.jsx
│       │   ├── PasswordSettingsDialog.jsx
│       │   ├── PermissionsSettingsDialog.jsx
│       │   ├── ShareDialog.jsx               # QR code + social sharing
│       │   ├── UnifiedAccessPrompt.jsx       # Guest/password prompts
│       │   ├── VersionHistoryDialog.jsx
│       │   └── VersionComparisonDialog.jsx
│       ├── NotebooksPage/
│       │   └── NotebooksDashboard.jsx        # Card grid + filters
│       ├── Components/
│       │   ├── EnhancedEditor.jsx            # Monaco/Quill wrapper
│       │   ├── RemoteCursorsOverlay.jsx      # Live cursor display
│       │   └── ToastProvider.jsx             # Global notifications
│       ├── SigninSignup/ModernAuthPage.jsx
│       ├── Profile/ProfilePage.jsx           # User profile with error handling
│       ├── LandingPage/ModernLandingPage.jsx
│       └── utils/
│           ├── apiRoutes.js                  # API route configuration
│           ├── axiosConfig.js                # Axios instance setup
│           └── errorHandler.js               # API error handling utilities
│
├── api/tests/                    # Backend tests (Jest + Supertest)
├── docker-compose.yml            # Docker Compose (app + MongoDB + Redis)
├── k8s/                          # Kubernetes manifests
├── openapi.yml                   # OpenAPI specification
└── HANDOFF.md                    # Agent onboarding document
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Material UI 6, Monaco Editor, Quill, Framer Motion, Socket.io Client, Axios |
| **Backend** | Node.js 20, Express 4, Socket.io 4, Mongoose 8 |
| **Database** | MongoDB (Atlas or local) |
| **Caching** | Redis 7 (optional, for Socket.io adapter) |
| **Auth** | JWT (jsonwebtoken) + bcrypt |
| **Testing** | Jest 30, Supertest, MongoDB Memory Server |
| **Security** | Helmet, express-rate-limit, xss-sanitizer, mongo-sanitize, hpp |
| **Deployment** | Docker, Docker Compose, Kubernetes |

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register new user |
| POST | `/api/users/login` | Login, returns JWT |
| GET | `/api/users/profile` | Get authenticated user profile |
| GET | `/api/users/search?q=` | Search users by name/email (min 2 chars) |

### Notebooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notebooks` | List user's notebooks |
| GET | `/api/notebooks/favorites` | Get favorited notebooks |
| GET | `/api/notebooks/shared` | Get shared notebooks |
| POST | `/api/notebooks` | Create notebook |
| GET | `/api/notebooks/:urlId` | Get notebook (handles password/guest) |
| PUT | `/api/notebooks/:id` | Update notebook (creates version) |
| DELETE | `/api/notebooks/:id` | Delete notebook + versions + comments |
| PUT | `/api/notebooks/:id/password` | Set/remove password |
| PUT | `/api/notebooks/:id/collaborators` | Update collaborators |
| POST | `/api/notebooks/:id/favorite` | Toggle favorite |
| PUT | `/api/notebooks/:id/url` | Update URL identifier |

### Password / Guest Flow
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notebooks/:urlId/register-guest` | Register guest name |
| POST | `/api/notebooks/:urlId/verify-password` | Verify notebook password |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notebooks/:notebookId/comments` | List comments |
| POST | `/api/notebooks/:notebookId/comments` | Add comment (supports `parentId` for replies) |
| PUT | `/api/notebooks/:notebookId/comments/:commentId` | Update comment |
| DELETE | `/api/notebooks/:notebookId/comments/:commentId` | Delete comment |

### Versions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notebooks/:id/versions` | List versions |
| GET | `/api/notebooks/:id/versions/:versionId` | Get version content |
| POST | `/api/notebooks/:id/versions/:versionId/restore` | Restore version (owner only) |

### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `notebookUpdated` | Server → Client | Notebook content changed |
| `commentAdded` | Server → Client | New comment posted |
| `commentUpdated` | Server → Client | Comment edited |
| `commentDeleted` | Server → Client | Comment removed |
| `userCursorPosition` | Client → Server → Client | Remote cursor position |
| `userJoined` | Server → Client | User entered notebook |
| `userLeft` | Server → Client | User left notebook |
| `collaboratorUpdated` | Server → Client | Collaborator permissions changed |
| `collaboratorRemoved` | Server → Client | Collaborator removed |
| `conflictDetected` | Server → Client | Edit conflict detected |

### Error Handling Utilities

The `pro/src/utils/errorHandler.js` module provides centralized error handling:

| Function | Description |
|----------|-------------|
| `getErrorMessage(error)` | Extracts user-friendly messages from API errors (handles 400, 401, 403, 404, 409, 422, 429, 500+) |
| `getErrorCode(error)` | Returns error code from response or HTTP status |
| `isAuthError(error)` | Checks for 401/403 authentication errors |
| `isNetworkError(error)` | Detects network/connection failures |
| `isValidationError(error)` | Identifies validation errors (400 or VALIDATION_ERROR) |
| `getValidationErrors(error)` | Extracts field-level validation errors from `details` array |

---

## Testing

```bash
cd api
npm test                    # run all tests
npm run test:watch          # watch mode
npm run test:coverage       # with coverage report
```

**Test suites (138 tests, all passing):**

| Suite | Tests | Coverage |
|-------|-------|----------|
| `users.test.js` | 16 | User auth endpoints |
| `versions.test.js` | 30 | Version control |
| `comments.test.js` | 18 | Comments CRUD |
| `collaborators.test.js` | 21 | Collaborator management |
| `cursors.test.js` | 13 | Cursor data structures |
| `share.test.js` | 15 | Share functionality |
| `management.test.js` | 25 | Password/favorites/guests |
| `auth.test.js` | — | Auth middleware |
| `health.test.js` | — | Health check |
| `notebookVersions.test.js` | — | Version detail/restore |

---

## Deployment

### Docker Compose

```bash
docker-compose up -d
```

Starts: API (port 3001), Frontend (port 3000), MongoDB (27017), Redis (6379).

### Kubernetes

```bash
kubectl apply -f k8s/
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide including AWS, nginx reverse proxy, and SSL setup.

---

## Project Status

| Area | Status |
|------|--------|
| Auth (register, login, JWT) | Production ready |
| Notebook CRUD + versions | Production ready |
| Real-time collaboration | Production ready |
| Comments (threaded, real-time) | Production ready |
| Collaborator management | Production ready |
| Password protection | Production ready |
| Guest access | Production ready |
| Favorites + shared view | Production ready |
| Remote cursors | Working |
| Share dialog + QR code | Production ready |
| Version restore from comparison | Working |
| Centralized error handling | Production ready |
| Conflict resolution | Placeholder (Phase 7) |
| Export/Import | Not implemented |
| Offline support | Not implemented |

---

## Key Documentation

| File | Purpose |
|------|---------|
| [HANDOFF.md](./HANDOFF.md) | Agent onboarding — current status, file locations, env vars |
| [API_ROUTES_DOCUMENTATION.md](./API_ROUTES_DOCUMENTATION.md) | Full API docs |
| [FRONTEND_COMPONENT_INVENTORY.md](./FRONTEND_COMPONENT_INVENTORY.md) | Component ↔ route mapping |
| [PERMISSION_MATRIX.md](./PERMISSION_MATRIX.md) | Access level rules |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment guide |
| [openapi.yml](./openapi.yml) | OpenAPI 3.0 specification |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Run tests: `cd api && npm test`
4. Commit: `git commit -m "feat: your feature"`
5. Push: `git push origin feature/your-feature`
6. Open a Pull Request

---

## License

ISC
