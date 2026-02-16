import { useState, useEffect } from 'react';
import { useGetDeal, useCreateDeal, useUpdateDeal, useDeleteDeal, useGetBuyers } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DealStage } from '../backend';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface DealEditorDialogProps {
  dealId: bigint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const stages = [
  { value: DealStage.NewLead, label: 'New Lead' },
  { value: DealStage.ContactedSeller, label: 'Contacted Seller' },
  { value: DealStage.Negotiating, label: 'Negotiating' },
  { value: DealStage.UnderContract, label: 'Under Contract' },
  { value: DealStage.Assigned, label: 'Assigned' },
  { value: DealStage.Closed, label: 'Closed' },
];

export default function DealEditorDialog({ dealId, open, onOpenChange }: DealEditorDialogProps) {
  const { data: deal } = useGetDeal(dealId);
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
  }, [deal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sellerName.trim() || !address.trim()) {
      toast.error('Seller name and address are required');
      return;
    }

    const params = {
      sellerName: sellerName.trim(),
      sellerPhone: sellerPhone.trim(),
      address: address.trim(),
      arv: BigInt(arv || 0),
      repairs: BigInt(repairs || 0),
      askingPrice: BigInt(askingPrice || 0),
      yourOffer: BigInt(yourOffer || 0),
      notes: notes.trim(),
      estimatedProfit: BigInt(estimatedProfit || 0),
    };

    if (dealId && deal) {
      updateDeal.mutate(
        {
          dealId,
          stage,
          ...params,
          assignedBuyer: assignedBuyer ? BigInt(assignedBuyer) : null,
          contractDeadline: null,
          actualProfit: actualProfit ? BigInt(actualProfit) : null,
        },
        {
          onSuccess: () => {
            toast.success('Deal updated successfully');
            onOpenChange(false);
          },
          onError: (error: any) => {
            toast.error(error.message || 'Failed to update deal');
          },
        }
      );
    } else {
      createDeal.mutate(params, {
        onSuccess: () => {
          toast.success('Deal created successfully');
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to create deal');
        },
      });
    }
  };

  const handleDelete = () => {
    if (!dealId) return;
    if (!confirm('Are you sure you want to delete this deal?')) return;

    deleteDeal.mutate(dealId, {
      onSuccess: () => {
        toast.success('Deal deleted successfully');
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to delete deal');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dealId ? 'Edit Deal' : 'Create New Deal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {dealId && (
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as DealStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sellerName">Seller Name *</Label>
              <Input
                id="sellerName"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellerPhone">Seller Phone</Label>
              <Input
                id="sellerPhone"
                type="tel"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="arv">ARV ($)</Label>
              <Input
                id="arv"
                type="number"
                value={arv}
                onChange={(e) => setArv(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repairs">Repairs ($)</Label>
              <Input
                id="repairs"
                type="number"
                value={repairs}
                onChange={(e) => setRepairs(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="askingPrice">Asking Price ($)</Label>
              <Input
                id="askingPrice"
                type="number"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yourOffer">Your Offer ($)</Label>
              <Input
                id="yourOffer"
                type="number"
                value={yourOffer}
                onChange={(e) => setYourOffer(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedProfit">Estimated Profit ($)</Label>
              <Input
                id="estimatedProfit"
                type="number"
                value={estimatedProfit}
                onChange={(e) => setEstimatedProfit(e.target.value)}
              />
            </div>
            {dealId && stage === DealStage.Closed && (
              <div className="space-y-2">
                <Label htmlFor="actualProfit">Actual Profit ($)</Label>
                <Input
                  id="actualProfit"
                  type="number"
                  value={actualProfit}
                  onChange={(e) => setActualProfit(e.target.value)}
                />
              </div>
            )}
          </div>

          {buyers.length > 0 && (
            <div className="space-y-2">
              <Label>Assigned Buyer</Label>
              <Select value={assignedBuyer} onValueChange={setAssignedBuyer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select buyer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {buyers.map((buyer) => (
                    <SelectItem key={buyer.id.toString()} value={buyer.id.toString()}>
                      {buyer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            {dealId && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteDeal.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createDeal.isPending || updateDeal.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createDeal.isPending || updateDeal.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

