import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import type { Deal } from '../backend';

interface DealCardProps {
  deal: Deal;
  onEdit: () => void;
}

export default function DealCard({ deal, onEdit }: DealCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{deal.address}</p>
            <p className="text-xs text-muted-foreground">{deal.sellerName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
            <Edit className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">ARV</span>
          <span className="font-medium">${Number(deal.arv).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Offer</span>
          <span className="font-medium">${Number(deal.yourOffer).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Est. Profit</span>
          <span className="font-medium text-primary">
            ${Number(deal.estimatedProfit).toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

