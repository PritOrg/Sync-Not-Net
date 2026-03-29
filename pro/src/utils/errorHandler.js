const getErrorMessage = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.message || data?.error;

    switch (status) {
      case 400:
        return message || 'Invalid request. Please check your input.';
      case 401:
        return message || 'Session expired. Please log in again.';
      case 403:
        return message || 'You do not have permission to perform this action.';
      case 404:
        return message || 'The requested resource was not found.';
      case 409:
        return message || 'This action conflicts with existing data.';
      case 422:
        return message || 'Validation failed. Please check your input.';
      case 429:
        return message || 'Too many requests. Please try again later.';
      case 500:
      case 502:
      case 503:
        return 'Server error. Please try again later.';
      default:
        return message || 'Something went wrong. Please try again.';
    }
  }

  if (error.request) {
    return 'Network error. Please check your connection.';
  }

  return error.message || 'An unexpected error occurred.';
};

const getErrorCode = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.status) {
    return `HTTP_${error.response.status}`;
  }
  return 'UNKNOWN_ERROR';
};

const isAuthError = (error) => {
  const status = error.response?.status;
  return status === 401 || status === 403;
};

const isNetworkError = (error) => {
  return !error.response && error.request;
};

const isValidationError = (error) => {
  return (
    error.response?.status === 400 ||
    error.response?.data?.error === 'VALIDATION_ERROR'
  );
};

const getValidationErrors = (error) => {
  if (error.response?.data?.details) {
    return error.response.data.details.reduce((acc, detail) => {
      acc[detail.field] = detail.message;
      return acc;
    }, {});
  }
  return {};
};

const apiErrorHandler = {
  getErrorMessage,
  getErrorCode,
  isAuthError,
  isNetworkError,
  isValidationError,
  getValidationErrors,
};

export default apiErrorHandler;
