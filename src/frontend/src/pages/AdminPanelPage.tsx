import { useState } from 'react';
import { useIsCallerAdmin, useUpdateMembershipPricing, useGetMembershipCatalog, useUpdateMembershipTier, useIsStripeConfigured, useSetStripeConfiguration } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OpaqueSelectContent } from '../components/OpaqueOverlays';
import { Switch } from '@/components/ui/switch';
import { Loader2, DollarSign, Users, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MembershipTier, type MembershipPricing, type StripeConfiguration } from '../backend';
import { Principal } from '@dfinity/principal';
import { parseCents, formatCents } from '../lib/money';
import AccessDeniedScreen from '../components/AccessDeniedScreen';

export default function AdminPanelPage() {
  const { data: isAdmin, isLoading: adminCheckLoading } = useIsCallerAdmin();
  const { data: catalog, isLoading: catalogLoading } = useGetMembershipCatalog();
  const { data: isStripeConfigured, isLoading: stripeConfigLoading } = useIsStripeConfigured();
  const updatePricing = useUpdateMembershipPricing();
  const updateTier = useUpdateMembershipTier();
  const setStripeConfig = useSetStripeConfiguration();

  // Pricing state
  const [basicMonthly, setBasicMonthly] = useState('');
  const [basicAnnual, setBasicAnnual] = useState('');
  const [basicOnSale, setBasicOnSale] = useState(false);
  const [basicSalePrice, setBasicSalePrice] = useState('');

  const [proMonthly, setProMonthly] = useState('');
  const [proAnnual, setProAnnual] = useState('');
  const [proOnSale, setProOnSale] = useState(false);
  const [proSalePrice, setProSalePrice] = useState('');

  const [enterpriseMonthly, setEnterpriseMonthly] = useState('');
  const [enterpriseAnnual, setEnterpriseAnnual] = useState('');
  const [enterpriseOnSale, setEnterpriseOnSale] = useState(false);
  const [enterpriseSalePrice, setEnterpriseSalePrice] = useState('');

  // Grant membership state
  const [grantPrincipal, setGrantPrincipal] = useState('');
  const [grantTier, setGrantTier] = useState<MembershipTier>(MembershipTier.Basic);

  // Stripe configuration state
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeCountries, setStripeCountries] = useState('US,CA,GB');

  // Load catalog data into form
  useState(() => {
    if (catalog) {
      setBasicMonthly(formatCents(catalog.basic.monthlyPriceCents));
      setBasicAnnual(formatCents(catalog.basic.annualPriceCents));
      setBasicOnSale(catalog.basic.isOnSale);
      setBasicSalePrice(catalog.basic.salePriceCents ? formatCents(catalog.basic.salePriceCents) : '');

      setProMonthly(formatCents(catalog.pro.monthlyPriceCents));
      setProAnnual(formatCents(catalog.pro.annualPriceCents));
      setProOnSale(catalog.pro.isOnSale);
      setProSalePrice(catalog.pro.salePriceCents ? formatCents(catalog.pro.salePriceCents) : '');

      setEnterpriseMonthly(formatCents(catalog.enterprise.monthlyPriceCents));
      setEnterpriseAnnual(formatCents(catalog.enterprise.annualPriceCents));
      setEnterpriseOnSale(catalog.enterprise.isOnSale);
      setEnterpriseSalePrice(catalog.enterprise.salePriceCents ? formatCents(catalog.enterprise.salePriceCents) : '');
    }
  });

  if (adminCheckLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDeniedScreen />;
  }

  const handleUpdatePricing = () => {
    try {
      const basic: MembershipPricing = {
        monthlyPriceCents: parseCents(basicMonthly),
        annualPriceCents: parseCents(basicAnnual),
        isOnSale: basicOnSale,
        salePriceCents: basicOnSale && basicSalePrice ? parseCents(basicSalePrice) : undefined,
      };

      const pro: MembershipPricing = {
        monthlyPriceCents: parseCents(proMonthly),
        annualPriceCents: parseCents(proAnnual),
        isOnSale: proOnSale,
        salePriceCents: proOnSale && proSalePrice ? parseCents(proSalePrice) : undefined,
      };

      const enterprise: MembershipPricing = {
        monthlyPriceCents: parseCents(enterpriseMonthly),
        annualPriceCents: parseCents(enterpriseAnnual),
        isOnSale: enterpriseOnSale,
        salePriceCents: enterpriseOnSale && enterpriseSalePrice ? parseCents(enterpriseSalePrice) : undefined,
      };

      updatePricing.mutate(
        { basic, pro, enterprise },
        {
          onSuccess: () => {
            toast.success('Membership pricing updated successfully');
          },
          onError: (error: any) => {
            toast.error(error.message || 'Failed to update pricing');
          },
        }
      );
    } catch (error: any) {
      toast.error(error.message || 'Invalid price format');
    }
  };

  const handleGrantMembership = () => {
    try {
      const principal = Principal.fromText(grantPrincipal);
      updateTier.mutate(
        { userId: principal, tier: grantTier },
        {
          onSuccess: () => {
            toast.success('Membership tier updated successfully');
            setGrantPrincipal('');
          },
          onError: (error: any) => {
            toast.error(error.message || 'Failed to update membership tier');
          },
        }
      );
    } catch (error: any) {
      toast.error('Invalid Principal ID format');
    }
  };

  const handleConfigureStripe = () => {
    if (!stripeSecretKey.trim()) {
      toast.error('Stripe secret key is required');
      return;
    }

    const countries = stripeCountries
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(c => c.length === 2);

    if (countries.length === 0) {
      toast.error('At least one country code is required');
      return;
    }

    const config: StripeConfiguration = {
      secretKey: stripeSecretKey,
      allowedCountries: countries,
    };

    setStripeConfig.mutate(config, {
      onSuccess: () => {
        toast.success('Stripe configuration saved successfully');
        setStripeSecretKey('');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to save Stripe configuration');
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">Manage membership pricing, user tiers, and payment settings</p>
      </div>

      <Tabs defaultValue="pricing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pricing">
            <DollarSign className="h-4 w-4 mr-2" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Membership Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {catalogLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Basic Tier */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">Basic Tier</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="basic-monthly">Monthly Price</Label>
                        <Input
                          id="basic-monthly"
                          placeholder="$6.99"
                          value={basicMonthly}
                          onChange={(e) => setBasicMonthly(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="basic-annual">Annual Price</Label>
                        <Input
                          id="basic-annual"
                          placeholder="$49.99"
                          value={basicAnnual}
                          onChange={(e) => setBasicAnnual(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="basic-sale"
                        checked={basicOnSale}
                        onCheckedChange={setBasicOnSale}
                      />
                      <Label htmlFor="basic-sale">On Sale</Label>
                    </div>
                    {basicOnSale && (
                      <div className="space-y-2">
                        <Label htmlFor="basic-sale-price">Sale Price</Label>
                        <Input
                          id="basic-sale-price"
                          placeholder="$4.99"
                          value={basicSalePrice}
                          onChange={(e) => setBasicSalePrice(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Pro Tier */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">Pro Tier</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pro-monthly">Monthly Price</Label>
                        <Input
                          id="pro-monthly"
                          placeholder="$19.99"
                          value={proMonthly}
                          onChange={(e) => setProMonthly(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pro-annual">Annual Price</Label>
                        <Input
                          id="pro-annual"
                          placeholder="$149.99"
                          value={proAnnual}
                          onChange={(e) => setProAnnual(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="pro-sale"
                        checked={proOnSale}
                        onCheckedChange={setProOnSale}
                      />
                      <Label htmlFor="pro-sale">On Sale</Label>
                    </div>
                    {proOnSale && (
                      <div className="space-y-2">
                        <Label htmlFor="pro-sale-price">Sale Price</Label>
                        <Input
                          id="pro-sale-price"
                          placeholder="$14.99"
                          value={proSalePrice}
                          onChange={(e) => setProSalePrice(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Enterprise Tier */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">Enterprise Tier</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="enterprise-monthly">Monthly Price</Label>
                        <Input
                          id="enterprise-monthly"
                          placeholder="$59.99"
                          value={enterpriseMonthly}
                          onChange={(e) => setEnterpriseMonthly(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="enterprise-annual">Annual Price</Label>
                        <Input
                          id="enterprise-annual"
                          placeholder="$399.99"
                          value={enterpriseAnnual}
                          onChange={(e) => setEnterpriseAnnual(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enterprise-sale"
                        checked={enterpriseOnSale}
                        onCheckedChange={setEnterpriseOnSale}
                      />
                      <Label htmlFor="enterprise-sale">On Sale</Label>
                    </div>
                    {enterpriseOnSale && (
                      <div className="space-y-2">
                        <Label htmlFor="enterprise-sale-price">Sale Price</Label>
                        <Input
                          id="enterprise-sale-price"
                          placeholder="$44.99"
                          value={enterpriseSalePrice}
                          onChange={(e) => setEnterpriseSalePrice(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleUpdatePricing}
                    disabled={updatePricing.isPending}
                    className="w-full"
                  >
                    {updatePricing.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Pricing'
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grant Membership Tier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grant-principal">User Principal ID</Label>
                <Input
                  id="grant-principal"
                  placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                  value={grantPrincipal}
                  onChange={(e) => setGrantPrincipal(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grant-tier">Membership Tier</Label>
                <Select
                  value={grantTier}
                  onValueChange={(value) => setGrantTier(value as MembershipTier)}
                >
                  <SelectTrigger id="grant-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <OpaqueSelectContent>
                    <SelectItem value={MembershipTier.Basic}>Basic</SelectItem>
                    <SelectItem value={MembershipTier.Pro}>Pro</SelectItem>
                    <SelectItem value={MembershipTier.Enterprise}>Enterprise</SelectItem>
                  </OpaqueSelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGrantMembership}
                disabled={updateTier.isPending || !grantPrincipal}
                className="w-full"
              >
                {updateTier.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Grant Membership'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Stripe Configuration</span>
                {stripeConfigLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : isStripeConfigured ? (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <CheckCircle className="h-4 w-4" />
                    Configured
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <XCircle className="h-4 w-4" />
                    Not Configured
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripe-key">Stripe Secret Key</Label>
                <Input
                  id="stripe-key"
                  type="password"
                  placeholder="sk_test_..."
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your Stripe secret key (starts with sk_test_ or sk_live_)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe-countries">Allowed Countries</Label>
                <Input
                  id="stripe-countries"
                  placeholder="US,CA,GB"
                  value={stripeCountries}
                  onChange={(e) => setStripeCountries(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of 2-letter country codes (e.g., US, CA, GB)
                </p>
              </div>
              <Button
                onClick={handleConfigureStripe}
                disabled={setStripeConfig.isPending}
                className="w-full"
              >
                {setStripeConfig.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
