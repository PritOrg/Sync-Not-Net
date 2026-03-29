const validators = {
  required: (value, label = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${label} is required`;
    }
    return '';
  },

  email: (value) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
    return '';
  },

  minLength: (value, min, label = 'This field') => {
    if (!value) return `${label} is required`;
    if (value.length < min) return `${label} must be at least ${min} characters`;
    return '';
  },

  maxLength: (value, max, label = 'This field') => {
    if (value && value.length > max) return `${label} must be at most ${max} characters`;
    return '';
  },

  password: (value) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return '';
  },

  confirmPassword: (value, password) => {
    if (!value) return 'Please confirm your password';
    if (value !== password) return 'Passwords do not match';
    return '';
  },

  name: (value) => {
    if (!value || !value.trim()) return 'Name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    if (value.trim().length > 100) return 'Name must be at most 100 characters';
    return '';
  },

  title: (value) => {
    if (!value || !value.trim()) return 'Title is required';
    if (value.trim().length < 1) return 'Title is required';
    if (value.trim().length > 200) return 'Title must be at most 200 characters';
    return '';
  },

  searchQuery: (value, min = 2) => {
    if (value && value.length < min) return `Search query must be at least ${min} characters`;
    return '';
  },

  url: (value) => {
    if (!value) return '';
    try {
      new URL(value);
      return '';
    } catch {
      return 'Please enter a valid URL';
    }
  },

  objectId: (value, label = 'ID') => {
    if (!value) return `${label} is required`;
    if (!/^[0-9a-fA-F]{24}$/.test(value)) return `Invalid ${label} format`;
    return '';
  },
};

export const validate = (value, rules) => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return '';
};

export const validateForm = (formData, fieldRules) => {
  const errors = {};
  let hasError = false;

  for (const [field, rules] of Object.entries(fieldRules)) {
    const error = validate(formData[field], rules);
    if (error) {
      errors[field] = error;
      hasError = true;
    }
  }

  return { errors, hasError };
};

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

  return {
    score,
    label: labels[score - 1] || 'Too short',
    color: colors[score - 1] || '#e5e7eb',
    percent: (score / 5) * 100,
  };
};

export default validators;
