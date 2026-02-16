import { Button } from '@/components/ui/button';
import { AlertCircle, Mail } from 'lucide-react';
import { openSupportEmail } from '../lib/support';
import { COPY } from '../lib/copy';

interface StartupErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export default function StartupErrorScreen({ message, onRetry }: StartupErrorScreenProps) {
  const handleContactSupport = () => {
    openSupportEmail('Wholesale Lens - Startup Issue', `I'm experiencing a startup issue:\n\n${message}\n\nPlease help.`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Unable to Start
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button 
            onClick={onRetry}
            className="w-full h-11 text-base font-medium"
            size="lg"
          >
            Try Again
          </Button>
          
          <Button 
            onClick={handleContactSupport}
            variant="outline"
            className="w-full h-11 text-base"
            size="lg"
          >
            <Mail className="mr-2 h-4 w-4" />
            {COPY.support.contactUs}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground pt-4">
          {COPY.support.needHelp}
        </p>
      </div>
    </div>
  );
}
