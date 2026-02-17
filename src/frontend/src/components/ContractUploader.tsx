import { useState } from 'react';
import { useUploadContract } from '../hooks/useQueries';
import { OpaqueCard, CardContent, CardHeader, CardTitle } from './OpaqueCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OpaqueSelectContent } from './OpaqueOverlays';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Variant_PurchaseContract_AssignmentContract } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

interface ContractUploaderProps {
  dealId: bigint;
}

export default function ContractUploader({ dealId }: ContractUploaderProps) {
  const uploadContract = useUploadContract();
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<Variant_PurchaseContract_AssignmentContract>(
    Variant_PurchaseContract_AssignmentContract.PurchaseContract
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Only PDF and image files are allowed');
        return;
      }
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      await uploadContract.mutateAsync({
        dealId,
        documentType,
        fileName: file.name,
        closingDate: null,
        emd: null,
        blob,
      });

      toast.success('Contract uploaded successfully');
      // Reset form
      setFile(null);
      setUploadProgress(0);
      setDocumentType(Variant_PurchaseContract_AssignmentContract.PurchaseContract);
      // Reset file input
      const fileInput = document.getElementById('contract-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload contract');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <OpaqueCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Contract
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="document-type">Document Type</Label>
          <Select
            value={documentType}
            onValueChange={(value) => setDocumentType(value as Variant_PurchaseContract_AssignmentContract)}
            disabled={isUploading}
          >
            <SelectTrigger id="document-type">
              <SelectValue />
            </SelectTrigger>
            <OpaqueSelectContent>
              <SelectItem value={Variant_PurchaseContract_AssignmentContract.PurchaseContract}>
                Purchase Contract
              </SelectItem>
              <SelectItem value={Variant_PurchaseContract_AssignmentContract.AssignmentContract}>
                Assignment Contract
              </SelectItem>
            </OpaqueSelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contract-file">Contract File</Label>
          <Input
            id="contract-file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <p className="text-xs text-muted-foreground">
            Accepted formats: PDF, JPG, PNG (max 10MB)
          </p>
        </div>

        {file && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </AlertDescription>
          </Alert>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="font-medium">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {uploadContract.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {uploadContract.error?.message || 'Failed to upload contract'}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>Uploading... {uploadProgress}%</>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Contract
            </>
          )}
        </Button>
      </CardContent>
    </OpaqueCard>
  );
}
