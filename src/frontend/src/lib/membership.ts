import { MembershipTier } from '../backend';

export function canAccessBuyers(tier: MembershipTier): boolean {
  return tier === MembershipTier.Pro || tier === MembershipTier.Enterprise;
}

export function canAccessContracts(tier: MembershipTier): boolean {
  return tier === MembershipTier.Enterprise;
}

export function canAccessAnalytics(tier: MembershipTier): boolean {
  return tier === MembershipTier.Enterprise;
}

export function getActiveDealLimit(tier: MembershipTier): number | null {
  return tier === MembershipTier.Basic ? 15 : null;
}

export function getLockedFeatureMessage(feature: string, requiredTier: string): string {
  return `${feature} requires ${requiredTier} or higher membership. Upgrade to unlock this feature.`;
}

