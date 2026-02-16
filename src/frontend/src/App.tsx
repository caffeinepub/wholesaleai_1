import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useBackendActor } from './hooks/useBackendActor';
import SignInScreen from './components/SignInScreen';
import ProfileSetupDialog from './components/ProfileSetupDialog';
import AppShell from './components/AppShell';
import StartupLoadingScreen from './components/StartupLoadingScreen';
import StartupErrorScreen from './components/StartupErrorScreen';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';

const STARTUP_TIMEOUT_MS = 30000; // 30 seconds

export default function App() {
  const { identity, isInitializing: identityInitializing } = useInternetIdentity();
  const { actorReady, isLoading: actorLoading, isError: actorError, refetch: retryActor } = useBackendActor();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
    isError: profileError,
    error: profileErrorObj,
    refetch: retryProfile,
  } = useGetCallerUserProfile();

  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [startupTimeout, setStartupTimeout] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Startup watchdog to prevent infinite loading
  useEffect(() => {
    if (!identity) {
      setStartupTimeout(false);
      return;
    }

    const timer = setTimeout(() => {
      if (actorLoading || profileLoading) {
        setStartupTimeout(true);
      }
    }, STARTUP_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [identity, actorLoading, profileLoading]);

  const isAuthenticated = !!identity;

  // Check if we're on a payment result page
  const isPaymentSuccessPage = currentPath === '/payment-success';
  const isPaymentFailurePage = currentPath === '/payment-failure';

  // Show loading screen during identity initialization
  if (identityInitializing) {
    return <StartupLoadingScreen message="Initializing..." />;
  }

  // Show sign-in screen if not authenticated
  if (!isAuthenticated) {
    return <SignInScreen />;
  }

  // Handle startup timeout
  if (startupTimeout) {
    return (
      <StartupErrorScreen
        message="The application is taking longer than expected to load. Please check your connection and try again."
        onRetry={() => {
          setStartupTimeout(false);
          if (actorError) {
            retryActor();
          } else if (profileError) {
            retryProfile();
          }
        }}
      />
    );
  }

  // Show loading while actor initializes
  if (actorLoading) {
    return <StartupLoadingScreen message="Connecting..." />;
  }

  // Show error screen if actor initialization failed
  if (actorError) {
    return (
      <StartupErrorScreen
        message="Failed to connect to the backend. Please check your connection and try again."
        onRetry={retryActor}
      />
    );
  }

  // Handle payment result pages (must be authenticated and actor ready)
  if (isPaymentSuccessPage || isPaymentFailurePage) {
    // Wait for actor to be ready before showing payment pages
    if (!actorReady) {
      return <StartupLoadingScreen message="Loading payment status..." />;
    }
    
    if (isPaymentSuccessPage) {
      return <PaymentSuccessPage />;
    }
    
    if (isPaymentFailurePage) {
      return <PaymentFailurePage />;
    }
  }

  // Wait for actor to be ready before fetching profile
  if (!actorReady) {
    return <StartupLoadingScreen message="Connecting..." />;
  }

  // Show loading while fetching profile
  if (profileLoading) {
    return <StartupLoadingScreen message="Loading your profile..." />;
  }

  // Show error if profile fetch failed (genuine error, not missing profile)
  if (profileError) {
    const errorMessage = profileErrorObj?.message || 'Failed to load your profile. This may be a temporary issue.';
    return (
      <StartupErrorScreen
        message={errorMessage}
        onRetry={retryProfile}
      />
    );
  }

  // Show profile setup dialog if user doesn't have a profile yet (name is empty)
  const showProfileSetup = isAuthenticated && actorReady && profileFetched && userProfile === null;

  return (
    <>
      <AppShell userProfile={userProfile ?? null} />
      {showProfileSetup && <ProfileSetupDialog />}
    </>
  );
}
