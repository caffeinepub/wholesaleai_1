import { useState } from 'react';
import { useGetDeals, useGetCallerUserProfile } from '../hooks/useQueries';
import { MembershipTier } from '../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import FeatureLock from '../components/FeatureLock';
import ContractList from '../components/ContractList';
import ContractUploader from '../components/ContractUploader';

export default function ContractsPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: deals = [] } = useGetDeals();
  const [selectedDealId, setSelectedDealId] = useState<string>('');

  const hasAccess = userProfile?.membershipTier === MembershipTier.Enterprise;

  if (!hasAccess) {
    return (
      <FeatureLock
        feature="Contracts"
        requiredTier="Enterprise"
        description="Upload and manage contract documents, track signing status, closing dates, and earnest money deposits."
      />
    );
  }

  const selectedDeal = deals.find((d) => d.id.toString() === selectedDealId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
        <p className="text-muted-foreground">Manage contract documents and track deal progress</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Select Deal</Label>
            <Select value={selectedDealId} onValueChange={setSelectedDealId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a deal..." />
              </SelectTrigger>
              <SelectContent>
                {deals.map((deal) => (
                  <SelectItem key={deal.id.toString()} value={deal.id.toString()}>
                    {deal.address} - {deal.sellerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDeal && (
            <>
              <ContractUploader dealId={selectedDeal.id} />
              <ContractList dealId={selectedDeal.id} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

