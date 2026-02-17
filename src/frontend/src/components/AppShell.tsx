import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { OpaqueSheetContent } from './OpaqueOverlays';
import { 
  LayoutDashboard, 
  Search, 
  Briefcase, 
  Users, 
  FileText, 
  BarChart3, 
  CreditCard,
  Settings,
  LogOut,
  Mail,
  Menu,
} from 'lucide-react';
import { COPY } from '../lib/copy';
import { openSupportEmail } from '../lib/support';
import { useIsMobile } from '../hooks/useMediaQuery';
import { AppShellErrorBoundary } from './AppShellErrorBoundary';
import type { UserProfile } from '../backend';

// Lazy load pages
import { lazy, Suspense } from 'react';
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const DealAnalyzerPage = lazy(() => import('../pages/DealAnalyzerPage'));
const DealsPipelinePage = lazy(() => import('../pages/DealsPipelinePage'));
const BuyersListPage = lazy(() => import('../pages/BuyersListPage'));
const ContractsPage = lazy(() => import('../pages/ContractsPage'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const MembershipPage = lazy(() => import('../pages/MembershipPage'));
const AdminPanelPage = lazy(() => import('../pages/AdminPanelPage'));

interface AppShellProps {
  userProfile: UserProfile | null;
}

type PageKey = 'dashboard' | 'analyzer' | 'pipeline' | 'buyers' | 'contracts' | 'analytics' | 'membership' | 'admin';

export default function AppShell({ userProfile }: AppShellProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleNavigateToMembership = () => {
      setCurrentPage('membership');
      setMobileMenuOpen(false);
    };
    window.addEventListener('navigate-to-membership', handleNavigateToMembership);
    return () => window.removeEventListener('navigate-to-membership', handleNavigateToMembership);
  }, []);

  const handleLogout = async () => {
    await clear();
    // Clear all cached data including profile
    queryClient.clear();
  };

  const handleContactSupport = () => {
    openSupportEmail('Wholesale Lens - Support Request');
  };

  const handleNavClick = (key: PageKey) => {
    setCurrentPage(key);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const navItems = [
    { key: 'dashboard' as PageKey, label: COPY.nav.dashboard, icon: LayoutDashboard },
    { key: 'analyzer' as PageKey, label: COPY.nav.analyzer, icon: Search },
    { key: 'pipeline' as PageKey, label: COPY.nav.pipeline, icon: Briefcase },
    { key: 'buyers' as PageKey, label: COPY.nav.buyers, icon: Users },
    { key: 'contracts' as PageKey, label: COPY.nav.contracts, icon: FileText },
    { key: 'analytics' as PageKey, label: COPY.nav.analytics, icon: BarChart3 },
    { key: 'membership' as PageKey, label: COPY.nav.membership, icon: CreditCard },
  ];

  const renderPage = () => {
    const pageMap: Record<PageKey, React.ComponentType> = {
      dashboard: DashboardPage,
      analyzer: DealAnalyzerPage,
      pipeline: DealsPipelinePage,
      buyers: BuyersListPage,
      contracts: ContractsPage,
      analytics: AnalyticsPage,
      membership: MembershipPage,
      admin: AdminPanelPage,
    };

    const PageComponent = pageMap[currentPage];
    
    if (!PageComponent) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Page not found</p>
            <Button onClick={() => setCurrentPage('dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }>
        <PageComponent />
      </Suspense>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/wholesale-lens-mark.dim_512x512.png"
            alt="Wholesale Lens"
            className="h-10 w-10 object-contain"
            width={40}
            height={40}
          />
          <img
            src="/assets/generated/wholesale-lens-wordmark.dim_1200x300.png"
            alt="Wholesale Lens"
            className="h-6 w-auto object-contain"
            width={120}
            height={24}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key)}
              data-active={isActive}
              aria-current={isActive ? 'page' : undefined}
              className={`
                sidebar-nav-button
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                text-sm font-medium transition-all duration-200
                border
                ${
                  isActive
                    ? 'bg-[oklch(var(--sidebar-accent))] text-[oklch(var(--sidebar-accent-foreground))] border-[oklch(var(--sidebar-accent))] shadow-lg'
                    : 'bg-[oklch(var(--sidebar-nav))] text-[oklch(var(--sidebar-foreground))] border-[oklch(var(--sidebar-border))] hover:bg-[oklch(var(--sidebar-nav-hover))] hover:text-[oklch(var(--sidebar-foreground))] hover:border-[oklch(var(--sidebar-nav-hover))] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar'
                }
              `}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User section */}
      <div className="p-4 space-y-2">
        {userProfile && (
          <div className="px-4 py-2 text-sm">
            <p className="font-medium text-sidebar-foreground truncate">{userProfile.name}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {userProfile.membershipTier.toLowerCase()} Member
            </p>
          </div>
        )}

        <button
          onClick={() => handleNavClick('admin')}
          data-active={currentPage === 'admin'}
          aria-current={currentPage === 'admin' ? 'page' : undefined}
          className={`
            sidebar-nav-button
            w-full flex items-center gap-3 px-4 py-3 rounded-lg
            text-sm font-medium transition-all duration-200
            border
            ${
              currentPage === 'admin'
                ? 'bg-[oklch(var(--sidebar-accent))] text-[oklch(var(--sidebar-accent-foreground))] border-[oklch(var(--sidebar-accent))] shadow-lg'
                : 'bg-[oklch(var(--sidebar-nav))] text-[oklch(var(--sidebar-foreground))] border-[oklch(var(--sidebar-border))] hover:bg-[oklch(var(--sidebar-nav-hover))] hover:text-[oklch(var(--sidebar-foreground))] hover:border-[oklch(var(--sidebar-nav-hover))] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar'
            }
          `}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1 text-left">Admin Panel</span>
        </button>

        <button
          onClick={handleContactSupport}
          className="sidebar-nav-button w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-[oklch(var(--sidebar-nav))] text-[oklch(var(--sidebar-foreground))] border border-[oklch(var(--sidebar-border))] hover:bg-[oklch(var(--sidebar-nav-hover))] hover:text-[oklch(var(--sidebar-foreground))] hover:border-[oklch(var(--sidebar-nav-hover))] hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          <Mail className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1 text-left">Contact Support</span>
        </button>

        <button
          onClick={handleLogout}
          className="sidebar-nav-button w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-[oklch(var(--sidebar-nav))] text-[oklch(var(--sidebar-foreground))] border border-[oklch(var(--sidebar-border))] hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1 text-left">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border shadow-sidebar flex flex-col">
          <SidebarContent />
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <img
                src="/assets/generated/wholesale-lens-mark.dim_512x512.png"
                alt="Wholesale Lens"
                className="h-8 w-8 object-contain"
                width={32}
                height={32}
              />
              <img
                src="/assets/generated/wholesale-lens-wordmark.dim_1200x300.png"
                alt="Wholesale Lens"
                className="h-5 w-auto object-contain"
                width={100}
                height={20}
              />
            </div>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <OpaqueSheetContent side="left" className="w-64 p-0 bg-sidebar">
                <div className="flex flex-col h-full">
                  <SidebarContent />
                </div>
              </OpaqueSheetContent>
            </Sheet>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <AppShellErrorBoundary>
            {renderPage()}
          </AppShellErrorBoundary>
        </main>
      </div>
    </div>
  );
}
