import { useState, lazy, Suspense } from 'react';
import { Home, Sparkles, Layers, Users, FileText, BarChart3, CreditCard, Menu, X, LogOut, Settings } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useIsCallerAdmin } from '../hooks/useQueries';
import type { UserProfile } from '../backend';

// Lazy load pages to reduce initial bundle size
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const DealAnalyzerPage = lazy(() => import('../pages/DealAnalyzerPage'));
const DealsPipelinePage = lazy(() => import('../pages/DealsPipelinePage'));
const BuyersListPage = lazy(() => import('../pages/BuyersListPage'));
const ContractsPage = lazy(() => import('../pages/ContractsPage'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const MembershipPage = lazy(() => import('../pages/MembershipPage'));
const AdminPanelPage = lazy(() => import('../pages/AdminPanelPage'));

type Page = 'dashboard' | 'analyzer' | 'pipeline' | 'buyers' | 'contracts' | 'analytics' | 'membership' | 'admin';

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: Home },
  { id: 'analyzer' as Page, label: 'Deal Analyzer', icon: Sparkles },
  { id: 'pipeline' as Page, label: 'Deals Pipeline', icon: Layers },
  { id: 'buyers' as Page, label: 'Buyers List', icon: Users },
  { id: 'contracts' as Page, label: 'Contracts', icon: FileText },
  { id: 'analytics' as Page, label: 'Analytics', icon: BarChart3 },
  { id: 'membership' as Page, label: 'Membership', icon: CreditCard },
];

interface AppShellProps {
  userProfile: UserProfile | null;
}

export default function AppShell({ userProfile }: AppShellProps) {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: isAdmin } = useIsCallerAdmin();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const renderPage = () => {
    const PageLoadingFallback = (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );

    switch (currentPage) {
      case 'dashboard':
        return (
          <Suspense fallback={PageLoadingFallback}>
            <DashboardPage />
          </Suspense>
        );
      case 'analyzer':
        return (
          <Suspense fallback={PageLoadingFallback}>
            <DealAnalyzerPage />
          </Suspense>
        );
      case 'pipeline':
        return (
          <Suspense fallback={PageLoadingFallback}>
            <DealsPipelinePage />
          </Suspense>
        );
      case 'buyers':
        return (
          <Suspense fallback={PageLoadingFallback}>
            <BuyersListPage />
          </Suspense>
        );
      case 'contracts':
        return (
          <Suspense fallback={PageLoadingFallback}>
            <ContractsPage />
          </Suspense>
        );
      case 'analytics':
        return (
          <Suspense fallback={PageLoadingFallback}>
            <AnalyticsPage />
          </Suspense>
        );
      case 'membership':
        return (
          <Suspense fallback={PageLoadingFallback}>
            <MembershipPage />
          </Suspense>
        );
      case 'admin':
        return (
          <Suspense fallback={PageLoadingFallback}>
            <AdminPanelPage />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={PageLoadingFallback}>
            <DashboardPage />
          </Suspense>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <img
              src="/assets/generated/wholesale-lens-mark.dim_512x512.png"
              alt="Wholesale Lens"
              className="h-8 w-8"
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
            {isAdmin && (
              <button
                onClick={() => {
                  setCurrentPage('admin');
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  currentPage === 'admin'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Settings className="h-5 w-5" />
                Admin Panel
              </button>
            )}
          </nav>

          {/* User info & logout */}
          <div className="border-t border-border p-4 space-y-2">
            {userProfile && (
              <div className="text-sm text-muted-foreground px-3 py-2">
                <p className="font-medium text-foreground">{userProfile.name}</p>
                <p className="text-xs">{userProfile.membershipTier} Plan</p>
              </div>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/wholesale-lens-wordmark.dim_1200x300.png"
              alt="Wholesale Lens"
              className="h-6 hidden lg:block"
            />
          </div>
          <div className="flex items-center gap-2">
            {userProfile && (
              <div className="text-sm text-right hidden sm:block">
                <p className="font-medium">{userProfile.name}</p>
                <p className="text-xs text-muted-foreground">{userProfile.membershipTier}</p>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderPage()}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card px-4 py-3">
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Built with ❤️ using </span>
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'wholesale-lens'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </div>
        </footer>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
