# Frontend Component Inventory (Phase 2.1.3)

Generated: March 23, 2026
Status: COMPLETE (baseline mapping)
Scope: pro/src route consumers and Socket.io event consumers

---

## Coverage Summary

- HTTP API consumers identified across core pages, editor dialogs, and auth/profile flows.
- Socket consumers identified in editor and presence layers.
- Integration status classified as: Fully Integrated, Partially Integrated, or Broken/Mismatched.

---

## Route to Component Mapping

| Route | Method | Frontend Consumers | Status | Notes |
|------|--------|--------------------|--------|-------|
| /api/users/register | POST | SigninSignup/ModernSignInPage.jsx | Fully Integrated | Used in signup flow |
| /api/users/login | POST | SigninSignup/ModernSignInPage.jsx | Fully Integrated | Used in signin flow |
| /api/users/profile | GET | Profile/ProfilePage.jsx, NotebookEditorPage/CommentsPanel.jsx | Partially Integrated | CommentsPanel expects response.data.user; backend active profile response is inconsistent across duplicate handlers |
| /api/users/profile | PUT | Profile/ProfilePage.jsx | Fully Integrated | Updates profile and local storage user data |
| /api/users/password | PUT | Profile/ProfilePage.jsx | Fully Integrated | Password change dialog wired |
| /api/users/stats | GET | Profile/ProfilePage.jsx | Partially Integrated | UI wired, but backend stats query uses owner-style fields not aligned with notebook schema |
| /api/users/search | GET | NotebookEditorPage/EnhancedNotebookCreator.jsx | Partially Integrated | Creator calls endpoint without required q query parameter |
| /api/users/search?query=... | GET | NotebookEditorPage/NotebookEditorPage.jsx | Broken/Mismatched | Backend expects q, not query |
| /api/notebooks | POST | NotebookEditorPage/NotebookEditorPage.jsx, NotebookEditorPage/EnhancedNotebookCreator.jsx | Fully Integrated | Create notebook flow works |
| /api/notebooks/my-notebooks | GET | (Indirectly via search endpoint in current UI) | Partially Integrated | UI mostly uses /search now |
| /api/notebooks/search | GET | NotebooksPage/NotebooksPage.jsx | Partially Integrated | Backend has duplicate route definitions; behavior ambiguity risk |
| /api/notebooks/shared | GET | SharedNotebooksPage/SharedNotebooksPage.jsx | Fully Integrated | Pagination and search wired |
| /api/notebooks/:urlIdentifier | GET | NotebookEditorPage/NotebookEditorPage.jsx | Fully Integrated | Primary notebook fetch path |
| /api/notebooks/:id | PUT | NotebookEditorPage/NotebookEditorPage.jsx, NotebookEditorPage/EnhancedNotebookEditor.jsx | Fully Integrated | Save/update flow wired |
| /api/notebooks/:id | DELETE | NotebookEditorPage/NotebookEditorPage.jsx | Fully Integrated | Delete dialog wired |
| /api/notebooks/:urlIdentifier/access | GET | NotebookEditorPage/EnhancedNotebookEditor.jsx | Fully Integrated | Access handshake wired |
| /api/notebooks/:urlIdentifier/register-guest | POST | NotebookEditorPage/AccessPrompt.jsx, NotebookEditorPage/EnhancedPasswordPrompt.jsx, NotebookEditorPage/NotebookEditorPage.jsx | Fully Integrated | Guest registration flow wired |
| /api/notebooks/:urlIdentifier/verify-password | POST | NotebookEditorPage/AccessPrompt.jsx, NotebookEditorPage/EnhancedPasswordPrompt.jsx | Fully Integrated | Protected access verification wired |
| /api/notebooks/:id/url | PUT | NotebookEditorPage/NotebookEditorPage.jsx | Fully Integrated | Custom URL save wired |
| /api/notebooks/:id/password | PUT | NotebookEditorPage/NotebookEditorPage.jsx, NotebookEditorPage/SettingsDialog.jsx | Fully Integrated | Password settings wired |
| /api/notebooks/:id/permissions | PUT | NotebookEditorPage/NotebookEditorPage.jsx, NotebookEditorPage/SettingsDialog.jsx | Fully Integrated | Permissions settings wired |
| /api/notebooks/:id/collaborators | PUT | NotebookEditorPage/NotebookEditorPage.jsx, NotebookEditorPage/SettingsDialog.jsx | Fully Integrated | Collaborator updates wired |
| /api/notebooks/:id/tags | PUT | NotebookEditorPage/SettingsDialog.jsx | Fully Integrated | Tag assignment wired |
| /api/notebooks/:id/versions | GET | NotebookEditorPage/VersionHistoryDialog.jsx | Fully Integrated | Version history view wired |
| /api/notebooks/:id/versions/:versionId | GET | NotebookEditorPage/VersionComparisonDialog.jsx | Broken/Mismatched | Endpoint not implemented in backend |
| /api/notebooks/:id/versions/:versionId/restore | POST | NotebookEditorPage/NotebookEditorPage.jsx | Broken/Mismatched | Endpoint not implemented in backend |
| /api/notebooks/:id/comments | GET/POST/PUT/DELETE | NotebookEditorPage/CommentsPanel.jsx | Partially Integrated | Routes exist; panel state uses id fields that may not match _id in payload |

---

## Socket Event Mapping

### Client utility: pro/src/utils/socketClient.js

Outbound events:
- joinNotebook
- updateNotebook
- typing
- stopTyping
- cursorPosition

Inbound events handled:
- joinedNotebook
- userJoined
- userLeft
- notebookUpdated
- updateConfirmed
- conflictDetected
- userTyping
- userStoppedTyping
- userCursorPosition
- error

### Backend events: api/index.js

Inbound events expected by server:
- joinNotebook
- updateNotebook
- typing
- stopTyping
- cursorPosition

Outbound events emitted by server:
- joinedNotebook
- userJoined
- userLeft
- notebookUpdated
- updateConfirmed
- conflictDetected
- userTyping
- userStoppedTyping
- userCursorPosition
- error

Status: utility-level socket contract is aligned.

### Additional socket usage with drift

- contexts/PresenceContext.jsx uses event names and payload shapes (joinNotebook with object payload, leaveNotebook object form, usersInNotebook, userActivity) that are only partially aligned with server behavior.
- NotebookEditorPage/EnhancedNotebookEditor.jsx uses different event naming style in places (join-notebook, user-joined, content-change) than backend utility contract.

Status: Partially Integrated. Consolidate on one socket contract (socketClient.js conventions).

---

## High-Risk Integration Gaps

1. User search query parameter mismatch
- Frontend sends query in some paths, backend expects q.

2. Version detail and restore routes invoked by frontend but missing in backend.

3. Duplicate backend route definitions create runtime ambiguity for search, tags, and profile payload shape.

4. PresenceContext socket contract diverges from backend/editor contract.

---

## Recommended Actions Before Phase 2.2

1. Standardize /api/users/search to accept both q and query, or update frontend to only send q.
2. Implement missing version endpoints or remove/hide version comparison and restore UI actions.
3. Remove duplicate route handlers in userRoutes.js and notebookRoutes.js.
4. Consolidate realtime integrations around socketClient.js and one canonical event contract.
5. Add integration tests for the mismatched paths above.
