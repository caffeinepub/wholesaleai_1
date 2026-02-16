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
import { getCurrentRoutePath } from './utils/urlParams';

const STARTUP_TIMEOUT_MS = 30000; // 30 seconds

type StartupStage = 
  | 'identity-init'
  | 'actor-init'
  | 'route-check'
  | 'profile-fetch'
  | 'ready';

type StartupError = {
  stage: StartupStage;
  message: string;
  technicalDetail?: string;
};

export default function App() {
  const { identity, isInitializing: identityInitializing } = useInternetIdentity();
  const { actorReady, isLoading: actorLoading, isError: actorError, error: actorErrorObj, refetch: retryActor } = useBackendActor();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
    isError: profileError,
    error: profileErrorObj,
    refetch: retryProfile,
  } = useGetCallerUserProfile();

  const [currentPath, setCurrentPath] = useState(getCurrentRoutePath());
  const [startupError, setStartupError] = useState<StartupError | null>(null);
  const [currentStage, setCurrentStage] = useState<StartupStage>('identity-init');

  // Update route on navigation changes (both popstate and hashchange)
  useEffect(() => {
    const updatePath = () => {
      setCurrentPath(getCurrentRoutePath());
    };
    
    window.addEventListener('popstate', updatePath);
    window.addEventListener('hashchange', updatePath);
    
    return () => {
      window.removeEventListener('popstate', updatePath);
      window.removeEventListener('hashchange', updatePath);
    };
  }, []);

  // Startup watchdog to prevent infinite loading
  useEffect(() => {
    if (!identity) {
      setStartupError(null);
      setCurrentStage('identity-init');
      return;
    }

    const timer = setTimeout(() => {
      // Only trigger timeout if we're still in a loading state
      if (currentStage !== 'ready') {
        setStartupError({
          stage: currentStage,
          message: 'The application is taking longer than expected to load. Please check your connection and try again.',
          technicalDetail: `Timeout at stage: ${currentStage}`,
        });
      }
    }, STARTUP_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [identity, currentStage]);

  // Track startup stages with improved logic
  useEffect(() => {
    if (identityInitializing) {
      setCurrentStage('identity-init');
      return;
    }
    
    if (!identity) {
      setCurrentStage('identity-init');
      return;
    }
    
    // Identity is ready, check actor
    if (actorLoading || !actorReady) {
      setCurrentStage('actor-init');
      return;
    }
    
    // Actor is ready, check if we're on a payment route
    if (currentPath === '/payment-success' || currentPath === '/payment-failure') {
      setCurrentStage('ready');
      return;
    }
    
    // Not on payment route, need to check profile
    if (profileLoading) {
      setCurrentStage('profile-fetch');
      return;
    }
    
    // Profile query has completed (either success or error)
    if (profileFetched || profileError) {
      setCurrentStage('ready');
      return;
    }
    
    // Profile query hasn't started yet (shouldn't happen with actorReady, but handle it)
    setCurrentStage('route-check');
  }, [identityInitializing, identity, actorLoading, actorReady, profileLoading, profileFetched, profileError, currentPath]);

  // Handle actor initialization errors
  useEffect(() => {
    if (actorError && actorErrorObj) {
      setStartupError({
        stage: 'actor-init',
        message: 'Failed to connect to the backend. Please check your connection and try again.',
        technicalDetail: actorErrorObj.message,
      });
    }
  }, [actorError, actorErrorObj]);

  // Handle profile fetch errors
  useEffect(() => {
    if (profileError && profileErrorObj) {
      const errorMsg = profileErrorObj.message || '';
      
      // Classify the error type
      let message = 'Failed to load your profile. Please try again.';
      let technicalDetail = errorMsg;
      
      if (errorMsg.includes('timed out') || errorMsg.includes('timeout')) {
        message = 'Profile loading timed out. Please check your connection and try again.';
      } else if (errorMsg.includes('Unauthorized') || errorMsg.includes('Authentication')) {
        message = 'Authentication error. Please sign out and sign in again.';
      } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
        message = 'Network error. Please check your connection and try again.';
      }
      
      setStartupError({
        stage: 'profile-fetch',
        message,
        technicalDetail,
      });
    }
  }, [profileError, profileErrorObj]);

  const isAuthenticated = !!identity;

  // Check if we're on a payment result page
  const isPaymentSuccessPage = currentPath === '/payment-success';
  const isPaymentFailurePage = currentPath === '/payment-failure';

  // Handle retry based on error stage
  const handleRetry = () => {
    setStartupError(null);
    
    if (!startupError) {
      // Generic retry - try actor first
      retryActor();
      return;
    }

    switch (startupError.stage) {
      case 'actor-init':
        retryActor();
        break;
      case 'profile-fetch':
        retryProfile();
        break;
      default:
        // For other stages, try actor refetch
        retryActor();
    }
  };

  // Show error screen if we have a startup error
  if (startupError) {
    return (
      <StartupErrorScreen
        message={startupError.message}
        stage={startupError.stage}
        technicalDetail={startupError.technicalDetail}
        onRetry={handleRetry}
      />
    );
  }

  // Show loading screen during identity initialization
  if (identityInitializing) {
    return <StartupLoadingScreen message="Initializing..." />;
  }

  // Show sign-in screen if not authenticated
  if (!isAuthenticated) {
    return <SignInScreen />;
  }

  // Show loading while actor initializes
  if (actorLoading || !actorReady) {
    return <StartupLoadingScreen message="Connecting..." />;
  }

  // Handle payment result pages (must be authenticated and actor ready)
  if (isPaymentSuccessPage || isPaymentFailurePage) {
    if (isPaymentSuccessPage) {
      return <PaymentSuccessPage />;
    }
    
    if (isPaymentFailurePage) {
      return <PaymentFailurePage />;
    }
  }

  // Show loading while fetching profile
  if (profileLoading) {
    return <StartupLoadingScreen message="Loading your profile..." />;
  }

  // If profile fetch failed with error, we already showed error screen above
  // If we get here, profile fetch completed (either with data or null)
  
  // Show profile setup dialog if user doesn't have a profile yet (null or empty name)
  // Only show after profile fetch is complete to avoid flash
  const showProfileSetup = isAuthenticated && actorReady && profileFetched && userProfile === null;

  return (
    <>
      <AppShell userProfile={userProfile ?? null} />
      {showProfileSetup && <ProfileSetupDialog />}
    </>
  );
}
