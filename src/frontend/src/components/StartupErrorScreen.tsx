import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { openSupportEmail } from '../lib/support';
import { useState } from 'react';

interface StartupErrorScreenProps {
  message: string;
  stage?: string;
  technicalDetail?: string;
  errorType?: 'timeout' | 'network' | 'auth' | 'unexpected';
  isAuthError?: boolean;
  onRetry: () => void;
  onSignOut: () => void;
}

export default function StartupErrorScreen({ 
  message, 
  stage, 
  technicalDetail,
  errorType,
  isAuthError = false,
  onRetry,
  onSignOut,
}: StartupErrorScreenProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const handleContactSupport = () => {
    const body = [
      `Error message: ${message}`,
      stage ? `Stage: ${stage}` : '',
      errorType ? `Error type: ${errorType}` : '',
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
    if (errorType === 'timeout') {
      return 'The request took too long to complete. This may indicate a slow connection or backend issue.';
    }
    
    if (errorType === 'auth') {
      return 'There was an authentication problem. Try signing out and signing in again.';
    }
    
    if (errorType === 'network') {
      return 'Unable to reach the backend. Check your internet connection.';
    }
    
    if (errorType === 'unexpected') {
      return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
    }
    
    return null;
  };

  const stageLabel = getStageLabel(stage);
  const diagnosticHint = getDiagnosticHint();

  // Sanitize technical detail (remove any potential sensitive info)
  const sanitizedTechnicalDetail = technicalDetail
    ? technicalDetail.replace(/[a-zA-Z0-9]{20,}/g, '[REDACTED]') // Remove long tokens/keys
    : null;

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

          {sanitizedTechnicalDetail && (
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium"
              >
                <span>Technical Details</span>
                {showTechnicalDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showTechnicalDetails && (
                <div className="p-3 bg-muted/10">
                  <p className="text-xs font-mono text-muted-foreground break-words">
                    {sanitizedTechnicalDetail}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={onRetry} className="w-full" size="lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            
            {isAuthError && (
              <Button 
                onClick={onSignOut} 
                variant="secondary" 
                className="w-full"
                size="lg"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
            
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
