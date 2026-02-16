# Specification

## Summary
**Goal:** Fix authenticated sidebar navigation so page switching reliably renders in the main content area, works on small screens, and does not break due to runtime/UI errors.

**Planned changes:**
- Debug and fix sidebar navigation routing/state so clicking any sidebar item updates the active state and renders the correct page in the main content area (not “stuck” in the sidebar).
- Adjust authenticated shell layout to prevent the sidebar from overlapping/hiding the main content area during navigation and normal use.
- Add responsive sidebar behavior for small screens (toggle open/close; selecting a nav item reveals content by closing or moving the navigation out of the way) without regressing the desktop persistent sidebar.
- Resolve navigation/page-switching-related runtime/UI errors and eliminate blocking console errors during basic authenticated navigation, adding a user-facing fallback when needed.

**User-visible outcome:** After signing in, users can switch between Dashboard, Deal Analyzer, Deals Pipeline, Buyers List, Contracts, Analytics, Membership, and Admin Panel and always see the selected page in the main content area; on mobile the sidebar can be toggled and won’t block the content; navigation no longer triggers usability-breaking errors.
