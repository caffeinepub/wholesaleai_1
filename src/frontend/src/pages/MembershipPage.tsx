import { useGetCallerUserProfile, useSaveCallerUserProfile, useGetMembershipCatalog } from '../hooks/useQueries';
import { MembershipTier, type MembershipPricing } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatCents } from '../lib/money';

// Fallback values matching backend defaults
const FALLBACK_PRICING = {
  basic: {
    monthlyPriceCents: 2999n,
    annualPriceCents: 29999n,
    isOnSale: false,
    salePriceCents: undefined,
  },
  pro: {
    monthlyPriceCents: 8999n,
    annualPriceCents: 89999n,
    isOnSale: false,
    salePriceCents: undefined,
  },
  enterprise: {
    monthlyPriceCents: 29999n,
    annualPriceCents: 299999n,
    isOnSale: false,
    salePriceCents: undefined,
  },
};

const PLAN_FEATURES = {
  [MembershipTier.Basic]: [
    'Add Deals',
    'Use AI Analyzer',
    'Profit Calculations',
    'Basic Dashboard',
    'Limited to 15 active deals',
  ],
  [MembershipTier.Pro]: [
    'Everything in Basic',
    'Unlimited Deals',
    'Buyers List',
    'Deal Pipeline Tracking',
    'Seller Notes',
    'Contract Deadlines',
  ],
  [MembershipTier.Enterprise]: [
    'Everything in Pro',
    'Advanced Analytics',
    'Contract Management',
    'File Uploads',
    'Priority Support',
    'Early Access Features',
  ],
};

function getPriceDisplay(pricing: MembershipPricing, period: 'monthly' | 'annual'): {
  price: string;
  salePrice: string | null;
  period: string;
} {
  const isMonthly = period === 'monthly';
  const regularPrice = isMonthly ? pricing.monthlyPriceCents : pricing.annualPriceCents;
  const periodLabel = isMonthly ? 'month' : 'year';

  if (pricing.isOnSale && pricing.salePriceCents) {
    return {
      price: formatCents(regularPrice),
      salePrice: formatCents(pricing.salePriceCents),
      period: periodLabel,
    };
  }

  return {
    price: formatCents(regularPrice),
    salePrice: null,
    period: periodLabel,
  };
}

export default function MembershipPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: catalog, isError: catalogError } = useGetMembershipCatalog();
  const saveProfile = useSaveCallerUserProfile();

  // Use catalog data or fallback
  const pricing = catalog || FALLBACK_PRICING;

  // Show non-blocking error if catalog failed to load
  if (catalogError) {
    toast.error('Failed to load current pricing. Showing default prices.', { id: 'catalog-error' });
  }

  const plans = [
    {
      tier: MembershipTier.Basic,
      name: 'Basic',
      pricing: pricing.basic,
      period: 'monthly' as const,
      features: PLAN_FEATURES[MembershipTier.Basic],
    },
    {
      tier: MembershipTier.Pro,
      name: 'Pro',
      pricing: pricing.pro,
      period: 'monthly' as const,
      features: PLAN_FEATURES[MembershipTier.Pro],
    },
    {
      tier: MembershipTier.Enterprise,
      name: 'Enterprise',
      pricing: pricing.enterprise,
      period: 'annual' as const,
      features: PLAN_FEATURES[MembershipTier.Enterprise],
    },
  ];

  const handleChangePlan = (tier: MembershipTier) => {
    if (!userProfile) return;
    if (userProfile.membershipTier === tier) {
      toast.info('You are already on this plan');
      return;
    }

    saveProfile.mutate(
      { ...userProfile, membershipTier: tier },
      {
        onSuccess: () => {
          toast.success(`Successfully switched to ${tier} plan!`);
        },
        onError: () => {
          toast.error('Failed to change plan. Please try again.');
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Membership Plans</h1>
        <p className="text-muted-foreground mt-2">
          Choose the plan that fits your wholesaling business
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = userProfile?.membershipTier === plan.tier;
          const priceDisplay = getPriceDisplay(plan.pricing, plan.period);

          return (
            <Card
              key={plan.tier}
              className={isCurrent ? 'border-primary border-2' : ''}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  {isCurrent && (
                    <span className="text-xs font-normal bg-primary text-primary-foreground px-2 py-1 rounded">
                      Current
                    </span>
                  )}
                </CardTitle>
                <div className="mt-4">
                  {priceDisplay.salePrice ? (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-primary">
                          {priceDisplay.salePrice}
                        </span>
                        <span className="text-muted-foreground">/{priceDisplay.period}</span>
                      </div>
                      <div className="text-sm text-muted-foreground line-through">
                        {priceDisplay.price}
                      </div>
                      <div className="text-xs font-medium text-primary">ON SALE</div>
                    </div>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">{priceDisplay.price}</span>
                      <span className="text-muted-foreground">/{priceDisplay.period}</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleChangePlan(plan.tier)}
                  disabled={isCurrent || saveProfile.isPending}
                  className="w-full"
                  variant={isCurrent ? 'outline' : 'default'}
                >
                  {isCurrent ? 'Current Plan' : 'Switch to ' + plan.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Note: This is a demo environment. No actual payment processing is implemented.
            Plan changes take effect immediately.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
