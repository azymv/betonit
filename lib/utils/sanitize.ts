import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes a string input by removing potentially dangerous HTML/script tags
 * and special characters that could be used for SQL injection
 */
export function sanitizeString(input: string): string {
  // First, sanitize HTML/script tags
  const sanitizedHtml = DOMPurify.sanitize(input);
  
  // Then, remove SQL injection patterns
  return sanitizedHtml
    .replace(/['";\\]/g, '') // Remove SQL special characters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/;.*$/g, '') // Remove everything after semicolon
    .trim();
}

/**
 * Sanitizes an email address
 */
export function sanitizeEmail(email: string): string {
  return email
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '') // Only allow valid email characters
    .trim();
}

/**
 * Sanitizes a username
 */
export function sanitizeUsername(username: string): string {
  return username
    .replace(/[^a-zA-Z0-9_-]/g, '') // Only allow alphanumeric, underscore, and hyphen
    .trim();
}

/**
 * Sanitizes a URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const sanitized = DOMPurify.sanitize(url);
    new URL(sanitized); // Validate URL format
    return sanitized;
  } catch {
    return ''; // Return empty string if URL is invalid
  }
}

/**
 * Sanitizes a number input
 */
export function sanitizeNumber(input: string | number): number {
  const num = Number(input);
  return isNaN(num) ? 0 : num;
}

/**
 * Sanitizes a textarea content
 */
export function sanitizeTextarea(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'a'],
    ALLOWED_ATTR: ['href', 'target']
  });
}

/**
 * Validates and sanitizes a password
 */
export function sanitizePassword(password: string): string {
  // Remove any whitespace and special characters that could cause issues
  return password.replace(/\s/g, '');
}

/**
 * Sanitizes form data object
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      switch (key) {
        case 'email':
          sanitized[key] = sanitizeEmail(value);
          break;
        case 'username':
          sanitized[key] = sanitizeUsername(value);
          break;
        case 'password':
          sanitized[key] = sanitizePassword(value);
          break;
        case 'url':
        case 'image_url':
          sanitized[key] = sanitizeUrl(value);
          break;
        case 'description':
          sanitized[key] = sanitizeTextarea(value);
          break;
        default:
          sanitized[key] = sanitizeString(value);
      }
    } else if (typeof value === 'number') {
      sanitized[key] = sanitizeNumber(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
} 