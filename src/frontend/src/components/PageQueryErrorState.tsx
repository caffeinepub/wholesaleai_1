import { Button } from '@/components/ui/button';
import { AlertCircle, Mail } from 'lucide-react';
import { openSupportEmail } from '../lib/support';
import { COPY } from '../lib/copy';

interface PageQueryErrorStateProps {
  message: string;
  onRetry?: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  showContactSupport?: boolean;
}

export default function PageQueryErrorState({ 
  message, 
  onRetry,
  secondaryAction,
  showContactSupport = false,
}: PageQueryErrorStateProps) {
  const handleContactSupport = () => {
    openSupportEmail('Wholesale Lens - Data Loading Issue', `I'm experiencing an issue loading data:\n\n${message}\n\nPlease help.`);
  };

  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="max-w-md w-full text-center space-y-6 p-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Unable to Load Data
          </h2>
          <p className="text-muted-foreground">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="w-full"
            >
              Try Again
            </Button>
          )}
          {secondaryAction && (
            <Button 
              onClick={secondaryAction.onClick}
              variant="outline"
              className="w-full"
            >
              {secondaryAction.label}
            </Button>
          )}
          {showContactSupport && (
            <Button 
              onClick={handleContactSupport}
              variant="outline"
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              {COPY.support.contactUs}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
