# Specification

## Summary
**Goal:** Fix the post–Internet Identity login startup flow so authenticated users reliably reach onboarding (first-time users) or the main app (existing users) instead of getting stuck on a “Failed to load your profile” error.

**Planned changes:**
- Update the post-login startup/profile-loading flow to deterministically route to ProfileSetupDialog when no profile exists, or AppShell when a profile exists.
- Improve classification of profile-loading failures to distinguish first-time-user “no profile” from true authentication/session failures and other error types.
- Implement auth-error recovery during startup (clear identity + React Query cache, return to sign-in) without loops.
- Improve StartupErrorScreen diagnostics: user-friendly message by error type, sanitized technical details with a short hint (network/timeout/auth/unexpected), and a Retry that forces a real refetch (clearing stale cached results first).
- Harden backend startup profile APIs to avoid traps for normal first-time-user scenarios and provide a reliable “no profile yet” vs “auth failure” distinction.

**User-visible outcome:** After signing in with Internet Identity, users consistently land in profile setup (if new) or the app shell (if returning). If something goes wrong, the app either safely signs out and returns to sign-in for auth issues, or shows a clearer error with useful technical details and a working Retry.
