/**
 * Utility for detecting and handling authentication-related errors
 */

/**
 * Check if an error is authentication-related
 * CRITICAL FIX: Broadened to detect common auth failure patterns while avoiding
 * misclassification of first-time onboarding states
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const message = error?.message || String(error);
  const lowerMessage = message.toLowerCase();
  
  // Real authentication failures that require sign-out recovery
  // Expanded to catch more auth-related errors
  return (
    lowerMessage.includes('authentication error') ||
    lowerMessage.includes('please sign in') ||
    lowerMessage.includes('sign out and sign in') ||
    lowerMessage.includes('delegation expired') ||
    lowerMessage.includes('invalid identity') ||
    lowerMessage.includes('anonymous caller') ||
    lowerMessage.includes('forbidden') ||
    // Only treat "unauthorized" as auth error if it's NOT from first-time user flow
    // (first-time users are handled by returning null in the query)
    (lowerMessage.includes('unauthorized') && !lowerMessage.includes('profile'))
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
