# Specification

## Summary
**Goal:** Improve the first-impression startup experience by polishing the unauthenticated sign-in screen and the required first-time profile setup dialog, with a cohesive visual theme.

**Planned changes:**
- Redesign the required ProfileSetupDialog (shown after first sign-in when no profile exists) with clearer English onboarding copy, improved layout, and the same non-dismissible gating behavior until a profile is created.
- Keep existing profile field rules and behaviors: name required (CTA disabled until non-empty), phone/email optional, in-button loading state on submit, close dialog on success, and show an in-dialog retryable error on failure without losing typed input.
- Upgrade the unauthenticated SignInScreen to a more premium, responsive layout (spacing/typography/card-like composition) while keeping the Internet Identity login flow unchanged and preserving the existing loading state (“Connecting...” + spinner).
- Apply a single consistent theme across sign-in, profile setup, and startup loading states (typography, spacing rhythm, and a non-blue/non-purple primary accent color used for CTAs and focus states), without modifying read-only UI component sources under `frontend/src/components/ui` (compose/wrap instead).

**User-visible outcome:** Users see a more polished sign-in screen and a clearer, more helpful required profile setup popup on first sign-in, with consistent styling and unchanged login/profile functionality.
