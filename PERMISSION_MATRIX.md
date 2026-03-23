# API Permission Matrix & Access Control

Generated: March 23, 2026  
Status: ACTIVE (Phase 1.2.7 Complete)

---

## Permission Levels

The API implements three permission levels for notebook collaborations:

| Level | Description | Can View | Can Edit | Can Manage |
|-------|-------------|----------|----------|-----------|
| **view** | Read-only access | ✅ | ❌ | ❌ |
| **edit** | Read and write access | ✅ | ✅ | ❌ |
| **admin** | Full control | ✅ | ✅ | ✅ |

### Permission Details

**view (Read-Only)**
- View notebook content
- Read comments
- Cannot modify content
- Cannot change settings
- Cannot manage collaborators
- Cannot delete notebook

**edit (Read-Write)**
- View and edit notebook content
- Add and modify comments
- Cannot change sharing settings
- Cannot manage collaborators
- Cannot delete notebook
- Cannot change password

**admin (Full Control)**
- All edit permissions
- Add/remove collaborators
- Manage permissions
- Change password protection
- Change notebook settings
- Delete notebook

---

## Route-Level Access Control

### User Routes

| Route | Method | Auth | Owner Only | Notes |
|-------|--------|------|-----------|-------|
| `/users/register` | POST | ❌ | - | Public - anyone can register |
| `/users/login` | POST | ❌ | - | Public - anyone can login |
| `/users/profile` | GET | ✅ | Self | Authenticated user sees own profile |
| `/users/profile` | PUT | ✅ | Self | Can only update own profile |
| `/users/password` | PUT | ✅ | Self | Can only change own password |
| `/users/stats` | GET | ✅ | Self | Can only view own stats |
| `/users/search` | GET | ✅ | - | Can search any user (returns public info) |

---

### Notebook Routes

#### Read Operations

| Route | Method | Auth Required | Access Rules |
|-------|--------|---------------|--------------|
| `/notebooks/my-notebooks` | GET | ✅ | User sees only own notebooks |
| `/notebooks/shared` | GET | ✅ | User sees shared notebooks + own |
| `/notebooks/{id}` | GET | ✅ | Owner OR collaborator with "view"+ |
| `/notebooks/{urlIdentifier}` | GET | ⭕ | Depends on sharing: public/password/private |
| `/notebooks/{id}/collaborators` | GET | ✅ | Owner OR admin collaborator |
| `/notebooks/{id}/versions` | GET | ✅ | Owner OR collaborator with "edit"+ |

#### Write Operations

| Route | Method | Auth | Access Rules |
|-------|--------|------|--------------|
| `/notebooks` | POST | ✅ | Any authenticated user |
| `/notebooks/{id}` | PUT | ✅ | Owner OR collaborator with "edit"+ |
| `/notebooks/{id}` | DELETE | ✅ | Owner only |
| `/notebooks/{id}/password` | PUT | ✅ | Owner only |
| `/notebooks/{id}/collaborators` | PUT | ✅ | Owner only |
| `/notebooks/{id}/collaborators/{userId}` | DELETE | ✅ | Owner only |
| `/notebooks/{id}/tags` | PUT | ✅ | Owner OR collaborator with "edit"+ |
| `/notebooks/{id}/settings` | PUT | ✅ | Owner only |
| `/notebooks/{id}/versions/{versionId}/restore` | POST | ✅ | Owner OR collaborator with "admin" |

---

### Comment Routes

| Route | Method | Auth | Access Rules |
|-------|--------|------|--------------|
| `/notebooks/{id}/comments` | GET | ⭕ | Public access (auth optional) |
| `/notebooks/{id}/comments` | POST | ⭕ | Auth user OR guest |
| `/notebooks/{id}/comments/{cid}` | PUT | ⭕ | Author OR notebook owner |
| `/notebooks/{id}/comments/{cid}` | DELETE | ⭕ | Author OR notebook owner |

**Notes:**
- Guests can comment if notebook has guest access enabled
- Authors can only edit their own comments unless notebook owner
- Comments are visible to anyone with notebook access

---

### Tag Routes

| Route | Method | Auth | Scope |
|-------|--------|------|-------|
| `/tags` | GET | ✅ | User sees only own tags |
| `/tags` | POST | ✅ | User creates personal tags |
| `/tags/{tagId}` | PUT | ✅ | User updates own tags only |
| `/tags/{tagId}` | DELETE | ✅ | User deletes own tags only |

---

## Sharing Models

### Model 1: Private (Default)
```
Owner: Full access
Collaborators: As assigned (view/edit/admin)
Others: No access
Password: None required (unless set by owner)
```

**Routes accessible:**
- Owner: All routes
- Collaborators: Read, create content (based on permission)
- Others: None

### Model 2: Password Protected
```
Owner: Full access
Collaborators: As assigned
Others: Read-only if password matches
Password: Required for public access
```

**Routes accessible:**
- Owner: All routes
- Collaborators: As assigned
- Others: Can view after password verification
- Public via URL: `GET /notebooks/{urlIdentifier}` after password verification

---

### Model 3: Public Link Sharing
```
Owner: Full access
Collaborators: As assigned
Others: Limited access via shared link
```

**Routes accessible:**
- Owner: All routes
- Collaborators: As assigned  
- Others: View only via public link

---

## Database-Level Permissions

### Notebook Model

```javascript
{
  _id: ObjectId,
  title: String,
  owner: ObjectId,           // Owner user ID
  collaborators: [{
    userId: ObjectId,
    permission: String,      // "view", "edit", "admin"
    addedAt: Date
  }],
  isPasswordProtected: Boolean,
  password: String,          // Bcrypt hashed (12 rounds)
  urlIdentifier: String,     // For public sharing
  isPublic: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Access Decision Algorithm

```javascript
function canAccessNotebook(userId, notebookId, action) {
  const notebook = await Notebook.findById(notebookId);
  
  // Owner has all access
  if (notebook.owner.equals(userId)) {
    return true;
  }
  
  // Check collaborator permissions
  const collaborator = notebook.collaborators.find(
    c => c.userId.equals(userId)
  );
  
  if (collaborator) {
    return canPerformAction(collaborator.permission, action);
  }
  
  // Check public/password access
  if (notebook.isPublic) {
    return action === 'view';
  }
  
  return false;
}

function canPerformAction(permission, action) {
  const permissions = {
    'view': ['read', 'read-comments'],
    'edit': ['read', 'write', 'read-comments', 'write-comments'],
    'admin': ['read', 'write', 'delete', 'manage', 'read-comments', 'write-comments']
  };
  
  return permissions[permission]?.includes(action) ?? false;
}
```

---

## Guest Access Control

The system supports guest (unauthenticated) access to specific notebooks:

### Guest Registration Flow

1. Guest navigates to public notebook link:
   ```
   /notebooks/{urlIdentifier}
   ```

2. If password-protected, guest verifies password:
   ```http
   POST /notebooks/{urlIdentifier}/verify-password
   { "password": "notebook-password" }
   ```

3. Guest registers:
   ```http
   POST /notebooks/{urlIdentifier}/register-guest
   { "guestName": "John" }
   ```

4. System returns guest token (temporary, session-based)

5. Guest can then:
   - View notebook content
   - Add comments
   - Cannot edit notebook
   - Cannot manage collaborators

### Guest Permissions

| Action | Guest | Authenticated User | Collaborator |
|--------|-------|--------------------|--------------|
| View notebook | ✅ (if public) | ✅ | ✅ |
| Edit notebook | ❌ | ⚠️ (if editor+) | ✅ (if edit+) |
| Add comments | ✅ (if allowed) | ✅ | ✅ |
| Edit own comment | ✅ | ✅ | ✅ |
| Delete own comment | ✅ | ✅ | ✅ |
| Manage sharing | ❌ | ❌ | ❌ (unless admin) |

---

## Admin-Level Operations (Future)

Reserved for future admin functionality:

| Operation | Current | Future |
|-----------|---------|--------|
| View all users | Admin only | - |
| Delete any notebook | - | Admin only |
| Reset user password | - | Admin only |
| View system analytics | - | Admin only |
| Manage user roles | - | Admin only |

---

## Permission Enforcement Rules

### At Backend (Mandatory)

1. **Every route checks authentication** if `Auth: ✅` required
   - Token must be valid and non-expired
   - User must exist in database

2. **Every write operation checks permissions**
   - User must be owner OR appropriate collaborator
   - Collaborator permission level must allow action

3. **Notebook access is checked** before returning data
   - Query filters by owner OR collaborator list
   - Public/password status respected

4. **Comments respect notebook permissions**
   - User must have at least "view" access to notebook
   - Author name optional for guests

### At Frontend (UX, Not Security)

1. Hide buttons user can't use
2. Show permission-based UI variations
3. Disable inputs for read-only users
4. Warn before destructive actions

**Important:** Frontend restrictions are NOT sufficient security - backend MUST validate ALL permissions.

---

## Example: Sharing Notebook with Collaborator

### Request
```http
PUT /api/notebooks/507f1f77bcf86cd799439020/collaborators
Authorization: Bearer <owner-token>
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439012",
  "permission": "edit"
}
```

### Backend Validation

1. ✅ Check requesting user is authenticated
2. ✅ Check authenticated user is notebook owner
3. ✅ Check target user exists
4. ✅ Check permission value is valid ("view", "edit", "admin")
5. ✅ Add collaborator if validation passes
6. ✅ Emit Socket.io event to all collaborators
7. ✅ Log action for audit trail

### Frontend After Success

- Refresh collaborators list
- Notify editor: "Added John Doe as Editor"
- Show John Doe in collaborators panel
- Disable "remove" for John (unless admin)

---

## API Validation Best Practices

### Always Validate

```javascript
// ✅ CORRECT
async function updateNotebook(req, res) {
  const { id } = req.params;
  const notebook = await Notebook.findById(id);
  
  // Check ownership
  if (!notebook.owner.equals(req.user.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Update...
}

// ❌ WRONG - No permission check
async function updateNotebook(req, res) {
  const { id } = req.params;
  const notebook = await Notebook.findByIdAndUpdate(id, req.body);
  res.json(notebook);
}
```

### Whitelist Actions, Don't Blacklist

```javascript
// ✅ CORRECT - Only allow specific fields
const updates = {
  title: req.body.title,
  content: req.body.content,
  tags: req.body.tags
};

// ❌ WRONG - Allows any field
const updates = req.body;
```

---

## Testing Permission Rules

Use tools like:
- **Postman:** Test with different user tokens
- **cURL:** Manual permission verification
- **Unit tests:** Verify each permission level
- **Integration tests:** Test end-to-end workflows

### Test Cases

1. Owner creating notebook
2. Collaborator editing (edit permission)
3. Collaborator denied delete (no admin permission)
4. Non-collaborator denied access
5. Guest accessing public notebook
6. Guest denied edit access
7. Password protected notebook flow
