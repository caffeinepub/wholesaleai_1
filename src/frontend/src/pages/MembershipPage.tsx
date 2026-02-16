import { useState } from 'react';
import { useGetMembershipCatalog, useCreateCheckoutSession } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { MembershipTier, type ShoppingItem } from '../backend';
import { formatCents } from '../lib/money';

export default function MembershipPage() {
  const { data: catalog, isLoading } = useGetMembershipCatalog();
  const createCheckoutSession = useCreateCheckoutSession();
  const [isAnnual, setIsAnnual] = useState(false);

  const handleUpgrade = async (tier: MembershipTier, tierName: string) => {
    if (!catalog) return;

    try {
      let pricing;
      let productName;
      let productDescription;

      switch (tier) {
        case MembershipTier.Basic:
          pricing = catalog.basic;
          productName = 'Wholesale Lens Basic';
          productDescription = 'Basic membership with core features';
          break;
        case MembershipTier.Pro:
          pricing = catalog.pro;
          productName = 'Wholesale Lens Pro';
          productDescription = 'Pro membership with advanced features';
          break;
        case MembershipTier.Enterprise:
          pricing = catalog.enterprise;
          productName = 'Wholesale Lens Enterprise';
          productDescription = 'Enterprise membership with all features';
          break;
      }

      const priceInCents = isAnnual
        ? pricing.annualPriceCents
        : pricing.monthlyPriceCents;

      const finalPrice = pricing.isOnSale && pricing.salePriceCents
        ? pricing.salePriceCents
        : priceInCents;

      const items: ShoppingItem[] = [
        {
          productName: `${productName} - ${isAnnual ? 'Annual' : 'Monthly'}`,
          productDescription,
          priceInCents: finalPrice,
          quantity: 1n,
          currency: 'usd',
        },
      ];

      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-cancel`;

      const session = await createCheckoutSession.mutateAsync({
        items,
        successUrl,
        cancelUrl,
      });

      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }

      window.location.href = session.url;
    } catch (error: any) {
      toast.error(error.message || 'Failed to start checkout');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Unable to load membership plans</p>
      </div>
    );
  }

  const tiers = [
    {
      name: 'Basic',
      tier: MembershipTier.Basic,
      pricing: catalog.basic,
      description: 'Perfect for getting started with wholesale real estate',
      features: [
        'Up to 15 active deals',
        'AI-powered deal analyzer',
        'Deal pipeline management',
        'Basic analytics',
        'Email support',
      ],
    },
    {
      name: 'Pro',
      tier: MembershipTier.Pro,
      pricing: catalog.pro,
      description: 'For serious wholesalers ready to scale',
      features: [
        'Unlimited active deals',
        'AI-powered deal analyzer',
        'Advanced deal pipeline',
        'Buyers list management',
        'Buyer-deal matching',
        'Priority support',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      tier: MembershipTier.Enterprise,
      pricing: catalog.enterprise,
      description: 'Complete solution for high-volume operations',
      features: [
        'Everything in Pro',
        'Contract management',
        'Document storage',
        'Advanced analytics',
        'Profit tracking by zip',
        'Dedicated support',
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan to power your wholesale real estate business
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Label htmlFor="billing-toggle" className={!isAnnual ? 'font-semibold' : ''}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <Label htmlFor="billing-toggle" className={isAnnual ? 'font-semibold' : ''}>
            Annual
            <span className="ml-2 text-primary text-sm">(Save up to 30%)</span>
          </Label>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map((tierInfo) => {
          const pricing = tierInfo.pricing;
          const priceInCents = isAnnual
            ? pricing.annualPriceCents
            : pricing.monthlyPriceCents;

          const finalPrice = pricing.isOnSale && pricing.salePriceCents
            ? pricing.salePriceCents
            : priceInCents;

          const isOnSale = pricing.isOnSale && pricing.salePriceCents;

          return (
            <Card
              key={tierInfo.name}
              className={`relative ${
                tierInfo.popular
                  ? 'border-primary shadow-lg scale-105'
                  : 'border-border'
              }`}
            >
              {tierInfo.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{tierInfo.name}</CardTitle>
                <CardDescription className="text-base pt-2">
                  {tierInfo.description}
                </CardDescription>

                <div className="pt-6">
                  {isOnSale && (
                    <div className="text-muted-foreground line-through text-lg">
                      {formatCents(priceInCents)}
                    </div>
                  )}
                  <div className="text-4xl font-bold">
                    {formatCents(finalPrice)}
                  </div>
                  <div className="text-muted-foreground text-sm mt-1">
                    per {isAnnual ? 'year' : 'month'}
                  </div>
                  {isOnSale && (
                    <div className="text-primary text-sm font-semibold mt-2">
                      Limited Time Sale!
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {tierInfo.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(tierInfo.tier, tierInfo.name)}
                  disabled={createCheckoutSession.isPending}
                  className="w-full"
                  variant={tierInfo.popular ? 'default' : 'outline'}
                >
                  {createCheckoutSession.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Get Started'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-16 text-center text-sm text-muted-foreground">
        <p>All plans include a 7-day money-back guarantee</p>
        <p className="mt-2">Need help choosing? Contact our support team</p>
      </div>
    </div>
  );
}
