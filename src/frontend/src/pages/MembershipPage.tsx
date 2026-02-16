import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { MembershipTier } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

const plans = [
  {
    tier: MembershipTier.Basic,
    name: 'Basic',
    price: '$15',
    period: 'month',
    features: [
      'Add Deals',
      'Use AI Analyzer',
      'Profit Calculations',
      'Basic Dashboard',
      'Limited to 15 active deals',
    ],
  },
  {
    tier: MembershipTier.Pro,
    name: 'Pro',
    price: '$20',
    period: 'month',
    features: [
      'Everything in Basic',
      'Unlimited Deals',
      'Buyers List',
      'Deal Pipeline Tracking',
      'Seller Notes',
      'Contract Deadlines',
    ],
  },
  {
    tier: MembershipTier.Enterprise,
    name: 'Enterprise',
    price: '$90',
    period: 'year',
    features: [
      'Everything in Pro',
      'Advanced Analytics',
      'Contract Management',
      'File Uploads',
      'Priority Support',
      'Early Access Features',
    ],
  },
];

export default function MembershipPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

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
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
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

