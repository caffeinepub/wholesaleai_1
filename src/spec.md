# Specification

## Summary
**Goal:** Fix the infinite “Loading your profile...” startup state by ensuring profile fetching always resolves to the app, profile setup, or an actionable error within a bounded time.

**Planned changes:**
- Add a hard timeout to the React Query profile request used by `useGetCallerUserProfile` so hung calls surface an error instead of staying in a loading state.
- Update startup gating in `frontend/src/App.tsx` to avoid blocking forever on `profileLoading`, including correct handling when the query is disabled/not running vs. errored.
- Ensure startup transitions deterministically to one of: AppShell, ProfileSetupDialog (only after confirmed missing profile from successful fetch), or StartupErrorScreen (with Retry wired to re-run the profile query).
- Add lightweight, user-safe diagnostic context on the startup error screen to distinguish timeout vs authorization vs generic failure without exposing secrets.

**User-visible outcome:** After signing in, the app no longer gets stuck on “Loading your profile...”; it reliably loads the app, prompts for profile setup when the profile is missing, or shows an error screen with a working Retry button and brief troubleshooting context.
