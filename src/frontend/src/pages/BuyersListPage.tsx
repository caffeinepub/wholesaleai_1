import { useState } from 'react';
import { useGetBuyers, useGetCallerUserProfile } from '../hooks/useQueries';
import { MembershipTier } from '../backend';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import BuyerCard from '../components/BuyerCard';
import BuyerEditorDialog from '../components/BuyerEditorDialog';
import FeatureLock from '../components/FeatureLock';
import PageQueryErrorState from '../components/PageQueryErrorState';
import { COPY } from '../lib/copy';

export default function BuyersListPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: buyers = [], isLoading, isError, error, refetch } = useGetBuyers();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBuyerId, setEditingBuyerId] = useState<bigint | null>(null);

  const hasAccess =
    userProfile?.membershipTier === MembershipTier.Pro ||
    userProfile?.membershipTier === MembershipTier.Enterprise;

  if (!hasAccess) {
    return (
      <FeatureLock
        feature="Buyers List"
        requiredTier="Pro"
        description="Manage your cash buyer network and assign deals to qualified buyers"
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

  if (isError) {
    const isMembershipError = error?.message?.includes('permission') || error?.message?.includes('membership');
    
    return (
      <PageQueryErrorState
        message={error?.message || 'Failed to load your buyers list. Please try again.'}
        onRetry={refetch}
        secondaryAction={isMembershipError ? {
          label: 'View Membership Plans',
          onClick: () => window.dispatchEvent(new CustomEvent('navigate-to-membership'))
        } : undefined}
      />
    );
  }

  const handleCreateBuyer = () => {
    setEditingBuyerId(null);
    setEditorOpen(true);
  };

  const handleEditBuyer = (buyerId: bigint) => {
    setEditingBuyerId(buyerId);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buyers List</h1>
          <p className="text-muted-foreground">Manage your cash buyer network</p>
        </div>
        <Button onClick={handleCreateBuyer} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Buyer
        </Button>
      </div>

      {buyers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">{COPY.empty.buyers}</p>
          <Button onClick={handleCreateBuyer}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Buyer
          </Button>
        </div>
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
