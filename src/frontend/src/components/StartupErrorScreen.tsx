import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { openSupportEmail } from '../lib/support';

interface StartupErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export default function StartupErrorScreen({ message, onRetry }: StartupErrorScreenProps) {
  const handleContactSupport = () => {
    openSupportEmail('Wholesale Lens - Startup Error', `Error message: ${message}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full border-destructive">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Unable to Start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            {message}
          </p>

          <div className="space-y-3">
            <Button onClick={onRetry} className="w-full" size="lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button 
              onClick={handleContactSupport} 
              variant="outline" 
              className="w-full"
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
