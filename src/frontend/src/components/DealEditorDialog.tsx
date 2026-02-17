import { useState, useEffect } from 'react';
import { useGetDeal, useCreateDeal, useUpdateDeal, useDeleteDeal, useGetBuyers } from '../hooks/useQueries';
import { OpaqueDialogContent } from './OpaqueOverlays';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OpaqueSelectContent } from './OpaqueOverlays';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DealStage } from '../backend';

interface DealEditorDialogProps {
  dealId: bigint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DealEditorDialog({ dealId, open, onOpenChange }: DealEditorDialogProps) {
  const isEditing = dealId !== null;
  const { data: deal, isLoading: dealLoading } = useGetDeal(dealId);
  const { data: buyers = [] } = useGetBuyers();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();

  const [stage, setStage] = useState<DealStage>(DealStage.NewLead);
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [arv, setArv] = useState('');
  const [repairs, setRepairs] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [yourOffer, setYourOffer] = useState('');
  const [assignedBuyer, setAssignedBuyer] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [estimatedProfit, setEstimatedProfit] = useState('');
  const [actualProfit, setActualProfit] = useState('');

  useEffect(() => {
    if (deal) {
      setStage(deal.stage);
      setSellerName(deal.sellerName);
      setSellerPhone(deal.sellerPhone);
      setAddress(deal.address);
      setArv(deal.arv.toString());
      setRepairs(deal.repairs.toString());
      setAskingPrice(deal.askingPrice.toString());
      setYourOffer(deal.yourOffer.toString());
      setAssignedBuyer(deal.assignedBuyer?.toString() || '');
      setNotes(deal.notes);
      setEstimatedProfit(deal.estimatedProfit.toString());
      setActualProfit(deal.actualProfit?.toString() || '');
    } else {
      // Reset form for new deal
      setStage(DealStage.NewLead);
      setSellerName('');
      setSellerPhone('');
      setAddress('');
      setArv('');
      setRepairs('');
      setAskingPrice('');
      setYourOffer('');
      setAssignedBuyer('');
      setNotes('');
      setEstimatedProfit('');
      setActualProfit('');
    }
  }, [deal, open]);

  const handleSubmit = async () => {
    if (!sellerName || !address || !arv || !yourOffer) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (isEditing && dealId) {
        await updateDeal.mutateAsync({
          dealId,
          stage,
          sellerName,
          sellerPhone,
          address,
          arv: BigInt(arv || 0),
          repairs: BigInt(repairs || 0),
          askingPrice: BigInt(askingPrice || 0),
          yourOffer: BigInt(yourOffer || 0),
          assignedBuyer: assignedBuyer ? BigInt(assignedBuyer) : null,
          contractDeadline: null,
          notes,
          estimatedProfit: BigInt(estimatedProfit || 0),
          actualProfit: actualProfit ? BigInt(actualProfit) : null,
        });
        toast.success('Deal updated successfully');
      } else {
        await createDeal.mutateAsync({
          sellerName,
          sellerPhone,
          address,
          arv: BigInt(arv || 0),
          repairs: BigInt(repairs || 0),
          askingPrice: BigInt(askingPrice || 0),
          yourOffer: BigInt(yourOffer || 0),
          notes,
          estimatedProfit: BigInt(estimatedProfit || 0),
        });
        toast.success('Deal created successfully');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save deal');
    }
  };

  const handleDelete = async () => {
    if (!dealId) return;
    
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      await deleteDeal.mutateAsync(dealId);
      toast.success('Deal deleted successfully');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete deal');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <OpaqueDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Deal' : 'New Deal'}</DialogTitle>
        </DialogHeader>

        {dealLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select value={stage} onValueChange={(value) => setStage(value as DealStage)}>
                  <SelectTrigger id="stage">
                    <SelectValue />
                  </SelectTrigger>
                  <OpaqueSelectContent>
                    <SelectItem value={DealStage.NewLead}>New Lead</SelectItem>
                    <SelectItem value={DealStage.ContactedSeller}>Contacted Seller</SelectItem>
                    <SelectItem value={DealStage.Negotiating}>Negotiating</SelectItem>
                    <SelectItem value={DealStage.UnderContract}>Under Contract</SelectItem>
                    <SelectItem value={DealStage.Assigned}>Assigned</SelectItem>
                    <SelectItem value={DealStage.Closed}>Closed</SelectItem>
                  </OpaqueSelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seller-name">Seller Name *</Label>
                <Input
                  id="seller-name"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-phone">Seller Phone</Label>
                <Input
                  id="seller-phone"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Property Address *</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State 12345"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arv">ARV *</Label>
                <Input
                  id="arv"
                  type="number"
                  value={arv}
                  onChange={(e) => setArv(e.target.value)}
                  placeholder="250000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repairs">Repairs</Label>
                <Input
                  id="repairs"
                  type="number"
                  value={repairs}
                  onChange={(e) => setRepairs(e.target.value)}
                  placeholder="35000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asking-price">Asking Price</Label>
                <Input
                  id="asking-price"
                  type="number"
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  placeholder="180000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="your-offer">Your Offer *</Label>
                <Input
                  id="your-offer"
                  type="number"
                  value={yourOffer}
                  onChange={(e) => setYourOffer(e.target.value)}
                  placeholder="155000"
                />
              </div>
            </div>

            {isEditing && buyers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="assigned-buyer">Assigned Buyer</Label>
                <Select value={assignedBuyer} onValueChange={setAssignedBuyer}>
                  <SelectTrigger id="assigned-buyer">
                    <SelectValue placeholder="Select a buyer..." />
                  </SelectTrigger>
                  <OpaqueSelectContent>
                    <SelectItem value="">None</SelectItem>
                    {buyers.map((buyer) => (
                      <SelectItem key={buyer.id.toString()} value={buyer.id.toString()}>
                        {buyer.name}
                      </SelectItem>
                    ))}
                  </OpaqueSelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated-profit">Estimated Profit</Label>
                <Input
                  id="estimated-profit"
                  type="number"
                  value={estimatedProfit}
                  onChange={(e) => setEstimatedProfit(e.target.value)}
                  placeholder="8000"
                />
              </div>
              {isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="actual-profit">Actual Profit</Label>
                  <Input
                    id="actual-profit"
                    type="number"
                    value={actualProfit}
                    onChange={(e) => setActualProfit(e.target.value)}
                    placeholder="7500"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this deal..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between">
          {isEditing && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDeal.isPending}
            >
              {deleteDeal.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createDeal.isPending || updateDeal.isPending}
            >
              {(createDeal.isPending || updateDeal.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </DialogFooter>
      </OpaqueDialogContent>
    </Dialog>
  );
}
