import { useGetContractsByDeal } from '../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Variant_PurchaseContract_AssignmentContract } from '../backend';

interface ContractListProps {
  dealId: bigint;
}

export default function ContractList({ dealId }: ContractListProps) {
  const { data: contracts = [], isLoading, isError, error, refetch } = useGetContractsByDeal(dealId);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading contracts...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{(error as Error)?.message || 'Failed to load contracts'}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="ml-4"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No contracts uploaded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Uploaded Contracts</h3>
      {contracts.map((contract) => (
        <Card key={contract.id.toString()}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{contract.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {contract.documentType === Variant_PurchaseContract_AssignmentContract.PurchaseContract
                      ? 'Purchase Contract'
                      : 'Assignment Contract'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = contract.blob.getDirectURL();
                  window.open(url, '_blank');
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
