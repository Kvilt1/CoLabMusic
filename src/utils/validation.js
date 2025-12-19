/**
 * Validation utilities for data validation across the application
 */

import { ValidationError } from './errors';

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether the email is valid
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates a password
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum password length (default: 6)
 * @param {boolean} options.requireUppercase - Require uppercase letter (default: false)
 * @param {boolean} options.requireLowercase - Require lowercase letter (default: false)
 * @param {boolean} options.requireNumber - Require number (default: false)
 * @param {boolean} options.requireSpecial - Require special character (default: false)
 * @returns {Object} - Validation result with isValid and errors
 */
export function validatePassword(password, options = {}) {
  const {
    minLength = 6,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecial = false
  } = options;

  const errors = [];

  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] };
  }

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a vault name
 * @param {string} name - Vault name to validate
 * @returns {Object} - Validation result
 */
export function validateVaultName(name) {
  const errors = [];

  if (!name || typeof name !== 'string') {
    return { isValid: false, errors: ['Vault name is required'] };
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    errors.push('Vault name cannot be empty');
  }

  if (trimmedName.length > 100) {
    errors.push('Vault name must be less than 100 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: trimmedName
  };
}

/**
 * Validates a file for music upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxSize - Maximum file size in bytes (default: 100MB)
 * @param {string[]} options.allowedTypes - Allowed MIME types
 * @returns {Object} - Validation result
 */
export function validateMusicFile(file, options = {}) {
  const {
    maxSize = 100 * 1024 * 1024, // 100MB default
    allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
      'audio/flac'
    ]
  } = options;

  const errors = [];

  if (!file) {
    return { isValid: false, errors: ['No file provided'] };
  }

  if (!(file instanceof File)) {
    return { isValid: false, errors: ['Invalid file object'] };
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Check file extension as fallback
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'mp4', 'flac'];
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File extension .${extension} is not supported`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates an image file for cover art
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export function validateImageFile(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    minWidth = 200,
    minHeight = 200
  } = options;

  const errors = [];

  if (!file) {
    return { isValid: false, errors: ['No file provided'] };
  }

  if (!(file instanceof File)) {
    return { isValid: false, errors: ['Invalid file object'] };
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`Image size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Image type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a song metadata object
 * @param {Object} metadata - Song metadata to validate
 * @returns {Object} - Validation result
 */
export function validateSongMetadata(metadata) {
  const errors = [];

  if (!metadata || typeof metadata !== 'object') {
    return { isValid: false, errors: ['Invalid metadata object'] };
  }

  // Required fields
  if (!metadata.title || typeof metadata.title !== 'string' || metadata.title.trim().length === 0) {
    errors.push('Song title is required');
  }

  if (!metadata.artist || typeof metadata.artist !== 'string' || metadata.artist.trim().length === 0) {
    errors.push('Artist name is required');
  }

  // Optional fields validation
  if (metadata.album && typeof metadata.album !== 'string') {
    errors.push('Album must be a string');
  }

  if (metadata.duration && (typeof metadata.duration !== 'number' || metadata.duration <= 0)) {
    errors.push('Duration must be a positive number');
  }

  if (metadata.year && (typeof metadata.year !== 'number' || metadata.year < 1900 || metadata.year > new Date().getFullYear())) {
    errors.push('Year must be a valid year');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      title: metadata.title?.trim(),
      artist: metadata.artist?.trim(),
      album: metadata.album?.trim() || 'Unknown Album',
      duration: metadata.duration || 0,
      year: metadata.year || null
    }
  };
}

/**
 * Validates a vault invite code
 * @param {string} code - Invite code to validate
 * @returns {Object} - Validation result
 */
export function validateInviteCode(code) {
  const errors = [];

  if (!code || typeof code !== 'string') {
    return { isValid: false, errors: ['Invite code is required'] };
  }

  const trimmedCode = code.trim();

  if (trimmedCode.length === 0) {
    errors.push('Invite code cannot be empty');
  }

  // Typically 6-12 characters
  if (trimmedCode.length < 6 || trimmedCode.length > 12) {
    errors.push('Invite code must be between 6 and 12 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: trimmedCode
  };
}

/**
 * Sanitizes user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validates and sanitizes form data
 * @param {Object} data - Form data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} - Validation result with sanitized data
 */
export function validateForm(data, schema) {
  const errors = {};
  const sanitizedData = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required
    if (rules.required && (!value || (typeof value === 'string' && value.trim().length === 0))) {
      errors[field] = `${field} is required`;
      continue;
    }

    // Skip validation if not required and empty
    if (!rules.required && (!value || (typeof value === 'string' && value.trim().length === 0))) {
      sanitizedData[field] = value;
      continue;
    }

    // Type validation
    if (rules.type === 'email' && !isValidEmail(value)) {
      errors[field] = 'Invalid email address';
      continue;
    }

    if (rules.type === 'password') {
      const passwordValidation = validatePassword(value, rules.passwordOptions);
      if (!passwordValidation.isValid) {
        errors[field] = passwordValidation.errors[0];
        continue;
      }
    }

    // Min/Max length
    if (rules.minLength && value.length < rules.minLength) {
      errors[field] = `${field} must be at least ${rules.minLength} characters`;
      continue;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors[field] = `${field} must be less than ${rules.maxLength} characters`;
      continue;
    }

    // Custom validator
    if (rules.validator && typeof rules.validator === 'function') {
      const customValidation = rules.validator(value);
      if (!customValidation.isValid) {
        errors[field] = customValidation.errors[0];
        continue;
      }
    }

    // Sanitize string values
    sanitizedData[field] = typeof value === 'string' ? sanitizeInput(value) : value;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: sanitizedData
  };
}

/**
 * Throws a ValidationError if validation fails
 * @param {Object} validationResult - Result from validation function
 * @param {string} context - Context for error message
 * @throws {ValidationError}
 */
export function assertValid(validationResult, context = 'Validation') {
  if (!validationResult.isValid) {
    throw new ValidationError(
      `${context} failed: ${validationResult.errors.join(', ')}`,
      { errors: validationResult.errors }
    );
  }
}
