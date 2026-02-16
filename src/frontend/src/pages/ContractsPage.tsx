import { useState } from 'react';
import { useGetDeals, useGetCallerUserProfile } from '../hooks/useQueries';
import { MembershipTier } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ContractUploader from '../components/ContractUploader';
import ContractList from '../components/ContractList';
import FeatureLock from '../components/FeatureLock';
import PageQueryErrorState from '../components/PageQueryErrorState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContractsPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: deals = [], isLoading, isError, error, refetch } = useGetDeals();
  const [selectedDealId, setSelectedDealId] = useState<bigint | null>(null);

  const hasAccess = userProfile?.membershipTier === MembershipTier.Enterprise;

  if (!hasAccess) {
    return (
      <FeatureLock
        feature="Contracts"
        requiredTier="Enterprise"
        description="Upload and manage purchase and assignment contracts for your deals"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading deals...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground">Manage purchase and assignment contracts</p>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error?.message || 'Failed to load deals. Please try again.'}</span>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground">Manage purchase and assignment contracts</p>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No deals found. Create a deal in the Deals Pipeline first, then upload contracts here.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
        <p className="text-muted-foreground">Manage purchase and assignment contracts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Deal</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedDealId?.toString() || ''}
            onValueChange={(value) => setSelectedDealId(BigInt(value))}
          >
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
        </CardContent>
      </Card>

      {selectedDealId && (
        <>
          <ContractUploader dealId={selectedDealId} />
          <ContractList dealId={selectedDealId} />
        </>
      )}
    </div>
  );
}
