import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface FeatureLockProps {
  feature: string;
  requiredTier: 'Pro' | 'Enterprise';
  description: string;
}

export default function FeatureLock({ feature, requiredTier, description }: FeatureLockProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">{feature}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <div className="pt-4">
            <p className="text-sm font-medium mb-3">
              Requires {requiredTier} or higher membership
            </p>
            <Button
              onClick={() => {
                const event = new CustomEvent('navigate-to-membership');
                window.dispatchEvent(event);
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Upgrade to {requiredTier}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
