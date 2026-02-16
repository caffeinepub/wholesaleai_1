/**
 * Support contact utilities for Wholesale Lens
 */

export const SUPPORT_EMAIL = 'wholesalensrealestate@gmail.com';

/**
 * Opens the user's email client with a pre-addressed support email
 */
export function openSupportEmail(subject?: string, body?: string) {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  
  const queryString = params.toString();
  const mailtoUrl = `mailto:${SUPPORT_EMAIL}${queryString ? '?' + queryString : ''}`;
  
  window.location.href = mailtoUrl;
}

/**
 * Returns a mailto link for support
 */
export function getSupportMailtoLink(subject?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  
  const queryString = params.toString();
  return `mailto:${SUPPORT_EMAIL}${queryString ? '?' + queryString : ''}`;
}
