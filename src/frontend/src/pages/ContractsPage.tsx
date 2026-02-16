import { useState } from 'react';
import { useGetDeals, useGetCallerUserProfile } from '../hooks/useQueries';
import { MembershipTier } from '../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, FileText } from 'lucide-react';
import FeatureLock from '../components/FeatureLock';
import ContractList from '../components/ContractList';
import ContractUploader from '../components/ContractUploader';

export default function ContractsPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: deals = [], isLoading: dealsLoading, isError: dealsError, error: dealsErrorObj, refetch: refetchDeals } = useGetDeals();
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

      {dealsLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Loading your deals...</AlertDescription>
        </Alert>
      )}

      {dealsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{(dealsErrorObj as Error)?.message || 'Failed to load deals'}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchDeals()}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!dealsLoading && !dealsError && deals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Deals Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You need to create deals before you can upload contracts.
            </p>
            <p className="text-xs text-muted-foreground">
              Go to the Deals Pipeline to create your first deal.
            </p>
          </CardContent>
        </Card>
      )}

      {!dealsLoading && !dealsError && deals.length > 0 && (
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

            {!selectedDealId && (
              <Alert>
                <AlertDescription>
                  Please select a deal to upload and view contracts.
                </AlertDescription>
              </Alert>
            )}

            {selectedDeal && (
              <>
                <ContractUploader dealId={selectedDeal.id} />
                <ContractList dealId={selectedDeal.id} />
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
