# Sync Note Net - Project Context

## What This Is
MERN stack collaborative note-taking platform with Monaco/Quill editors, real-time Socket.io collaboration, and version control.

## Tech Stack
- **Backend:** Node.js, Express, MongoDB, Socket.io, JWT auth
- **Frontend:** React, Material UI, Monaco Editor, Quill Editor, Framer Motion
- **Testing:** Jest, Supertest

## How to Run
```bash
# Backend
cd api && npm start

# Frontend  
cd pro && npm start

# Tests (138 passing)
cd api && npm test
```

## Current Status (March 24, 2026)

### ✅ Working
- User auth (register, login, JWT)
- Notebook CRUD with version history
- Real-time comments via Socket.io
- Collaborator management (add/edit/remove with access levels)
- Password protection (applies to ALL users - owner/collaborator/guest)
- Guest user registration with name
- Favorites system
- Shared notebooks view
- Remote cursors (basic implementation)
- Share dialog with QR code
- Modern UI (Landing, Auth, Dashboard, Editor pages)
- Centralized error handling for API responses
- **Profile page with real data, activity tracking, and enhanced stats**
- **Improved notebook listing (owned + shared notebooks only)**
- **Redesigned presentation.html with modern UI/UX**

### ⚠️ Needs Work
- Phase 6: Conflict resolution dialog (placeholder exists)
- Offline support
- Export/Import
- Mobile responsiveness improvements

## Key Files

### Backend
| File | Purpose |
|------|---------|
| `api/routes/notebookRoutes.js` | All notebook endpoints (2700+ lines) |
| `api/routes/commentRoutes.js` | Comments CRUD + Socket.io events |
| `api/routes/userRoutes.js` | User auth + search |
| `api/models/notebookModel.js` | Notebook schema |
| `api/models/userModel.js` | User schema (has `favorites` field) |
| `api/models/commentModel.js` | Comment schema |

### Frontend
| File | Purpose |
|------|---------|
| `pro/src/NotebookEditorPage/EnhancedNotebookEditor.jsx` | Main editor component (1200+ lines) |
| `pro/src/NotebookEditorPage/CommentsPanel.jsx` | Real-time comments |
| `pro/src/NotebookEditorPage/CollaboratorsSettingsDialog.jsx` | Collaborator management |
| `pro/src/NotebookEditorPage/PasswordSettingsDialog.jsx` | Password settings |
| `pro/src/NotebookEditorPage/ShareDialog.jsx` | Share with QR code |
| `pro/src/NotebookEditorPage/UnifiedAccessPrompt.jsx` | Guest name + password prompts |
| `pro/src/NotebooksPage/NotebooksDashboard.jsx` | Dashboard with filters |
| `pro/src/SigninSignup/ModernAuthPage.jsx` | Login/Register (enhanced error handling) |
| `pro/src/LandingPage/ModernLandingPage.jsx` | Landing page |
| `pro/src/Profile/ProfilePage.jsx` | User profile with activity tracking, stats, last login |
| `pro/src/Components/EnhancedEditor.jsx` | Monaco/Quill editor wrapper |
| `pro/src/Components/RemoteCursorsOverlay.jsx` | Remote cursor display |
| `pro/src/Components/ToastProvider.jsx` | Global notifications |
| `pro/src/utils/errorHandler.js` | API error handling utilities |
| `pro/src/utils/apiRoutes.js` | API route definitions (includes new endpoints) |

## API Endpoints

### Auth
- `POST /api/users/register` - Register
- `POST /api/users/login` - Login
- `GET /api/users/profile` - Get profile (includes lastLogin, profilePicture)
- `GET /api/users/stats` - Get user statistics (notebooks, collaborators, etc.)
- `GET /api/users/activity` - Get recent user activity (notebooks)
- `GET /api/users/search?q=name` - Search users (returns array directly)

### Notebooks
- `GET /api/notebooks` - List owned + shared notebooks (excludes public notebooks)
- `GET /api/notebooks/favorites` - Get favorites
- `GET /api/notebooks/shared` - Get shared notebooks (excludes own notebooks)
- `POST /api/notebooks` - Create notebook
- `GET /api/notebooks/:urlId` - Get notebook (handles password/guest flow)
- `PUT /api/notebooks/:id` - Update notebook (creates version)
- `DELETE /api/notebooks/:id` - Delete notebook
- `PUT /api/notebooks/:id/password` - Set/remove password
- `PUT /api/notebooks/:id/collaborators` - Update collaborators
- `PUT /api/notebooks/:id/collaborators/:userId` - Update single collaborator
- `DELETE /api/notebooks/:id/collaborators/:userId` - Remove collaborator
- `POST /api/notebooks/:id/favorite` - Toggle favorite
- `PUT /api/notebooks/:id/url` - Update URL identifier

### Password/Guest Flow
- `POST /api/notebooks/:urlId/register-guest` - Register guest name
- `POST /api/notebooks/:urlId/verify-password` - Verify password

### Comments
- `GET /api/notebooks/:notebookId/comments` - List comments
- `POST /api/notebooks/:notebookId/comments` - Add comment (supports `parentId` for replies)
- `PUT /api/notebooks/:notebookId/comments/:commentId` - Update comment
- `DELETE /api/notebooks/:notebookId/comments/:commentId` - Delete comment

### Versions
- `GET /api/notebooks/:id/versions` - List versions
- `GET /api/notebooks/:id/versions/:versionId` - Get version content
- `POST /api/notebooks/:id/versions/:versionId/restore` - Restore version

## Error Handling Utilities

`pro/src/utils/errorHandler.js` provides centralized error handling:
- `getErrorMessage(error)` - Extracts user-friendly messages from API errors (handles 400, 401, 403, 404, 409, 422, 429, 500+)
- `getErrorCode(error)` - Returns error code from response or HTTP status
- `isAuthError(error)` - Checks for 401/403 authentication errors
- `isNetworkError(error)` - Detects network/connection failures
- `isValidationError(error)` - Identifies validation errors (400 or VALIDATION_ERROR)
- `getValidationErrors(error)` - Extracts field-level validation errors from `details` array

## Password Protection Flow
1. User accesses notebook via URL
2. Backend checks if notebook has password
3. If yes, returns 200 with `requiresPassword: true`
4. Frontend shows `UnifiedAccessPrompt` component
5. User enters password
6. Frontend calls `POST /:urlId/verify-password`
7. On success, notebook loads

**Important:** Password applies to ALL users - owner, collaborator, and guests.

## Guest Access Flow
1. Unauthenticated user accesses public notebook
2. Backend returns 200 with `requiresGuestName: true`
3. Frontend shows `UnifiedAccessPrompt` for name entry
4. User enters name
5. Frontend calls `POST /:urlId/register-guest`
6. Guest info saved to localStorage
7. If notebook has password, password prompt shows next

## Socket.io Events
- `notebookUpdated` - Content changed
- `commentAdded` - New comment
- `commentUpdated` - Comment edited
- `commentDeleted` - Comment removed
- `userCursorPosition` - Remote cursor position
- `userJoined` / `userLeft` - User presence
- `collaboratorUpdated` / `collaboratorRemoved` - Collaborator changes

## Known Issues Fixed (March 2026)
1. ✅ Version entries now created on every save
2. ✅ Password prompt shows for password-protected notebooks
3. ✅ Collaborator search returns results correctly
4. ✅ Permissions/Password dialogs have proper `onSave` callbacks
5. ✅ `notebookData._id` optional chaining throughout
6. ✅ Duplicate routes removed
7. ✅ Unused components removed
8. ✅ Centralized error handling utilities added (`errorHandler.js`)
9. ✅ ModernAuthPage and ProfilePage use enhanced error handling
10. ✅ Fixed stats endpoint to return correct notebook counts (using `creatorID`, `collaborators.userId`, `permissions: 'everyone'`)
11. ✅ Added activity endpoint for recent notebook activity
12. ✅ Added `lastLogin` and `profilePicture` to user profile responses
13. ✅ Fixed notebook listing to exclude public notebooks (dashboard now shows owned + shared only)
14. ✅ Fixed collaborator populate calls to use `collaborators.userId`
15. ✅ Updated presentation.html with modern UI/UX design and updated content

## Recent Changes (March 29, 2026)

### Backend Fixes (Commit: 62680f7)
- Fixed user stats endpoint field names (`creatorID`, `collaborators.userId`, `permissions: 'everyone'`)
- Added activity endpoint `GET /api/users/activity` for recent notebook activity
- Enhanced user profile with `lastLogin` and `profilePicture` fields
- Added comment schema with likes support and normalization
- Added collaboration request model and routes
- Security middleware updates (rate limiting, helmet, etc.)

### Frontend Improvements (Commit: 842e990)
- Profile page with real data, activity tracking, and enhanced stats
- Improved dashboard (owned + shared notebooks only)
- Share dialog with URL personalization (quick edit + advanced settings)
- Comment panel with real-time sync and deduplication
- Centralized error handling utilities (`errorHandler.js`, `apiRoutes.js`)
- Notebook URL settings dialog for personalization

### Presentation Updates (Commit: 5a2ca47)
- Complete UI/UX redesign with modern CSS (gradients, glass-morphism)
- Updated content reflecting current implementation
- Added profile page to completed features

### Bug Fixes (Commit: f9c98f3)
- Fixed `onUrlSettings` undefined error in SettingsDrawerContent
- Fixed `item.onClick is not a function` error with defensive guards
- Fixed guest access blank skeleton by preventing unnecessary refetch after registration

### Recent Commits
```
f9c98f3 Fix guest access blank skeleton by preventing unnecessary refetch
5a2ca47 Update README and presentation with latest features
842e990 Frontend improvements: profile page, dashboard, share dialog, error handling
62680f7 Backend fixes: user stats, notebook queries, comment schema, security updates
```

## Test Suites (138 tests, all passing)
- `users.test.js` - Auth endpoints (16 tests)
- `versions.test.js` - Version control (30 tests)
- `comments.test.js` - Comments (18 tests)
- `collaborators.test.js` - Collaborators (21 tests)
- `cursors.test.js` - Cursor data structures (13 tests)
- `share.test.js` - Share functionality (15 tests)
- `management.test.js` - Password/favorites/shared/guests (25 tests)
- `auth.test.js`, `health.test.js`, `notebookVersions.test.js`

## Priority Tasks (Do These First)

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

## Agent Onboarding

Read `HANDOFF.md` in project root for full context: file locations, env vars, import conventions, API endpoints, socket events, and known issues.
