import { useState } from 'react';
import { Home, Sparkles, Layers, Users, FileText, BarChart3, CreditCard, Menu, X, LogOut } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import DashboardPage from '../pages/DashboardPage';
import DealAnalyzerPage from '../pages/DealAnalyzerPage';
import DealsPipelinePage from '../pages/DealsPipelinePage';
import BuyersListPage from '../pages/BuyersListPage';
import ContractsPage from '../pages/ContractsPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import MembershipPage from '../pages/MembershipPage';

type Page = 'dashboard' | 'analyzer' | 'pipeline' | 'buyers' | 'contracts' | 'analytics' | 'membership';

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: Home },
  { id: 'analyzer' as Page, label: 'Deal Analyzer', icon: Sparkles },
  { id: 'pipeline' as Page, label: 'Deals Pipeline', icon: Layers },
  { id: 'buyers' as Page, label: 'Buyers List', icon: Users },
  { id: 'contracts' as Page, label: 'Contracts', icon: FileText },
  { id: 'analytics' as Page, label: 'Analytics', icon: BarChart3 },
  { id: 'membership' as Page, label: 'Membership', icon: CreditCard },
];

export default function AppShell() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'analyzer':
        return <DealAnalyzerPage />;
      case 'pipeline':
        return <DealsPipelinePage />;
      case 'buyers':
        return <BuyersListPage />;
      case 'contracts':
        return <ContractsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'membership':
        return <MembershipPage />;
      default:
        return <DashboardPage />;
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
              src="/assets/generated/wholesaleai-mark.dim_512x512.png"
              alt="WholesaleAI"
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
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-4">
            <img
              src="/assets/generated/wholesaleai-wordmark.dim_1200x300.png"
              alt="WholesaleAI"
              className="h-6 w-auto hidden lg:block"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {userProfile && <span>{userProfile.name}</span>}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{renderPage()}</main>

        {/* Footer */}
        <footer className="border-t border-border bg-card px-6 py-4">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <span>Built with ❤️ using </span>
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                window.location.hostname || 'wholesaleai'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-primary hover:underline"
            >
              caffeine.ai
            </a>
            <span className="ml-4">© {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

