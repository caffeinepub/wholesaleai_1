import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MembershipTier } from '../backend';
import { User, Phone, Mail, AlertCircle } from 'lucide-react';

export default function ProfileSetupDialog() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      saveProfile.mutate({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        membershipTier: MembershipTier.Basic,
      });
    }
  };

  const isNameValid = name.trim().length > 0;
  const isSubmitting = saveProfile.isPending;

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <User className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-2xl text-center">Welcome to Wholesale Lens!</DialogTitle>
          <DialogDescription className="text-center text-base">
            Let's get you set up in just a moment. We need a few details to personalize your experience and help you start tracking deals right away.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="h-11"
              autoFocus
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              This is how you'll be identified in the system
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone Number <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="h-11"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email Address <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11"
              disabled={isSubmitting}
            />
          </div>

          {saveProfile.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to save your profile. Please check your connection and try again.
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-2 space-y-3">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 text-base"
              disabled={!isNameValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Creating Your Account...
                </>
              ) : (
                'Get Started'
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You'll start with a <span className="font-semibold text-foreground">Basic</span> membership. Upgrade anytime to unlock more features.
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
