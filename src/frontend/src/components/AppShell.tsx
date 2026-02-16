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
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                transition-all duration-200 border
                ${isActive 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-sm' 
                  : 'text-sidebar-foreground border-transparent hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground hover:border-sidebar-border/50'
                }
              `}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User section */}
      <div className="p-4 space-y-3 border-t border-sidebar-border">
        {userProfile && (
          <div className="px-3 py-2 space-y-1">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {userProfile.name}
            </p>
            <p className="text-xs text-sidebar-foreground/70 capitalize">
              {userProfile.membershipTier.toLowerCase()} Member
            </p>
          </div>
        )}

        <Button
          onClick={() => handleNavClick('admin')}
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <Settings className="mr-3 h-4 w-4" />
          {COPY.nav.admin}
        </Button>

        <Button
          onClick={handleContactSupport}
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <Mail className="mr-3 h-4 w-4" />
          {COPY.support.contactUs}
        </Button>

        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-4 p-4 bg-background border-b border-border">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <OpaqueSheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <SidebarContent />
              </div>
            </OpaqueSheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
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
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside 
          className="w-64 shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar-background shadow-sidebar"
        >
          <SidebarContent />
        </aside>
      )}

      {/* Main content */}
      <main className={`flex-1 overflow-y-auto min-w-0 ${isMobile ? 'pt-16' : ''}`}>
        <AppShellErrorBoundary onReset={() => setCurrentPage('dashboard')}>
          {renderPage()}
        </AppShellErrorBoundary>
      </main>
    </div>
  );
}
