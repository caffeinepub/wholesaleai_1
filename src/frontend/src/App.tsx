import { lazy, Suspense } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useBackendActor } from './hooks/useBackendActor';
import SignInScreen from './components/SignInScreen';
import ProfileSetupDialog from './components/ProfileSetupDialog';
import StartupLoadingScreen from './components/StartupLoadingScreen';
import StartupErrorScreen from './components/StartupErrorScreen';
import { ThemeProvider } from 'next-themes';

// Lazy load AppShell to reduce initial bundle size
const AppShell = lazy(() => import('./components/AppShell'));

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  // Single ThemeProvider wrapper to avoid remounts
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {isInitializing ? (
        <StartupLoadingScreen message="Initializing..." />
      ) : !isAuthenticated ? (
        <SignInScreen />
      ) : (
        <AuthenticatedApp />
      )}
    </ThemeProvider>
  );
}

function AuthenticatedApp() {
  const { actor, isFetching: actorFetching, isError: actorError, refetch: refetchActor } = useBackendActor();
  const { 
    data: userProfile, 
    isLoading: profileLoading, 
    isFetched: profileFetched,
    isError: profileError,
    refetch: refetchProfile 
  } = useGetCallerUserProfile();

  // Show error screen if actor initialization fails
  if (actorError) {
    return (
      <StartupErrorScreen 
        message="Failed to connect to the backend. Please check your connection and try again."
        onRetry={() => refetchActor()}
      />
    );
  }

  // Show error screen if profile fetch fails (but actor is ready)
  if (profileError && !actorFetching && actor) {
    return (
      <StartupErrorScreen 
        message="Failed to load your profile. Please try again."
        onRetry={() => refetchProfile()}
      />
    );
  }

  // Show loading while actor or profile are loading
  if (actorFetching || profileLoading || !profileFetched) {
    return <StartupLoadingScreen message="Loading your profile..." />;
  }

  // Show profile setup dialog if profile is null (first-time user)
  const showProfileSetup = profileFetched && userProfile === null;

  return (
    <Suspense fallback={<StartupLoadingScreen message="Loading application..." />}>
      <AppShell userProfile={userProfile ?? null} />
      {showProfileSetup && <ProfileSetupDialog />}
    </Suspense>
  );
}
