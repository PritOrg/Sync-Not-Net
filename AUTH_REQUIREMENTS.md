# API Authentication & Authorization Requirements

Generated: March 23, 2026  
Status: ACTIVE (Phase 1.2.6 Complete)

---

## Authentication Overview

The Sync Note Net API uses **JWT (JSON Web Tokens)** for authentication. Tokens are obtained through the login or register endpoints and must be included in the `Authorization` header for protected routes.

### JWT Token Structure

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Payload:**
```json
{
  "id": "userId_ObjectId",
  "email": "user@example.com",
  "role": "user",
  "iat": 1711270400,
  "exp": 1711356800
}
```

**Configuration:**
- Algorithm: HS256
- Secret: Stored in `process.env.JWT_SECRET`
- Default Expiration: 24 hours (configurable via `process.env.JWT_EXPIRES_IN`)
- Refresh: Not implemented; user must re-login after expiration

---

## Authentication Routes (Public - No Authentication Required)

### 1. User Registration
```http
POST /api/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "message": "User registered successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error (missing fields, invalid email format, password < 6 chars)
- `409 Conflict` - User with email already exists

---

### 2. User Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid email or password
- `400 Bad Request` - Missing required fields

---

## Protected Routes (JWT Required)

All endpoints below require a valid JWT token in the `Authorization: Bearer <token>` header.

### User Profile Routes

#### GET /api/users/profile
```http
GET /api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "https://example.com/avatar.jpg",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-03-23T14:22:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - No token or invalid token
- `404 Not Found` - User not found (rare, indicates data inconsistency)

---

#### PUT /api/users/profile
```http
PUT /api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Jane Doe",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Jane Doe",
  "email": "john@example.com",
  "avatar": "https://example.com/new-avatar.jpg",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-03-23T15:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid token

---

#### PUT /api/users/password
```http
PUT /api/users/password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Current password incorrect or validation error
- `401 Unauthorized` - Invalid token

---

#### GET /api/users/stats
```http
GET /api/users/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "totalNotebooks": 15,
  "totalCollaborations": 7,
  "totalComments": 42,
  "joinDate": "2024-01-15T10:30:00Z"
}
```

---

#### GET /api/users/search
```http
GET /api/users/search?q=john&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "name": "John Smith",
    "email": "john.smith@example.com",
    "avatar": null
  }
]
```

**Error Responses:**
- `400 Bad Request` - Search query < 2 characters
- `401 Unauthorized` - Invalid token

---

### Notebook Routes

All notebook CRUD operations require authentication. The user making the request must:
- Be the notebook owner (for create, update, delete, password, permissions)
- OR be a collaborator with appropriate permission level

#### POST /api/notebooks
```http
POST /api/notebooks
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "My New Notebook",
  "content": "# Welcome\n\nThis is my notebook.",
  "format": "markdown",
  "tags": ["work", "important"],
  "password": "notebookPassword123"
}
```

**Response (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439020",
  "title": "My New Notebook",
  "content": "# Welcome\n\nThis is my notebook.",
  "format": "markdown",
  "owner": "507f1f77bcf86cd799439011",
  "collaborators": [],
  "isPasswordProtected": true,
  "tags": ["work", "important"],
  "createdAt": "2024-03-23T15:30:00Z",
  "updatedAt": "2024-03-23T15:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing title or validation error
- `401 Unauthorized` - Invalid token

---

#### GET /api/notebooks/my-notebooks
```http
GET /api/notebooks/my-notebooks?page=1&limit=10&sort=date&search=work
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "notebooks": [
    {
      "id": "507f1f77bcf86cd799439020",
      "title": "Work Project Notes",
      "content": "...",
      "format": "markdown",
      "owner": "507f1f77bcf86cd799439011",
      "isPasswordProtected": false,
      "tags": ["work"],
      "createdAt": "2024-03-20T10:00:00Z",
      "updatedAt": "2024-03-23T15:30:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "pages": 2
}
```

---

#### GET /api/notebooks/{id}
```http
GET /api/notebooks/507f1f77bcf86cd799439020
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439020",
  "title": "Work Project Notes",
  "content": "...",
  "format": "markdown",
  "owner": "507f1f77bcf86cd799439011",
  "collaborators": [
    {
      "userId": "507f1f77bcf86cd799439012",
      "permission": "edit"
    }
  ],
  "isPasswordProtected": false,
  "tags": ["work"],
  "createdAt": "2024-03-20T10:00:00Z",
  "updatedAt": "2024-03-23T15:30:00Z"
}
```

**Error Responses:**
- `403 Forbidden` - Access denied (not owner or collaborator)
- `404 Not Found` - Notebook not found

---

### Tag Routes

All tag operations require authentication. Tags are user-scoped.

#### POST /api/tags
```http
POST /api/tags
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Important",
  "color": "#FF0000"
}
```

**Response (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439030",
  "name": "Important",
  "color": "#FF0000",
  "createdAt": "2024-03-23T15:45:00Z"
}
```

---

## Semi-Protected Routes (Optional Authentication)

These routes work without authentication but provide enhanced functionality when authenticated.

### GET /api/notebooks/{urlIdentifier}
```http
GET /api/notebooks/my-shared-notebook
```

**For non-authenticated users:**
- Returns notebook metadata only (title, owner, format)
- Does not return sensitive content

**For authenticated users with access:**
- Returns full notebook content and metadata
- Access determined by sharing settings and password

---

### POST /api/notebooks/{urlIdentifier}/verify-password
```http
POST /api/notebooks/my-shared-notebook/verify-password
Content-Type: application/json

{
  "password": "notebookPassword123"
}
```

**Response (200 OK):**
```json
{
  "verified": true
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid password
- `404 Not Found` - Notebook not found

---

### POST /api/notebooks/{urlIdentifier}/register-guest
```http
POST /api/notebooks/my-shared-notebook/register-guest
Content-Type: application/json

{
  "guestName": "Guest User"
}
```

**Response (201 Created):**
```json
{
  "guestId": "guest_temp_token_12345",
  "message": "Guest registered successfully"
}
```

---

## Public Routes (No Authentication Required)

### GET /api/health
```http
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

---

## Authentication Best Practices

### Token Storage (Frontend)
- **Recommended:** Store in HttpOnly cookies (secure against XSS)
- **Alternative:** Store in memory or localStorage with CSRF protection
- **Never:** Store in localStorage without HTTPS

### Token Usage
- Always include in `Authorization: Bearer <token>` header
- For Socket.io connections: Include token in query parameters or auth data during handshake
- Ensure HTTPS in production to prevent token interception

### Token Refresh Strategy
- Current implementation: No automatic refresh
- User must re-login after 24 hours expiration
- Future enhancement: Implement refresh token endpoint

### CORS Configuration
- Credentials included: `credentials: 'include'` required for cookie-based auth
- Allowed origins: Configured in `process.env.ALLOWED_ORIGINS`

---

## Role-Based Access Control (RBAC)

Currently implemented roles:
- `user` (default) - Regular authenticated user
- `admin` (reserved) - Future admin functionality

**Note:** Permissions are notebook-level, not role-based. See [PERMISSION_MATRIX.md](PERMISSION_MATRIX.md) for details.

---

## Common Authentication Errors

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 400 | Validation error | Missing/invalid fields | Check request format |
| 401 | Unauthorized | Invalid/expired token | Re-login to get new token |
| 401 | Authentication failed | Wrong email/password | Verify credentials |
| 409 | User already exists | Email already registered | Use different email or login |
| 500 | Server error | Internal error | Retry or contact support |
