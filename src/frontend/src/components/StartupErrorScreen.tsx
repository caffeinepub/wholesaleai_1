import { AlertCircle, RefreshCw, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { Separator } from './ui/separator';

type StartupErrorScreenProps = {
  message: string;
  stage?: string;
  technicalDetail?: string;
  errorType?: 'timeout' | 'network' | 'auth' | 'unexpected';
  isAuthError?: boolean;
  onRetry: () => void;
  onSignOut?: () => void;
};

export default function StartupErrorScreen({
  message,
  stage,
  technicalDetail,
  errorType,
  isAuthError,
  onRetry,
  onSignOut,
}: StartupErrorScreenProps) {
  const [showTechnical, setShowTechnical] = useState(false);

  // Sanitize technical details to avoid exposing long tokens/secrets
  const sanitizedDetail = technicalDetail
    ? technicalDetail.length > 200
      ? technicalDetail.substring(0, 200) + '... (truncated)'
      : technicalDetail
    : 'No additional details available';

  // Generate diagnostic hint based on error type
  const diagnosticHint = errorType
    ? {
        timeout: 'The request took too long to complete. This usually indicates a slow network connection or server overload.',
        network: 'Unable to reach the server. Check your internet connection and firewall settings.',
        auth: 'Your authentication session may have expired or become invalid. Signing out and back in should resolve this.',
        unexpected: 'An unexpected error occurred. This may be temporary - try again in a moment.',
      }[errorType]
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img
            src="/assets/generated/wholesale-lens-mark.dim_512x512.png"
            alt="Wholesale Lens"
            className="h-16 w-16"
            width={64}
            height={64}
          />
        </div>

        {/* Error Card */}
        <div className="rounded-lg border border-destructive/20 bg-card p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Startup Error</h2>
              <p className="text-sm text-muted-foreground">{message}</p>
              {stage && (
                <p className="text-xs text-muted-foreground">
                  Failed at: <span className="font-mono">{stage}</span>
                </p>
              )}
            </div>
          </div>

          {/* Technical Details Accordion */}
          {(technicalDetail || diagnosticHint) && (
            <div className="mt-4">
              <Separator className="mb-3" />
              <button
                onClick={() => setShowTechnical(!showTechnical)}
                className="flex w-full items-center justify-between text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
              >
                <span>Technical Details</span>
                {showTechnical ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showTechnical && (
                <div className="mt-3 space-y-3 rounded-md bg-muted/50 p-3 text-xs">
                  {diagnosticHint && (
                    <div>
                      <p className="font-semibold text-foreground mb-1">
                        Classification: <span className="font-mono text-primary">{errorType}</span>
                      </p>
                      <p className="text-muted-foreground">{diagnosticHint}</p>
                    </div>
                  )}
                  {technicalDetail && (
                    <div>
                      <p className="font-semibold text-foreground mb-1">Error Message:</p>
                      <p className="font-mono text-muted-foreground break-words">{sanitizedDetail}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-2">
            {isAuthError && onSignOut ? (
              <>
                <Button onClick={onSignOut} variant="default" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Sign out and sign back in to refresh your session
                </p>
              </>
            ) : (
              <Button onClick={onRetry} variant="default" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-muted-foreground">
          If the issue persists, please contact support or try again later.
        </p>
      </div>
    </div>
  );
}
