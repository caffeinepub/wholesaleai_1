import { useEffect, useRef } from 'react';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useGetMembershipCatalog } from '../hooks/useQueries';
import { MembershipTier, type MembershipPricing } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCents } from '../lib/money';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Fallback values matching backend defaults
const FALLBACK_PRICING = {
  basic: {
    monthlyPriceCents: 499n,
    annualPriceCents: 4999n,
    isOnSale: false,
    salePriceCents: undefined,
  },
  pro: {
    monthlyPriceCents: 1499n,
    annualPriceCents: 14999n,
    isOnSale: false,
    salePriceCents: undefined,
  },
  enterprise: {
    monthlyPriceCents: 3999n,
    annualPriceCents: 39999n,
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
  const { data: catalog, isLoading: catalogLoading, isError: catalogError, error: catalogErrorObj, refetch: refetchCatalog } = useGetMembershipCatalog();
  const saveProfile = useSaveCallerUserProfile();
  const errorShownRef = useRef(false);

  // Use catalog data or fallback
  const pricing = catalog || FALLBACK_PRICING;

  // Show non-blocking error toast only once when catalog fails
  useEffect(() => {
    if (catalogError && !errorShownRef.current) {
      errorShownRef.current = true;
      toast.error('Failed to load current pricing. Showing default prices.', { 
        id: 'catalog-error',
        duration: 5000,
      });
    }
  }, [catalogError]);

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
      period: 'monthly' as const,
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
        onError: (error: any) => {
          toast.error(error.message || 'Failed to change plan. Please try again.');
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Membership Plans</h1>
        <p className="text-muted-foreground">Choose the plan that fits your wholesaling business</p>
      </div>

      {catalogLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Loading current pricing...</AlertDescription>
        </Alert>
      )}

      {catalogError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load pricing. Showing default prices.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchCatalog()}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const { price, salePrice, period } = getPriceDisplay(plan.pricing, plan.period);
          const isCurrentPlan = userProfile?.membershipTier === plan.tier;

          return (
            <Card key={plan.tier} className={isCurrentPlan ? 'border-primary shadow-lg' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  {isCurrentPlan && (
                    <span className="text-xs font-normal bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </CardTitle>
                <div className="mt-4">
                  {salePrice ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{salePrice}</span>
                        <span className="text-muted-foreground">/ {period}</span>
                      </div>
                      <div className="text-sm text-muted-foreground line-through">{price}</div>
                      <div className="text-xs text-primary font-medium mt-1">Sale Price!</div>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{price}</span>
                      <span className="text-muted-foreground">/ {period}</span>
                    </div>
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
                  disabled={isCurrentPlan || saveProfile.isPending}
                  className="w-full"
                  variant={isCurrentPlan ? 'outline' : 'default'}
                >
                  {saveProfile.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Switching...
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    `Switch to ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Note: This is a demo application. No actual payment processing is implemented.
            Plan changes are instant for demonstration purposes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
