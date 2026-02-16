import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface StartupErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export default function StartupErrorScreen({ message, onRetry }: StartupErrorScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Unable to Load Application
          </h1>
          <p className="text-muted-foreground">
            {message}
          </p>
        </div>

        <Button 
          onClick={onRetry}
          className="w-full max-w-xs mx-auto"
          size="lg"
        >
          Retry
        </Button>
      </div>
    </div>
  );
}
