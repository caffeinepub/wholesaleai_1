/**
 * Format cents (bigint) to USD string
 */
export function formatCents(cents: bigint): string {
  const dollars = Number(cents) / 100;
  return `$${dollars.toFixed(2).replace(/\.00$/, '')}`;
}

/**
 * Parse USD string to cents (bigint)
 */
export function parseCents(usdString: string): bigint {
  const cleaned = usdString.replace(/[$,]/g, '');
  const dollars = parseFloat(cleaned);
  if (isNaN(dollars)) return 0n;
  return BigInt(Math.round(dollars * 100));
}

/**
 * Compute annual savings vs paying monthly for 12 months
 */
export function computeAnnualSavings(
  monthlyPriceCents: bigint,
  annualPriceCents: bigint
): bigint {
  const yearlyMonthlyTotal = monthlyPriceCents * 12n;
  if (yearlyMonthlyTotal <= annualPriceCents) return 0n;
  return yearlyMonthlyTotal - annualPriceCents;
}

/**
 * Format monthly equivalent from annual price
 */
export function formatMonthlyEquivalent(annualPriceCents: bigint): string {
  const monthlyEquivalentCents = annualPriceCents / 12n;
  return formatCents(monthlyEquivalentCents);
}
