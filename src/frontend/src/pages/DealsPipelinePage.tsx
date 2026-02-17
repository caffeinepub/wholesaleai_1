import { useState } from 'react';
import { useGetDeals, useGetCallerUserProfile } from '../hooks/useQueries';
import { DealStage, MembershipTier } from '../backend';
import { OpaqueCard, CardContent, CardHeader, CardTitle } from '../components/OpaqueCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import DealCard from '../components/DealCard';
import DealEditorDialog from '../components/DealEditorDialog';
import PageQueryErrorState from '../components/PageQueryErrorState';
import { toast } from 'sonner';

const stages = [
  { id: DealStage.NewLead, label: 'New Lead', color: 'bg-chart-1' },
  { id: DealStage.ContactedSeller, label: 'Contacted Seller', color: 'bg-chart-2' },
  { id: DealStage.Negotiating, label: 'Negotiating', color: 'bg-chart-3' },
  { id: DealStage.UnderContract, label: 'Under Contract', color: 'bg-chart-4' },
  { id: DealStage.Assigned, label: 'Assigned', color: 'bg-primary' },
  { id: DealStage.Closed, label: 'Closed', color: 'bg-chart-5' },
];

export default function DealsPipelinePage() {
  const { data: deals = [], isLoading, isError, error, refetch } = useGetDeals();
  const { data: userProfile } = useGetCallerUserProfile();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingDealId, setEditingDealId] = useState<bigint | null>(null);

  const activeDealsCount = deals.filter((d) => d.stage !== DealStage.Closed).length;
  const isBasic = userProfile?.membershipTier === MembershipTier.Basic;
  const canAddDeal = !isBasic || activeDealsCount < 15;

  const handleCreateDeal = () => {
    if (!canAddDeal) {
      toast.error('Basic plan limited to 15 active deals. Upgrade to Pro or Enterprise.');
      window.dispatchEvent(new CustomEvent('navigate-to-membership'));
      return;
    }
    setEditingDealId(null);
    setEditorOpen(true);
  };

  const handleEditDeal = (dealId: bigint) => {
    setEditingDealId(dealId);
    setEditorOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    const isMembershipError = error?.message?.includes('permission') || error?.message?.includes('membership');
    
    return (
      <PageQueryErrorState
        message={error?.message || 'Failed to load your deals pipeline. Please try again.'}
        onRetry={refetch}
        secondaryAction={isMembershipError ? {
          label: 'View Membership Plans',
          onClick: () => window.dispatchEvent(new CustomEvent('navigate-to-membership'))
        } : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals Pipeline</h1>
          <p className="text-muted-foreground">
            Manage your deals through every stage
            {isBasic && ` (${activeDealsCount}/15 active deals)`}
          </p>
        </div>
        <Button onClick={handleCreateDeal} disabled={!canAddDeal} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          return (
            <OpaqueCard key={stage.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                  <CardTitle className="text-base">{stage.label}</CardTitle>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {stageDeals.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {stageDeals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No deals</p>
                ) : (
                  stageDeals.map((deal) => (
                    <DealCard
                      key={deal.id.toString()}
                      deal={deal}
                      onEdit={() => handleEditDeal(deal.id)}
                    />
                  ))
                )}
              </CardContent>
            </OpaqueCard>
          );
        })}
      </div>

      {editorOpen && (
        <DealEditorDialog
          dealId={editingDealId}
          open={editorOpen}
          onOpenChange={setEditorOpen}
        />
      )}
    </div>
  );
}
