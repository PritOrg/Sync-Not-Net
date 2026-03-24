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
| `pro/src/SigninSignup/ModernAuthPage.jsx` | Login/Register |
| `pro/src/LandingPage/ModernLandingPage.jsx` | Landing page |
| `pro/src/Components/EnhancedEditor.jsx` | Monaco/Quill editor wrapper |
| `pro/src/Components/RemoteCursorsOverlay.jsx` | Remote cursor display |
| `pro/src/Components/ToastProvider.jsx` | Global notifications |

## API Endpoints

### Auth
- `POST /api/users/register` - Register
- `POST /api/users/login` - Login
- `GET /api/users/profile` - Get profile
- `GET /api/users/search?q=name` - Search users (returns array directly)

### Notebooks
- `GET /api/notebooks` - List user's notebooks
- `GET /api/notebooks/favorites` - Get favorites
- `GET /api/notebooks/shared` - Get shared notebooks
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

## Recent Commits
```
177bf46 fix: Password prompt and collaborator search now working correctly
dee9420 fix: Add onSave callbacks to Password and Permissions dialogs
0e3951b feat(ui): Add favorites and shared notebooks filtering to dashboard
e87fd2a feat: Add favorites, shared notebooks, guest access, and 25 new TDD tests
7efb9a3 cleanup: Remove 6 unused/replaced component files
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

## Next Steps for New Agent
1. Implement conflict resolution dialog (placeholder exists in EnhancedNotebookEditor)
2. Add export/import functionality
3. Improve mobile responsiveness
4. Add offline support with service workers
5. Consider TypeScript migration for better type safety
