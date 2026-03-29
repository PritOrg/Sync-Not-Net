import config from '../config';

const base = config.apiUrl;

const api = {
  // Auth
  login: () => `${base}/api/users/login`,
  register: () => `${base}/api/users/register`,
  profile: () => `${base}/api/users/profile`,
  updateProfile: () => `${base}/api/users/profile`,
  changePassword: () => `${base}/api/users/password`,
  userStats: () => `${base}/api/users/stats`,
  userActivity: (limit = 5) => `${base}/api/users/activity?limit=${limit}`,
  searchUsers: (query, limit = 10) => `${base}/api/users/search?q=${encodeURIComponent(query)}&limit=${limit}`,

  // Notebooks
  notebooks: () => `${base}/api/notebooks`,
  notebook: (id) => `${base}/api/notebooks/${id}`,
  notebookByUrl: (urlId) => `${base}/api/notebooks/${urlId}`,
  notebookFavorites: () => `${base}/api/notebooks/favorites`,
  notebookShared: (page = 1, limit = 12, search = '') =>
    `${base}/api/notebooks/shared?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
  notebookSearch: (params) => `${base}/api/notebooks/search?${params.toString()}`,
  toggleFavorite: (id) => `${base}/api/notebooks/${id}/favorite`,
  updateNotebookUrl: (id) => `${base}/api/notebooks/${id}/url`,

  // Password & Access
  notebookPassword: (id) => `${base}/api/notebooks/${id}/password`,
  registerGuest: (urlId) => `${base}/api/notebooks/${urlId}/register-guest`,
  verifyPassword: (urlId) => `${base}/api/notebooks/${urlId}/verify-password`,
  accessToken: (notebookId) => `${base}/api/notebooks/${notebookId}/access-token`,

  // Collaborators
  collaborators: (notebookId) => `${base}/api/notebooks/${notebookId}/collaborators`,
  collaborator: (notebookId, userId) => `${base}/api/notebooks/${notebookId}/collaborators/${userId}`,

  // Collaboration Requests
  collaborationRequestCounts: () => `${base}/api/collaboration-requests/counts`,
  incomingRequests: () => `${base}/api/collaboration-requests/incoming`,
  outgoingRequests: () => `${base}/api/collaboration-requests/outgoing`,
  acceptRequest: (id) => `${base}/api/collaboration-requests/${id}/accept`,
  declineRequest: (id) => `${base}/api/collaboration-requests/${id}/decline`,
  cancelRequest: (id) => `${base}/api/collaboration-requests/${id}/cancel`,

  // Comments
  comments: (notebookId) => `${base}/api/notebooks/${notebookId}/comments`,
  comment: (notebookId, commentId) => `${base}/api/notebooks/${notebookId}/comments/${commentId}`,

  // Versions
  versions: (notebookId) => `${base}/api/notebooks/${notebookId}/versions`,
  version: (notebookId, versionId) => `${base}/api/notebooks/${notebookId}/versions/${versionId}`,
  restoreVersion: (notebookId, versionId) => `${base}/api/notebooks/${notebookId}/versions/${versionId}/restore`,

  // Tags
  tags: () => `${base}/api/notebooks/tags`,
  searchTags: (query) => `${base}/api/tags/search?q=${encodeURIComponent(query)}`,
  tag: (tagId) => `${base}/api/notebooks/tags/${tagId}`,
};

export default api;
