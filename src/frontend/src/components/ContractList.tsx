import { useGetContractsByDeal } from '../hooks/useQueries';
import { OpaqueCard, CardContent, CardHeader, CardTitle } from './OpaqueCard';
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
    try {
      const url = contract.blob.getDirectURL();
      const link = document.createElement('a');
      link.href = url;
      link.download = contract.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (isLoading) {
    return (
      <OpaqueCard>
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
      </OpaqueCard>
    );
  }

  if (isError) {
    return (
      <OpaqueCard>
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
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </OpaqueCard>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <OpaqueCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileX className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No contracts uploaded yet</p>
            <p className="text-sm text-muted-foreground">Upload a contract using the form above</p>
          </div>
        </CardContent>
      </OpaqueCard>
    );
  }

  return (
    <OpaqueCard>
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
              className="flex items-center justify-between p-4 border rounded-lg opaque-panel"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="font-medium text-sm truncate">{contract.fileName}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{getDocumentTypeLabel(contract.documentType)}</span>
                  <span>•</span>
                  <span>{new Date(Number(contract.uploadedAt) / 1000000).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {getStatusBadge(contract.signingStatus)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(contract)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </OpaqueCard>
  );
}
