/**
 * Error handling utilities for consistent error management across the application
 */

/**
 * Custom error classes for specific error types
 */
export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class AuthError extends AppError {
  constructor(message, details = null) {
    super(message, 'AUTH_ERROR', details);
    this.name = 'AuthError';
  }
}

export class VaultError extends AppError {
  constructor(message, details = null) {
    super(message, 'VAULT_ERROR', details);
    this.name = 'VaultError';
  }
}

export class SongError extends AppError {
  constructor(message, details = null) {
    super(message, 'SONG_ERROR', details);
    this.name = 'SongError';
  }
}

export class StorageError extends AppError {
  constructor(message, details = null) {
    super(message, 'STORAGE_ERROR', details);
    this.name = 'StorageError';
  }
}

export class NetworkError extends AppError {
  constructor(message, details = null) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Error handler function that processes errors and returns user-friendly messages
 * @param {Error} error - The error to handle
 * @param {Object} options - Handler options
 * @param {Function} options.onError - Callback function to execute on error
 * @param {boolean} options.logError - Whether to log the error to console
 * @returns {Object} - Formatted error response
 */
export function handleError(error, options = {}) {
  const { onError, logError = true } = options;

  if (logError) {
    console.error('[Error Handler]:', error);
  }

  let userMessage = 'An unexpected error occurred';
  let errorCode = 'UNKNOWN_ERROR';

  if (error instanceof AppError) {
    userMessage = error.message;
    errorCode = error.code;
  } else if (error?.message) {
    userMessage = error.message;
  }

  const errorResponse = {
    error: userMessage,
    code: errorCode,
    timestamp: new Date().toISOString(),
    details: error?.details || null
  };

  if (onError && typeof onError === 'function') {
    onError(errorResponse);
  }

  return errorResponse;
}

/**
 * Wraps an async function with error handling
 * @param {Function} fn - The async function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} - Wrapped function with error handling
 */
export function withErrorHandler(fn, options = {}) {
  return async (...args) => {
    try {
      const result = await fn(...args);
      return { data: result, error: null };
    } catch (error) {
      const errorResponse = handleError(error, options);
      return { data: null, error: errorResponse };
    }
  };
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} options.shouldRetry - Function to determine if should retry
 * @returns {Promise} - Result of the function
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Error boundary helper for React components
 * @param {Error} error - The error that occurred
 * @param {Object} errorInfo - Error information from React
 * @returns {Object} - Formatted error info
 */
export function formatErrorBoundary(error, errorInfo) {
  return {
    message: error?.message || 'Component error',
    stack: error?.stack,
    componentStack: errorInfo?.componentStack,
    timestamp: new Date().toISOString()
  };
}

/**
 * Check if an error is a specific type
 * @param {Error} error - The error to check
 * @param {string} errorType - The error type to check against
 * @returns {boolean} - Whether the error is of the specified type
 */
export function isErrorType(error, errorType) {
  return error?.name === errorType || error?.code === errorType;
}

/**
 * Extract user-friendly error message from Supabase errors
 * @param {Object} error - Supabase error object
 * @returns {string} - User-friendly error message
 */
export function getSupabaseErrorMessage(error) {
  if (!error) return 'An unknown error occurred';

  // Common Supabase error messages
  const errorMessages = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please verify your email address',
    'User already registered': 'An account with this email already exists',
    'New password should be different from the old password': 'Please choose a different password',
    'Password should be at least 6 characters': 'Password must be at least 6 characters',
    'Unable to validate email address': 'Invalid email address format',
    'Database error saving new user': 'Unable to create account. Please try again.',
    'User not found': 'Account not found',
    'Token has expired or is invalid': 'Session expired. Please log in again.',
  };

  const message = error.message || error.error_description || '';

  // Check for exact matches
  if (errorMessages[message]) {
    return errorMessages[message];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(errorMessages)) {
    if (message.includes(key)) {
      return value;
    }
  }

  // Return original message or generic error
  return message || 'An error occurred. Please try again.';
}
