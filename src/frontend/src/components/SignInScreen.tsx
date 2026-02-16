import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, TrendingUp, Zap, Target } from 'lucide-react';

export default function SignInScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Branding */}
        <div className="text-center space-y-4">
          <img
            src="/assets/generated/wholesaleai-wordmark.dim_1200x300.png"
            alt="WholesaleAI"
            className="mx-auto h-14 w-auto mb-6"
          />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Deal Intelligence System
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            Close Smarter. Close Faster.
          </p>
        </div>

        {/* Sign-in Card */}
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center text-base">
              Sign in to access your wholesale real estate pipeline and AI-powered deal analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={login}
              disabled={isLoggingIn}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base h-12 shadow-lg"
            >
              {isLoggingIn ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Connecting...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In Securely
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Powered by Internet Identity for secure, passwordless authentication
            </p>
          </CardContent>
        </Card>

        {/* Value Props */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Track Deals</p>
            <p className="text-xs text-muted-foreground">Manage your pipeline</p>
          </div>
          <div className="text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">AI Analysis</p>
            <p className="text-xs text-muted-foreground">Instant valuations</p>
          </div>
          <div className="text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Close More</p>
            <p className="text-xs text-muted-foreground">Maximize profits</p>
          </div>
        </div>
      </div>
    </div>
  );
}
