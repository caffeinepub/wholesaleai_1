# Specification

## Summary
**Goal:** Make first-time and returning user startup reliable (no profile-load failure), add an in-app “Contact Us” mailto link, and polish the authenticated/startup UI for launch readiness.

**Planned changes:**
- Fix authenticated startup flow so caller profile fetch succeeds, and initialize a new profile path for brand-new users (show profile setup instead of a startup error).
- Ensure backend access control / initialization does not block first-time users from calling profile endpoints or saving a new profile.
- Improve startup failure handling to avoid infinite loading and provide clear recovery actions (Retry) plus a support path via “Contact Us” email when issues persist.
- Add a visible “Contact Us” action in the authenticated UI that opens the user’s email client addressed to wholesalensrealestate@gmail.com (mailto link).
- Apply cohesive UI theme polish across authenticated shell and startup screens (typography, spacing, warm real-estate/ledger feel) without adding new product features.

**User-visible outcome:** After signing in, users reliably reach the app (or profile setup for new users) without the profile-load startup error; if startup issues occur they can Retry or contact support via an in-app “Contact Us” email link, with a more cohesive launch-ready visual theme.
