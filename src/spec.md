# Specification

## Summary
**Goal:** Fix the intermittent startup failure where authenticated users get stuck on “Failed to load your profile” during the “Profile loading” stage, so login reliably reaches the app (or profile setup when appropriate).

**Planned changes:**
- Diagnose and fix the root cause of intermittent profile-loading failures that block existing authenticated users from reaching the main app shell.
- Update frontend error classification so auth/permission-related profile fetch failures consistently trigger the intended recovery flow (sign-out and return to sign-in) instead of looping on the profile loading error screen.
- Harden the backend caller profile retrieval path (getCallerUserProfile) to return a “no profile”/none result for new authenticated users rather than trapping/throwing, enabling the frontend to show profile setup.
- Improve frontend diagnostics for profile loading failures by logging the original error to the console, showing a safe technicalDetail on the startup error screen, and ensuring Retry clears any stale cached profile query state before refetching.

**User-visible outcome:** After signing in with Internet Identity, users reliably enter the app; new users without profiles are routed to profile setup; auth-related failures send users back to sign-in; Retry correctly re-attempts profile loading without a full refresh and shows useful (non-sensitive) technical details when it fails.
