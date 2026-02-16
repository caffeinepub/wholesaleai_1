import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { openSupportEmail } from '../lib/support';

interface StartupErrorScreenProps {
  message: string;
  stage?: string;
  technicalDetail?: string;
  onRetry: () => void;
}

export default function StartupErrorScreen({ 
  message, 
  stage, 
  technicalDetail, 
  onRetry 
}: StartupErrorScreenProps) {
  const handleContactSupport = () => {
    const body = [
      `Error message: ${message}`,
      stage ? `Stage: ${stage}` : '',
      technicalDetail ? `Technical detail: ${technicalDetail}` : '',
    ].filter(Boolean).join('\n');
    
    openSupportEmail('Wholesale Lens - Startup Error', body);
  };

  // Create user-friendly stage label
  const getStageLabel = (stageValue?: string): string => {
    if (!stageValue) return '';
    
    switch (stageValue) {
      case 'identity-init':
        return 'Identity initialization';
      case 'actor-init':
        return 'Backend connection';
      case 'profile-fetch':
        return 'Profile loading';
      case 'route-check':
        return 'Route verification';
      default:
        return stageValue;
    }
  };

  // Create diagnostic hint based on error type
  const getDiagnosticHint = (): string | null => {
    if (!technicalDetail) return null;
    
    const detail = technicalDetail.toLowerCase();
    
    if (detail.includes('timeout') || detail.includes('timed out')) {
      return 'The request took too long to complete. This may indicate a slow connection or backend issue.';
    }
    
    if (detail.includes('unauthorized') || detail.includes('authentication')) {
      return 'There was an authentication problem. Try signing out and signing in again.';
    }
    
    if (detail.includes('network') || detail.includes('connection')) {
      return 'Unable to reach the backend. Check your internet connection.';
    }
    
    return null;
  };

  const stageLabel = getStageLabel(stage);
  const diagnosticHint = getDiagnosticHint();

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

          {stageLabel && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Failed at: <span className="text-foreground">{stageLabel}</span>
              </p>
              {diagnosticHint && (
                <p className="text-xs text-muted-foreground">
                  {diagnosticHint}
                </p>
              )}
            </div>
          )}

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
