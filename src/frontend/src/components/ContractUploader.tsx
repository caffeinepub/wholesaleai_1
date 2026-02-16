import { useState } from 'react';
import { useUploadContract } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Variant_PurchaseContract_AssignmentContract, ExternalBlob } from '../backend';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

interface ContractUploaderProps {
  dealId: bigint;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

export default function ContractUploader({ dealId }: ContractUploaderProps) {
  const [documentType, setDocumentType] = useState<string>(
    Variant_PurchaseContract_AssignmentContract.PurchaseContract
  );
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadContract = useUploadContract();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10MB');
      return;
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      toast.error('Only PDF and image files are allowed');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      uploadContract.mutate(
        {
          dealId,
          documentType: documentType as Variant_PurchaseContract_AssignmentContract,
          fileName: file.name,
          closingDate: null,
          emd: null,
          blob,
        },
        {
          onSuccess: () => {
            toast.success('Contract uploaded successfully');
            setFile(null);
            setUploadProgress(0);
            const input = document.getElementById('contract-file') as HTMLInputElement;
            if (input) input.value = '';
          },
          onError: (error: any) => {
            toast.error(error.message || 'Failed to upload contract');
            setUploadProgress(0);
          },
        }
      );
    } catch (error) {
      toast.error('Failed to read file');
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg">
      <h3 className="font-medium">Upload Contract Document</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Variant_PurchaseContract_AssignmentContract.PurchaseContract}>
                Purchase Contract
              </SelectItem>
              <SelectItem value={Variant_PurchaseContract_AssignmentContract.AssignmentContract}>
                Assignment Contract
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contract-file">File (PDF or Image, max 10MB)</Label>
          <Input
            id="contract-file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            disabled={uploadContract.isPending}
          />
        </div>
      </div>
      {file && (
        <div className="text-sm text-muted-foreground">
          Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
      <Button
        onClick={handleUpload}
        disabled={!file || uploadContract.isPending}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {uploadContract.isPending ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Contract
          </>
        )}
      </Button>
    </div>
  );
}

