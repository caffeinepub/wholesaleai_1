import { useState } from 'react';
import { useGetBuyers, useGetCallerUserProfile } from '../hooks/useQueries';
import { MembershipTier } from '../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import BuyerCard from '../components/BuyerCard';
import BuyerEditorDialog from '../components/BuyerEditorDialog';
import FeatureLock from '../components/FeatureLock';

export default function BuyersListPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: buyers = [], isLoading } = useGetBuyers();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBuyerId, setEditingBuyerId] = useState<bigint | null>(null);

  const hasAccess =
    userProfile?.membershipTier === MembershipTier.Pro ||
    userProfile?.membershipTier === MembershipTier.Enterprise;

  const handleCreateBuyer = () => {
    setEditingBuyerId(null);
    setEditorOpen(true);
  };

  const handleEditBuyer = (buyerId: bigint) => {
    setEditingBuyerId(buyerId);
    setEditorOpen(true);
  };

  if (!hasAccess) {
    return (
      <FeatureLock
        feature="Buyers List"
        requiredTier="Pro"
        description="Store and manage your cash buyers list with one-click assignment to deals."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading buyers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buyers List</h1>
          <p className="text-muted-foreground">Manage your cash buyers and assign them to deals</p>
        </div>
        <Button onClick={handleCreateBuyer} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Buyer
        </Button>
      </div>

      {buyers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No buyers yet. Add your first cash buyer to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {buyers.map((buyer) => (
            <BuyerCard
              key={buyer.id.toString()}
              buyer={buyer}
              onEdit={() => handleEditBuyer(buyer.id)}
            />
          ))}
        </div>
      )}

      {editorOpen && (
        <BuyerEditorDialog
          buyerId={editingBuyerId}
          open={editorOpen}
          onOpenChange={setEditorOpen}
        />
      )}
    </div>
  );
}

