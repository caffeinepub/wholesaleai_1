# Specification

## Summary
**Goal:** Enable admins to manage membership plan pricing (including sales) and grant/revoke memberships to users, while keeping the Membership Plans page dynamically driven by backend configuration.

**Planned changes:**
- Add backend storage and public query for a membership catalog (Basic/Pro/Enterprise) including price, billing period, and optional sale settings, with sensible defaults when unconfigured.
- Add admin-only backend endpoints to update membership catalog pricing/sale settings using existing admin authorization.
- Add admin-only backend functionality to set a user’s membership tier (grant/revoke/downgrade) by specifying the user’s Principal and desired tier.
- Create a frontend Admin Panel page (admin-only) to manage membership catalog settings and grant memberships by Principal.
- Update the Membership Plans page to load pricing/sale state from the backend, clearly display sale pricing, and fall back to current hard-coded values on query failure with a non-blocking error.

**User-visible outcome:** Admins can open an Admin Panel to set membership prices, toggle sales and sale prices, and grant/revoke tiers for users by Principal; all users see Membership Plans reflect current backend pricing (including sales) with a safe fallback if loading fails.
