import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { COPY } from '../lib/copy';

interface AccessDeniedScreenProps {
  onBack?: () => void;
}

export default function AccessDeniedScreen({ onBack }: AccessDeniedScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle>{COPY.admin.accessDenied}</CardTitle>
          <CardDescription>{COPY.admin.accessDeniedMessage}</CardDescription>
        </CardHeader>
        {onBack && (
          <CardContent>
            <Button onClick={onBack} variant="outline" className="w-full">
              Go Back
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
