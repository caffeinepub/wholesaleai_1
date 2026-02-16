import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { isAuthError } from './lib/authErrors';

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
  isAuthError?: boolean;
};

export default function App() {
  const queryClient = useQueryClient();
  const { identity, isInitializing: identityInitializing, clear } = useInternetIdentity();
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

  // Set document title at runtime (single source of truth)
  useEffect(() => {
    document.title = 'Wholesale Lens';
  }, []);

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

  // Check if user is authenticated (not anonymous)
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  // Startup watchdog to prevent infinite loading (only for genuine hangs)
  useEffect(() => {
    if (!isAuthenticated) {
      setStartupError(null);
      setCurrentStage('identity-init');
      return;
    }

    const timer = setTimeout(() => {
      // Only trigger timeout if we're still in a loading state AND not progressing
      // Don't timeout during profile setup (that's a valid state)
      if (currentStage !== 'ready' && currentStage !== 'profile-fetch') {
        setStartupError({
          stage: currentStage,
          message: 'The application is taking longer than expected to load. Please check your connection and try again.',
          technicalDetail: `Timeout at stage: ${currentStage}`,
        });
      }
    }, STARTUP_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [isAuthenticated, currentStage]);

  // Track startup stages with improved logic
  useEffect(() => {
    if (identityInitializing) {
      setCurrentStage('identity-init');
      return;
    }
    
    if (!isAuthenticated) {
      setCurrentStage('identity-init');
      return;
    }
    
    // Identity is ready and authenticated, check actor
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
  }, [identityInitializing, isAuthenticated, actorLoading, actorReady, profileLoading, profileFetched, profileError, currentPath]);

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

  // Handle profile fetch errors with refined classification
  useEffect(() => {
    if (profileError && profileErrorObj) {
      const errorMsg = profileErrorObj.message || '';
      
      // CRITICAL FIX: Don't classify expected first-time onboarding states as hard failures
      // The query now returns null for first-time users, so this should rarely trigger
      // But if it does, handle it gracefully
      const isAuth = isAuthError(profileErrorObj);
      let message = 'Failed to load your profile. Please try again.';
      let technicalDetail = errorMsg;
      
      if (errorMsg.includes('timed out') || errorMsg.includes('timeout')) {
        message = 'Profile loading timed out. Please check your connection and try again.';
      } else if (isAuth) {
        message = 'Authentication error. Please sign out and sign in again.';
        
        // Automatically trigger sign-out recovery for auth errors
        handleSignOutRecovery();
        return; // Don't set error state, just recover
      } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
        message = 'Network error. Please check your connection and try again.';
      }
      
      setStartupError({
        stage: 'profile-fetch',
        message,
        technicalDetail,
        isAuthError: isAuth,
      });
    }
  }, [profileError, profileErrorObj]);

  // Automatic sign-out recovery for auth errors
  const handleSignOutRecovery = async () => {
    try {
      // Clear Internet Identity session
      await clear();
      // Clear all React Query cache
      queryClient.clear();
      // Clear error state
      setStartupError(null);
      // Reset to identity-init stage
      setCurrentStage('identity-init');
    } catch (error) {
      console.error('Error during automatic sign-out recovery:', error);
      // Even if sign out fails, clear local state
      queryClient.clear();
      setStartupError(null);
      setCurrentStage('identity-init');
    }
  };

  // Handle retry based on error stage
  const handleRetry = async () => {
    if (!startupError) {
      // Generic retry - try actor first
      retryActor();
      return;
    }

    // For auth errors, trigger sign-out recovery instead of retry
    if (startupError.isAuthError) {
      await handleSignOutRecovery();
      return;
    }

    // Clear the error state before retrying
    setStartupError(null);

    switch (startupError.stage) {
      case 'actor-init':
        retryActor();
        break;
      case 'profile-fetch':
        // Clear the stale profile query before retrying
        queryClient.removeQueries({ queryKey: ['currentUserProfile'] });
        // Small delay to ensure query is cleared
        setTimeout(() => {
          retryProfile();
        }, 100);
        break;
      default:
        // For other stages, try actor refetch
        retryActor();
    }
  };

  // Handle sign out from error screen
  const handleSignOut = async () => {
    await handleSignOutRecovery();
  };

  // Show error screen if we have a startup error
  if (startupError) {
    return (
      <StartupErrorScreen
        message={startupError.message}
        stage={startupError.stage}
        technicalDetail={startupError.technicalDetail}
        isAuthError={startupError.isAuthError}
        onRetry={handleRetry}
        onSignOut={handleSignOut}
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
  if (currentPath === '/payment-success' || currentPath === '/payment-failure') {
    if (currentPath === '/payment-success') {
      return <PaymentSuccessPage />;
    }
    
    if (currentPath === '/payment-failure') {
      return <PaymentFailurePage />;
    }
  }

  // Show loading while fetching profile
  if (profileLoading) {
    return <StartupLoadingScreen message="Loading your profile..." />;
  }

  // CRITICAL FIX: First-time profile absence routes deterministically to ProfileSetupDialog
  // (without classifying it as an auth/startup failure)
  // Use authorization component best practices for authenticated gating
  const showProfileSetup = isAuthenticated && !profileLoading && profileFetched && userProfile === null;

  if (showProfileSetup) {
    // Render ONLY the profile setup dialog, blocking all other UI
    return <ProfileSetupDialog />;
  }

  // Profile is ready (not null), render the full app
  return <AppShell userProfile={userProfile ?? null} />;
}
