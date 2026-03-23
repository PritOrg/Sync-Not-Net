# API Error Codes & Handling Guide

Generated: March 23, 2026  
Status: ACTIVE (Phase 1.2.4 Complete)

---

## Error Response Format

All error responses follow this standard format:

```json
{
  "error": "ErrorType",
  "message": "Human-readable description of what went wrong",
  "details": {
    "field": "optional context about the error"
  }
}
```

**Example:**
```json
{
  "error": "Validation error",
  "message": "User registration failed",
  "details": {
    "email": "Email already in use",
    "password": "Password must be at least 6 characters"
  }
}
```

---

## HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| **400** | Bad Request | Validation error, malformed JSON, invalid parameters |
| **401** | Unauthorized | Missing/invalid token, expired session |
| **403** | Forbidden | Access denied, insufficient permissions |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource already exists (duplicate email, username, etc.) |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Unhandled exception, database error |
| **503** | Service Unavailable | Database down, service maintenance |

---

## Authentication & User Errors

### 400 - User Registration Validation Error

**Trigger:** POST `/api/users/register` with invalid data

**Possible Errors:**

#### Missing Required Fields
```json
{
  "error": "Validation error",
  "message": "User registration failed",
  "details": {
    "name": "Name is required",
    "email": "Email is required",
    "password": "Password is required"
  }
}
```

#### Invalid Email Format
```json
{
  "error": "Validation error",
  "message": "User registration failed",
  "details": {
    "email": "Invalid email format"
  }
}
```

#### Password Too Short
```json
{
  "error": "Validation error",
  "message": "User registration failed",
  "details": {
    "password": "Password must be at least 6 characters"
  }
}
```

#### Name Too Short
```json
{
  "error": "Validation error",
  "message": "User registration failed",
  "details": {
    "name": "Name must be at least 2 characters"
  }
}
```

---

### 409 - User Already Exists

**Trigger:** POST `/api/users/register` with email that already has an account

**Response:**
```json
{
  "error": "User already exists",
  "message": "An account with this email already exists"
}
```

**Solution:** User should use `POST /api/users/login` or register with different email

---

### 400 - Login Validation Error

**Trigger:** POST `/api/users/login` with missing/invalid fields

**Response:**
```json
{
  "error": "Validation error",
  "message": "Login failed",
  "details": {
    "email": "Email is required",
    "password": "Password is required"
  }
}
```

---

### 401 - Authentication Failed

**Trigger:** POST `/api/users/login` with wrong credentials

**Response:**
```json
{
  "error": "Authentication failed",
  "message": "Invalid email or password"
}
```

**Note:** Response is intentionally vague for security (don't reveal if email exists)

---

### 401 - Invalid/Expired Token

**Trigger:** Any protected route with missing/invalid/expired JWT token

**Scenarios:**

#### No Token Provided
```json
{
  "error": "Unauthorized",
  "message": "No authentication token provided"
}
```

#### Malformed Token
```json
{
  "error": "Unauthorized",
  "message": "Invalid token format"
}
```

#### Expired Token
```json
{
  "error": "Unauthorized",
  "message": "Token has expired"
}
```

#### Invalid Signature
```json
{
  "error": "Unauthorized",
  "message": "Invalid token"
}
```

**Solution:** User should login again via `POST /api/users/login` to get new token

---

### 400 - Password Change Validation

**Trigger:** PUT `/api/users/password` with invalid data

**Scenarios:**

#### Correct Password Required
```json
{
  "error": "Authentication failed",
  "message": "Current password is incorrect"
}
```

#### New Password Too Short
```json
{
  "error": "Validation error",
  "message": "New password must be at least 6 characters"
}
```

#### Same as Current Password
```json
{
  "error": "Validation error",
  "message": "New password must be different from current password"
}
```

---

## Notebook Errors

### 400 - Notebook Creation Validation

**Trigger:** POST `/api/notebooks` with invalid data

**Scenarios:**

#### Missing Title
```json
{
  "error": "Validation error",
  "message": "Notebook creation failed",
  "details": {
    "title": "Title is required"
  }
}
```

#### Invalid Format
```json
{
  "error": "Validation error",
  "message": "Notebook creation failed",
  "details": {
    "format": "Format must be one of: plaintext, markdown, html, rich-text"
  }
}
```

---

### 404 - Notebook Not Found

**Trigger:** GET/PUT/DELETE `/api/notebooks/{id}` with non-existent ID

**Response:**
```json
{
  "error": "Not found",
  "message": "Notebook not found"
}
```

**Causes:**
- User deleted the notebook
- ID is malformed or doesn't exist
- User doesn't have access (access error would show 403 instead)

---

### 403 - Access Denied (Not Owner/Collaborator)

**Trigger:** Any notebook write operation without proper permission

**Scenarios:**

#### Not Owner
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to modify this notebook"
}
```

#### Cannot Delete as Non-Owner
```json
{
  "error": "Forbidden",
  "message": "Only the notebook owner can delete it"
}
```

#### Insufficient Permission Level
```json
{
  "error": "Forbidden",
  "message": "Your permission level (view) does not allow editing"
}
```

#### Cannot Manage Collaborators
```json
{
  "error": "Forbidden",
  "message": "Only the notebook owner can manage collaborators"
}
```

---

### 400 - Notebook Update Validation

**Trigger:** PUT `/api/notebooks/{id}` with invalid data

**Response:**
```json
{
  "error": "Validation error",
  "message": "Notebook update failed",
  "details": {
    "title": "Title cannot be empty"
  }
}
```

---

### 400 - Invalid Notebook ID

**Trigger:** Any notebook route with malformed ObjectId

**Response:**
```json
{
  "error": "Validation error",
  "message": "Invalid notebook ID"
}
```

---

## Collaborator & Sharing Errors

### 404 - User Not Found

**Trigger:** PUT `/api/notebooks/{id}/collaborators` with non-existent user ID

**Response:**
```json
{
  "error": "Not found",
  "message": "User not found"
}
```

---

### 400 - Invalid Permission Level

**Trigger:** PUT `/api/notebooks/{id}/collaborators` with invalid permission

**Response:**
```json
{
  "error": "Validation error",
  "message": "Invalid permission level",
  "details": {
    "permission": "Permission must be one of: view, edit, admin"
  }
}
```

---

### 409 - Cannot Add Self as Collaborator

**Trigger:** Adding yourself as collaborator to own notebook

**Response:**
```json
{
  "error": "Invalid operation",
  "message": "You cannot add yourself as a collaborator"
}
```

---

## Password Protection Errors

### 401 - Invalid Password

**Trigger:** POST `/api/notebooks/{id}/verify-password` with wrong password

**Response:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid password"
}
```

---

### 400 - Password Already Exists

**Trigger:** PUT `/api/notebooks/{id}/password` when password already set

**Response:**
```json
{
  "error": "Validation error",
  "message": "This notebook is already password protected"
}
```

**Note:** Use same endpoint with new password to change existing password

---

## Comment Errors

### 404 - Comment Not Found

**Trigger:** PUT/DELETE `/api/notebooks/{id}/comments/{commentId}` with non-existent comment

**Response:**
```json
{
  "error": "Not found",
  "message": "Comment not found"
}
```

---

### 403 - Cannot Edit/Delete Comment

**Trigger:** Editing/deleting comment you don't own

**Response:**
```json
{
  "error": "Forbidden",
  "message": "You can only edit your own comments"
}
```

**Exception:** Notebook owner can delete any comment

---

### 400 - Empty Comment

**Trigger:** POST/PUT comment with empty content

**Response:**
```json
{
  "error": "Validation error",
  "message": "Comment content cannot be empty"
}
```

---

## Tag Errors

### 400 - Invalid Color Format

**Trigger:** POST/PUT `/api/tags` with invalid color

**Response:**
```json
{
  "error": "Validation error",
  "message": "Invalid color format",
  "details": {
    "color": "Color must be hex format (e.g., #FF0000)"
  }
}
```

---

### 404 - Tag Not Found

**Trigger:** PUT/DELETE `/api/tags/{tagId}` with non-existent tag

**Response:**
```json
{
  "error": "Not found",
  "message": "Tag not found"
}
```

---

## Search/Query Errors

### 400 - Invalid Search Query

**Trigger:** GET `/api/users/search?q=a` (query < 2 characters)

**Response:**
```json
{
  "error": "Validation error",
  "message": "Search query must be at least 2 characters long"
}
```

---

### 400 - Missing Required Parameters

**Trigger:** GET `/api/users/search` without `q` parameter

**Response:**
```json
{
  "error": "Validation error",
  "message": "Search query (q) is required"
}
```

---

## Rate Limiting Errors

### 429 - Too Many Requests

**Trigger:** Exceeding rate limit on endpoint

**Response:**
```json
{
  "error": "Too many requests",
  "message": "You have exceeded the rate limit. Please try again later.",
  "details": {
    "retryAfter": 60
  }
}
```

**Headers Included:**
```
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1711356840
```

---

## Server Errors

### 500 - Internal Server Error

**Trigger:** Unhandled exception, database error, unexpected condition

**Response:**
```json
{
  "error": "Server error",
  "message": "An unexpected error occurred. Please try again later."
}
```

**Note:** Detailed error messages not returned in production (security)

**Check:** Server logs for actual error details

---

### 503 - Database Connection Error

**Trigger:** MongoDB or other critical service unavailable

**Response:**
```json
{
  "error": "Service unavailable",
  "message": "Database connection failed. Please try again later."
}
```

---

## Socket.io Errors

While not traditional HTTP errors, Socket.io events can include error payloads:

### Connection Errors

```javascript
// Socket fails to connect
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // Likely causes: Server down, invalid token, CORS issue
});

// Socket disconnects unexpectedly
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Reasons: "io server disconnect", "io client namespace disconnect", 
  // "ping timeout", "transport close", "parse error"
});
```

### Event Errors

```javascript
// Server sends error event
socket.on('error', (errorData) => {
  console.error('Event error:', errorData.error, errorData.message);
  // Handle error and possibly reconnect
});
```

---

## Error Handling Best Practices

### Frontend (React)

```javascript
// ✅ Good error handling
async function loginUser(email, password) {
  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 401) {
        setError('Invalid email or password');
      } else if (response.status === 400) {
        setError(errorData.details?.email || 'Validation failed');
      } else {
        setError(errorData.message);
      }
      return;
    }

    const data = await response.json();
    setAuthToken(data.token);
    setCurrentUser(data.user);
  } catch (error) {
    setError('Network error. Please check your connection.');
  }
}
```

### Backend (Express)

```javascript
// ✅ Good error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err);

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Invalid input',
      details: Object.keys(err.errors).reduce((acc, key) => {
        acc[key] = err.errors[key].message;
        return acc;
      }, {})
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: `${Object.keys(err.keyPattern)[0]} already exists`
    });
  }

  // Default server error
  res.status(500).json({
    error: 'Server error',
    message: 'An unexpected error occurred'
  });
});
```

---

## Error Response Checklist

When implementing a new endpoint, ensure:

- [ ] All validation errors return `400` with clear messages
- [ ] Missing authentication returns `401`
- [ ] Permission denied returns `403`
- [ ] Resource not found returns `404`
- [ ] Duplicate resources return `409`
- [ ] Unhandled errors return `500`
- [ ] Error response includes `error` and `message` fields
- [ ] Sensitive data not exposed in error messages
- [ ] Requests are logged for debugging
- [ ] User-friendly messages in production
