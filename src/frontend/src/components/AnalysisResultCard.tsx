import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DealAnalysis } from '../backend';
import { Variant_A_B_C_Risky } from '../backend';

interface AnalysisResultCardProps {
  analysis: DealAnalysis;
}

export default function AnalysisResultCard({ analysis }: AnalysisResultCardProps) {
  const mao = Math.round(Number(analysis.estimatedARV) * 0.7 - Number(analysis.estimatedRehabCost));

  const getRatingColor = (rating: Variant_A_B_C_Risky) => {
    switch (rating) {
      case Variant_A_B_C_Risky.A:
        return 'bg-chart-1 text-primary-foreground';
      case Variant_A_B_C_Risky.B:
        return 'bg-chart-2 text-primary-foreground';
      case Variant_A_B_C_Risky.C:
        return 'bg-chart-3 text-primary-foreground';
      case Variant_A_B_C_Risky.Risky:
        return 'bg-destructive text-destructive-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Analysis Results</CardTitle>
          <Badge className={getRatingColor(analysis.dealRating)}>
            {analysis.dealRating} Deal
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-medium">{analysis.address}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estimated ARV</p>
            <p className="font-medium text-lg">${Number(analysis.estimatedARV).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Sold Price</p>
            <p className="font-medium">
              {analysis.lastSoldPrice
                ? `$${Number(analysis.lastSoldPrice).toLocaleString()}`
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estimated Rehab Cost</p>
            <p className="font-medium">${Number(analysis.estimatedRehabCost).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Maximum Allowable Offer (MAO)</p>
            <p className="font-medium text-lg text-primary">${mao.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Est. Assignment Fee</p>
            <p className="font-medium text-primary">
              ${Number(analysis.estimatedAssignmentFee).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Suggested Offer Price</p>
            <p className="font-medium text-lg">${Number(analysis.suggestedOfferPrice).toLocaleString()}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Comparable Sales</p>
          <div className="space-y-2">
            {analysis.comparableSales.map((comp, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium text-sm">{comp.address}</p>
                  <p className="text-xs text-muted-foreground">
                    {comp.distance.toFixed(1)} miles away
                  </p>
                </div>
                <p className="font-medium">${Number(comp.soldPrice).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

