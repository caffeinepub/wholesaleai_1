import { useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import SignInScreen from './components/SignInScreen';
import ProfileSetupDialog from './components/ProfileSetupDialog';
import AppShell from './components/AppShell';
import StartupLoadingScreen from './components/StartupLoadingScreen';
import { ThemeProvider } from 'next-themes';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <StartupLoadingScreen message="Initializing..." />
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <SignInScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthenticatedApp />
    </ThemeProvider>
  );
}

function AuthenticatedApp() {
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const showProfileSetup = !profileLoading && isFetched && userProfile === null;

  if (profileLoading || !isFetched) {
    return <StartupLoadingScreen message="Loading your profile..." />;
  }

  return (
    <>
      <AppShell />
      {showProfileSetup && <ProfileSetupDialog />}
    </>
  );
}
