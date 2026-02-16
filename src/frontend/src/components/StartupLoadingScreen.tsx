import { Loader2 } from 'lucide-react';

interface StartupLoadingScreenProps {
  message?: string;
}

export default function StartupLoadingScreen({ message = 'Loading...' }: StartupLoadingScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <img
              src="/assets/generated/wholesale-lens-mark.dim_512x512.png"
              alt="Wholesale Lens"
              className="h-24 w-24 object-contain"
              width={96}
              height={96}
            />
          </div>
          
          <div className="space-y-3">
            <img
              src="/assets/generated/wholesale-lens-wordmark.dim_1200x300.png"
              alt="Wholesale Lens"
              className="h-10 w-auto mx-auto object-contain"
              width={200}
              height={50}
            />
            
            <div className="flex items-center justify-center gap-3 pt-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-base text-muted-foreground font-medium">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <div 
            className="h-32 w-full bg-contain bg-center bg-no-repeat opacity-20"
            style={{ backgroundImage: 'url(/assets/generated/wholesale-lens-opening-bg.dim_1920x1080.png)' }}
          />
        </div>
      </div>
    </div>
  );
}
