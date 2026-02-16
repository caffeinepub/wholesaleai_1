import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useInitializeProfile } from './hooks/useQueries';
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
  
  const initializeProfile = useInitializeProfile();

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

  // Track startup stages
  useEffect(() => {
    if (identityInitializing) {
      setCurrentStage('identity-init');
    } else if (!identity) {
      setCurrentStage('identity-init');
    } else if (actorLoading) {
      setCurrentStage('actor-init');
    } else if (actorReady) {
      // Check if we're on a payment route
      if (currentPath === '/payment-success' || currentPath === '/payment-failure') {
        setCurrentStage('ready');
      } else if (profileLoading) {
        setCurrentStage('profile-fetch');
      } else if (profileFetched || profileError) {
        setCurrentStage('ready');
      } else {
        setCurrentStage('route-check');
      }
    }
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

  // Handle profile fetch errors (but not missing profile)
  useEffect(() => {
    if (profileError && profileErrorObj) {
      const errorMsg = profileErrorObj.message || '';
      // Don't treat "needs setup" as an error
      if (!errorMsg.includes('profile') && !errorMsg.includes('setup')) {
        setStartupError({
          stage: 'profile-fetch',
          message: 'Failed to load your profile. This may be a temporary issue.',
          technicalDetail: errorMsg,
        });
      }
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
  if (actorLoading) {
    return <StartupLoadingScreen message="Connecting..." />;
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

  // Show profile setup dialog if user doesn't have a profile yet (null or empty name)
  const showProfileSetup = isAuthenticated && actorReady && profileFetched && userProfile === null;

  return (
    <>
      <AppShell userProfile={userProfile ?? null} />
      {showProfileSetup && <ProfileSetupDialog />}
    </>
  );
}
