import { useEffect, useState } from 'react';
import { useConfirmMembershipPurchased, useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PaymentSuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [confirmationAttempted, setConfirmationAttempted] = useState(false);
  const confirmMembership = useConfirmMembershipPurchased();
  const { data: userProfile, refetch: refetchProfile } = useGetCallerUserProfile();

  useEffect(() => {
    // Extract session_id from URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('session_id');
    
    if (id) {
      setSessionId(id);
    }
  }, []);

  useEffect(() => {
    // Confirm membership purchase once we have the session ID
    if (sessionId && !confirmationAttempted) {
      setConfirmationAttempted(true);
      confirmMembership.mutate(sessionId, {
        onSuccess: async () => {
          // Refetch profile to get updated membership tier
          await refetchProfile();
        },
      });
    }
  }, [sessionId, confirmationAttempted, confirmMembership, refetchProfile]);

  const handleReturnToDashboard = () => {
    window.location.href = '/';
  };

  const handleReturnToMembership = () => {
    window.location.href = '/';
    // Trigger navigation to membership page after redirect
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('navigate-to-membership'));
    }, 100);
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              Invalid Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              No payment session found. Please try again or contact support if you believe this is an error.
            </p>
            <Button onClick={handleReturnToMembership} className="w-full">
              Return to Membership Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmMembership.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 space-y-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Confirming Your Payment</h2>
              <p className="text-muted-foreground">
                Please wait while we activate your membership...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmMembership.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              Confirmation Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {confirmMembership.error?.message || 'Failed to confirm your membership. Please contact support.'}
              </AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setConfirmationAttempted(false);
                  confirmMembership.reset();
                }}
                variant="outline"
                className="flex-1"
              >
                Retry
              </Button>
              <Button onClick={handleReturnToDashboard} className="flex-1">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full border-primary shadow-xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Your payment has been processed successfully.
            </p>
            {userProfile && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Your membership tier:</p>
                <p className="text-xl font-bold text-primary mt-1">
                  {userProfile.membershipTier}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <Button onClick={handleReturnToDashboard} className="w-full" size="lg">
              Go to Dashboard
            </Button>
            <Button onClick={handleReturnToMembership} variant="outline" className="w-full">
              View Membership Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
