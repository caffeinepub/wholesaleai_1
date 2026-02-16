import { useGetContractsByDeal } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, AlertCircle, Loader2, FileX } from 'lucide-react';
import { Variant_PurchaseContract_AssignmentContract, Variant_Unsigned_Signed, type ContractDocument } from '../backend';

interface ContractListProps {
  dealId: bigint;
}

export default function ContractList({ dealId }: ContractListProps) {
  const { data: contracts, isLoading, isError, error, refetch } = useGetContractsByDeal(dealId);

  const getDocumentTypeLabel = (type: Variant_PurchaseContract_AssignmentContract) => {
    switch (type) {
      case Variant_PurchaseContract_AssignmentContract.PurchaseContract:
        return 'Purchase Contract';
      case Variant_PurchaseContract_AssignmentContract.AssignmentContract:
        return 'Assignment Contract';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadge = (status: Variant_Unsigned_Signed) => {
    switch (status) {
      case Variant_Unsigned_Signed.Unsigned:
        return <Badge variant="outline">Unsigned</Badge>;
      case Variant_Unsigned_Signed.Signed:
        return <Badge variant="default" className="bg-success">Signed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleDownload = (contract: ContractDocument) => {
    const url = contract.blob.getDirectURL();
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error?.message || 'Failed to load contracts'}</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileX className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No contracts uploaded yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your first contract using the form above
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Contracts ({contracts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contracts.map((contract) => (
            <div
              key={contract.id.toString()}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{contract.fileName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {getDocumentTypeLabel(contract.documentType)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    {getStatusBadge(contract.signingStatus)}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(contract)}
                className="shrink-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
