import { useState } from 'react';
import { useInitializeProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { OpaqueDialogContent } from './OpaqueOverlays';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { MembershipTier } from '../backend';

export default function ProfileSetupDialog() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const initializeProfile = useInitializeProfile();
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    try {
      // CRITICAL FIX: Bootstrap first-time users before saving
      // This ensures new users obtain required #user permissions before the app proceeds
      await initializeProfile.mutateAsync();
      
      // Now save the actual profile with user-provided data
      await saveProfile.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        membershipTier: MembershipTier.Basic,
      });
      // Profile saved successfully - query invalidation will trigger re-render
      // App.tsx will detect the profile is no longer null and render AppShell
    } catch (error: any) {
      // Error is handled by mutation state
      console.error('Profile setup error:', error);
    }
  };

  const isSubmitting = initializeProfile.isPending || saveProfile.isPending;
  const error = initializeProfile.error || saveProfile.error;

  return (
    <Dialog open={true}>
      <OpaqueDialogContent 
        className="sm:max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Welcome to Wholesale Lens</DialogTitle>
          <DialogDescription>
            Let's set up your profile to get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error?.message || 'Failed to set up profile. Please try again or contact support.'}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </OpaqueDialogContent>
    </Dialog>
  );
}
