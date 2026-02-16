import { useState } from 'react';
import {
  useGetMembershipCatalog,
  useUpdateMembershipPricing,
  useUpdateMembershipTier,
  useIsCallerAdmin,
} from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { MembershipTier, type MembershipPricing } from '../backend';
import { Principal } from '@dfinity/principal';
import { formatCents, parseCents } from '../lib/money';
import { COPY } from '../lib/copy';
import AccessDeniedScreen from '../components/AccessDeniedScreen';
import { Loader2 } from 'lucide-react';

type TierKey = 'basic' | 'pro' | 'enterprise';

export default function AdminPanelPage() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: catalog, isLoading: catalogLoading } = useGetMembershipCatalog();
  const updatePricing = useUpdateMembershipPricing();
  const grantMembership = useUpdateMembershipTier();

  // Pricing form state
  const [pricingForm, setPricingForm] = useState<{
    basic: MembershipPricing;
    pro: MembershipPricing;
    enterprise: MembershipPricing;
  } | null>(null);

  // Grant membership form state
  const [grantForm, setGrantForm] = useState({
    principalText: '',
    tier: MembershipTier.Basic,
  });

  // Initialize form when catalog loads
  if (catalog && !pricingForm) {
    setPricingForm({
      basic: catalog.basic,
      pro: catalog.pro,
      enterprise: catalog.enterprise,
    });
  }

  const handlePricingChange = (tier: TierKey, field: keyof MembershipPricing, value: any) => {
    if (!pricingForm) return;
    setPricingForm({
      ...pricingForm,
      [tier]: {
        ...pricingForm[tier],
        [field]: value,
      },
    });
  };

  const handleSavePricing = async () => {
    if (!pricingForm) return;

    try {
      await updatePricing.mutateAsync(pricingForm);
      toast.success('Membership pricing updated successfully');
    } catch (error: any) {
      console.error('Failed to update pricing:', error);
      toast.error(error.message || 'Failed to update pricing');
    }
  };

  const handleGrantMembership = async () => {
    try {
      const principal = Principal.fromText(grantForm.principalText.trim());
      await grantMembership.mutateAsync({
        userId: principal,
        tier: grantForm.tier,
      });
      toast.success('Membership tier granted successfully');
      setGrantForm({ principalText: '', tier: MembershipTier.Basic });
    } catch (error: any) {
      console.error('Failed to grant membership:', error);
      if (error.message?.includes('Invalid principal')) {
        toast.error('Invalid Principal ID format');
      } else {
        toast.error(error.message || 'Failed to grant membership');
      }
    }
  };

  if (isAdminLoading || catalogLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDeniedScreen />;
  }

  if (!pricingForm) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{COPY.nav.admin}</h1>
        <p className="text-muted-foreground mt-2">
          Manage membership pricing and grant memberships to users
        </p>
      </div>

      {/* Membership Catalog Section */}
      <Card>
        <CardHeader>
          <CardTitle>{COPY.admin.catalogSection}</CardTitle>
          <CardDescription>{COPY.admin.catalogDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(['basic', 'pro', 'enterprise'] as TierKey[]).map((tierKey) => {
            const tierData = pricingForm[tierKey];
            const tierName = tierKey.charAt(0).toUpperCase() + tierKey.slice(1);

            return (
              <div key={tierKey} className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">{tierName} Tier</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${tierKey}-monthly`}>Monthly Price (USD)</Label>
                    <Input
                      id={`${tierKey}-monthly`}
                      type="text"
                      placeholder="29.99"
                      value={formatCents(tierData.monthlyPriceCents).replace('$', '')}
                      onChange={(e) =>
                        handlePricingChange(tierKey, 'monthlyPriceCents', parseCents(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${tierKey}-annual`}>Annual Price (USD)</Label>
                    <Input
                      id={`${tierKey}-annual`}
                      type="text"
                      placeholder="299.99"
                      value={formatCents(tierData.annualPriceCents).replace('$', '')}
                      onChange={(e) =>
                        handlePricingChange(tierKey, 'annualPriceCents', parseCents(e.target.value))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`${tierKey}-sale`}
                    checked={tierData.isOnSale}
                    onCheckedChange={(checked) => handlePricingChange(tierKey, 'isOnSale', checked)}
                  />
                  <Label htmlFor={`${tierKey}-sale`}>On Sale</Label>
                </div>
                {tierData.isOnSale && (
                  <div className="space-y-2">
                    <Label htmlFor={`${tierKey}-sale-price`}>Sale Price (USD)</Label>
                    <Input
                      id={`${tierKey}-sale-price`}
                      type="text"
                      placeholder="19.99"
                      value={
                        tierData.salePriceCents
                          ? formatCents(tierData.salePriceCents).replace('$', '')
                          : ''
                      }
                      onChange={(e) =>
                        handlePricingChange(
                          tierKey,
                          'salePriceCents',
                          e.target.value ? parseCents(e.target.value) : null
                        )
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
          <Button
            onClick={handleSavePricing}
            disabled={updatePricing.isPending}
            className="w-full md:w-auto"
          >
            {updatePricing.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              COPY.admin.savePricing
            )}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Grant Membership Section */}
      <Card>
        <CardHeader>
          <CardTitle>{COPY.admin.grantSection}</CardTitle>
          <CardDescription>{COPY.admin.grantDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="principal">User Principal ID</Label>
            <Input
              id="principal"
              type="text"
              placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
              value={grantForm.principalText}
              onChange={(e) => setGrantForm({ ...grantForm, principalText: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Enter the Principal ID of the user you want to grant a membership to
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tier">Membership Tier</Label>
            <Select
              value={grantForm.tier}
              onValueChange={(value) =>
                setGrantForm({ ...grantForm, tier: value as MembershipTier })
              }
            >
              <SelectTrigger id="tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MembershipTier.Basic}>Basic</SelectItem>
                <SelectItem value={MembershipTier.Pro}>Pro</SelectItem>
                <SelectItem value={MembershipTier.Enterprise}>Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGrantMembership}
            disabled={!grantForm.principalText.trim() || grantMembership.isPending}
            className="w-full md:w-auto"
          >
            {grantMembership.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Granting...
              </>
            ) : (
              COPY.admin.grantMembership
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
