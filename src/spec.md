# Specification

## Summary
**Goal:** Lower membership plan prices and ensure the UI consistently presents pricing on a monthly basis across all plans.

**Planned changes:**
- Update backend default membership catalog pricing to: Basic 499/mo & 4999/yr, Pro 1499/mo & 14999/yr, Enterprise 3999/mo & 39999/yr; keep sale pricing disabled by default and update lastUpdated.
- Add backend upgrade logic to update stored membership catalog only when it still matches the previous default prices (so admin-customized catalogs are not overwritten).
- Update frontend Membership page fallback pricing to match the new lower monthly defaults when catalog loading fails.
- Update the Membership page UI to display monthly period labeling for all plans, including Enterprise.

**User-visible outcome:** Membership pricing appears significantly lower, and all plan cards display pricing as “/ month”; existing deployments adopt the new defaults automatically only if they were still using the old default pricing.
