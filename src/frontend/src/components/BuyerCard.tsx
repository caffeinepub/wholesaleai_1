import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Mail, Phone } from 'lucide-react';
import type { Buyer } from '../backend';

interface BuyerCardProps {
  buyer: Buyer;
  onEdit: () => void;
}

export default function BuyerCard({ buyer, onEdit }: BuyerCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{buyer.name}</p>
            <p className="text-xs text-muted-foreground">{buyer.propertyTypePreference}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
            <Edit className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-1 text-xs">
          {buyer.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{buyer.phone}</span>
            </div>
          )}
          {buyer.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{buyer.email}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">Budget Range</p>
          <p className="text-sm font-medium">
            ${Number(buyer.budgetMin).toLocaleString()} - $
            {Number(buyer.budgetMax).toLocaleString()}
          </p>
        </div>

        {buyer.preferredAreas.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Preferred Areas</p>
            <div className="flex flex-wrap gap-1">
              {buyer.preferredAreas.slice(0, 3).map((area, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-muted px-2 py-0.5 rounded"
                >
                  {area}
                </span>
              ))}
              {buyer.preferredAreas.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{buyer.preferredAreas.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

