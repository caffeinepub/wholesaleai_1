# Specification

## Summary
**Goal:** Fix the startup authentication error by preventing profile loading when signed out, and provide a clear sign-out recovery action for authentication-related profile load failures.

**Planned changes:**
- Gate the caller profile query so `useGetCallerUserProfile` only runs when an authenticated Internet Identity is present (not merely when an anonymous actor is ready), ensuring signed-out users are routed to `SignInScreen`.
- Update the startup error UI for authentication-related failures during “Profile loading” to include a “Sign Out” action that clears the Internet Identity session and returns to `SignInScreen`.
- Normalize detection/mapping of authentication-related errors from `getCallerUserProfile` so they consistently show the authentication guidance and recovery UI, while non-auth errors continue to show their appropriate messages.

**User-visible outcome:** Signed-out users see the sign-in screen without a startup “Unable to Start” profile-loading error; if an authenticated profile load fails due to authentication, the error screen offers a “Sign Out” button that returns the app to the sign-in screen.
