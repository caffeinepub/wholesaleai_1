/**
 * Utility for detecting and handling authentication-related errors
 */

/**
 * Check if an error is authentication-related
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const message = error?.message || String(error);
  const lowerMessage = message.toLowerCase();
  
  return (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('authentication required') ||
    lowerMessage.includes('authentication error') ||
    lowerMessage.includes('please sign in') ||
    lowerMessage.includes('sign out and sign in')
  );
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: any): boolean {
  if (!error) return false;
  
  const message = error?.message || String(error);
  const lowerMessage = message.toLowerCase();
  
  return (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('timed out')
  );
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const message = error?.message || String(error);
  const lowerMessage = message.toLowerCase();
  
  return (
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('fetch')
  );
}

/**
 * Get a user-friendly error message based on error type
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (isAuthError(error)) {
    return 'Authentication error. Please sign out and sign in again.';
  }
  
  if (isTimeoutError(error)) {
    return 'The request timed out. Please check your connection and try again.';
  }
  
  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}
