// Constants for access control
export const ACCESS_TIMEOUT = 10000;  // 10 seconds
export const MAX_RETRIES = 3;
export const INITIAL_RETRY_DELAY = 1000;  // 1 second

/**
 * Wraps an async function with timeout handling
 */
export const withTimeout = async (promise, timeout = ACCESS_TIMEOUT) => {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timed out')), timeout)
  );
  return Promise.race([promise, timeoutPromise]);
};

/**
 * Wraps an async function with retry logic using exponential backoff
 */
export const withRetry = async (fn, maxRetries = MAX_RETRIES) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed:`, error.message);
      
      if (i === maxRetries - 1) break;
      
      // Calculate delay with exponential backoff
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
};

/**
 * Validates guest name format
 */
export const validateGuestName = (name) => {
  if (!name || typeof name !== 'string') {
    return 'Name is required';
  }
  if (name.length < 2) {
    return 'Name must be at least 2 characters long';
  }
  if (name.length > 50) {
    return 'Name must be less than 50 characters';
  }
  if (!/^[a-zA-Z0-9\s-_]+$/.test(name)) {
    return 'Name can only contain letters, numbers, spaces, hyphens, and underscores';
  }
  return null;
};

/**
 * Validates password format
 */
export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 1) {
    return 'Password cannot be empty';
  }
  return null;
};

/**
 * Cache for access tokens to prevent unnecessary API calls
 */
const accessTokenCache = new Map();

/**
 * Gets cached access token or fetches a new one
 */
export const getAccessToken = async (notebookId, credentials) => {
  const cacheKey = `${notebookId}:${JSON.stringify(credentials)}`;
  
  // Check cache first
  if (accessTokenCache.has(cacheKey)) {
    const cached = accessTokenCache.get(cacheKey);
    if (Date.now() < cached.expiresAt) {
      return cached.token;
    }
    accessTokenCache.delete(cacheKey);
  }
  
  // Fetch new token
  const response = await fetch(`/api/notebooks/${notebookId}/access-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) {
    throw new Error('Failed to get access token');
  }
  
  const data = await response.json();
  
  // Cache the new token
  accessTokenCache.set(cacheKey, {
    token: data.token,
    expiresAt: Date.now() + (data.expiresIn * 1000)
  });
  
  return data.token;
};

/**
 * Clears access token cache for a notebook
 */
export const clearAccessTokenCache = (notebookId) => {
  for (const key of accessTokenCache.keys()) {
    if (key.startsWith(`${notebookId}:`)) {
      accessTokenCache.delete(key);
    }
  }
};

/**
 * Type definitions for TypeScript (in JSDoc format for JavaScript)
 * @typedef {Object} AccessCredentials
 * @property {string} [password] - Optional password for password-protected notebooks
 * @property {string} [guestName] - Optional guest name for guest access
 * @property {string} [token] - Optional access token for authenticated users
 * 
 * @typedef {Object} AccessResult
 * @property {boolean} success - Whether access was granted
 * @property {string} [error] - Error message if access was denied
 * @property {Object} [data] - Additional data if access was granted
 */