# Specification

## Summary
**Goal:** Fix app startup and first-time sign-in/profile loading so the app reliably reaches a usable screen, with clearer error reporting and resilient routing (including payment result hash routes).

**Planned changes:**
- Stabilize the startup flow to always render a usable UI state (loading, sign-in, profile setup, dashboard, or a stable error screen) and prevent blank screens/infinite loading.
- Ensure newly authenticated users can fetch/create/load their profile without requiring an admin token, including handling missing/empty profile data via a Profile Setup dialog and transitioning into the app without refresh.
- Improve StartupErrorScreen messaging to show a clear, user-readable failure reason (safe/no secrets) and provide a reliable Retry action that targets the failing step without retry loops.
- Make startup routing and payment result page detection resilient on Internet Computer hosting, including hash-based URLs, so payment success/failure pages render correctly without misrouting and navigation remains stable.

**User-visible outcome:** After launching, users see a working screen within 30 seconds (or an actionable error with Retry). First-time users can sign in, complete profile setup, and enter the app without admin tokens or refreshing. Payment success/failure URLs (including hash routes) open reliably and navigation works without breaking startup.
