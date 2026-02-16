import { useState, useEffect } from 'react';
import { useGetBuyer, useCreateBuyer, useUpdateBuyer, useDeleteBuyer } from '../hooks/useQueries';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { OpaqueDialogContent } from './OpaqueOverlays';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface BuyerEditorDialogProps {
  buyerId: bigint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BuyerEditorDialog({ buyerId, open, onOpenChange }: BuyerEditorDialogProps) {
  const { data: buyer } = useGetBuyer(buyerId);
  const createBuyer = useCreateBuyer();
  const updateBuyer = useUpdateBuyer();
  const deleteBuyer = useDeleteBuyer();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredAreas, setPreferredAreas] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [propertyTypePreference, setPropertyTypePreference] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (buyer) {
      setName(buyer.name);
      setPhone(buyer.phone);
      setEmail(buyer.email);
      setPreferredAreas(buyer.preferredAreas.join(', '));
      setBudgetMin(buyer.budgetMin.toString());
      setBudgetMax(buyer.budgetMax.toString());
      setPropertyTypePreference(buyer.propertyTypePreference);
      setNotes(buyer.notes);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setPreferredAreas('');
      setBudgetMin('');
      setBudgetMax('');
      setPropertyTypePreference('');
      setNotes('');
    }
  }, [buyer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Buyer name is required');
      return;
    }

    const areas = preferredAreas
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a);

    const params = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      preferredAreas: areas,
      budgetMin: BigInt(budgetMin || 0),
      budgetMax: BigInt(budgetMax || 0),
      propertyTypePreference: propertyTypePreference.trim(),
      notes: notes.trim(),
    };

    if (buyerId && buyer) {
      updateBuyer.mutate(
        { buyerId, ...params },
        {
          onSuccess: () => {
            toast.success('Buyer updated successfully');
            onOpenChange(false);
          },
          onError: (error: any) => {
            toast.error(error.message || 'Failed to update buyer');
          },
        }
      );
    } else {
      createBuyer.mutate(params, {
        onSuccess: () => {
          toast.success('Buyer created successfully');
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to create buyer');
        },
      });
    }
  };

  const handleDelete = () => {
    if (!buyerId) return;
    if (!confirm('Are you sure you want to delete this buyer?')) return;

    deleteBuyer.mutate(buyerId, {
      onSuccess: () => {
        toast.success('Buyer deleted successfully');
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to delete buyer');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <OpaqueDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{buyerId ? 'Edit Buyer' : 'Add New Buyer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyType">Property Type Preference</Label>
            <Input
              id="propertyType"
              value={propertyTypePreference}
              onChange={(e) => setPropertyTypePreference(e.target.value)}
              placeholder="e.g., Single Family, Multi-Family"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budgetMin">Budget Min ($)</Label>
              <Input
                id="budgetMin"
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetMax">Budget Max ($)</Label>
              <Input
                id="budgetMax"
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="areas">Preferred Areas (comma-separated)</Label>
            <Input
              id="areas"
              value={preferredAreas}
              onChange={(e) => setPreferredAreas(e.target.value)}
              placeholder="Downtown, Midtown, Suburbs"
            />
          </div>

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
            {buyerId && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteBuyer.isPending}
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
              disabled={createBuyer.isPending || updateBuyer.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createBuyer.isPending || updateBuyer.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </OpaqueDialogContent>
    </Dialog>
  );
}
