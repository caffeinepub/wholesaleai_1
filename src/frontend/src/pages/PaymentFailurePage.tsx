import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getUrlParameter } from '../utils/urlParams';

export default function PaymentFailurePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Extract session_id from URL (supports both query string and hash routing)
    const id = getUrlParameter('session_id');
    
    if (id) {
      setSessionId(id);
    }
  }, []);

  const handleReturnToMembership = () => {
    window.location.href = '/';
    // Trigger navigation to membership page after redirect
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('navigate-to-membership'));
    }, 100);
  };

  const handleReturnToDashboard = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full border-destructive">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Payment Canceled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your payment was not completed. No charges have been made to your account.
            </AlertDescription>
          </Alert>
          
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              You can try again anytime or contact support if you need assistance.
            </p>
            {sessionId && (
              <p className="text-xs text-muted-foreground mt-4">
                Session ID: {sessionId}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button onClick={handleReturnToMembership} className="w-full" size="lg">
              Try Again
            </Button>
            <Button onClick={handleReturnToDashboard} variant="outline" className="w-full">
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
