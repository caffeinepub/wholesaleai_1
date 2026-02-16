import { useGetDeals, useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DealStage } from '../backend';
import { TrendingUp, Home, Users, DollarSign, CheckCircle } from 'lucide-react';
import MonthlyPerformanceChart from '../components/MonthlyPerformanceChart';

export default function DashboardPage() {
  const { data: deals = [], isLoading } = useGetDeals();
  const { data: userProfile } = useGetCallerUserProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const activeLeads = deals.filter((d) => d.stage === DealStage.NewLead).length;
  const underContract = deals.filter(
    (d) => d.stage === DealStage.UnderContract || d.stage === DealStage.Assigned
  ).length;
  const assignedTobuyers = deals.filter((d) => d.assignedBuyer !== null).length;
  const totalEstimatedFees = deals
    .filter((d) => d.stage !== DealStage.Closed)
    .reduce((sum, d) => sum + Number(d.estimatedProfit), 0);
  const totalClosedProfit = deals
    .filter((d) => d.stage === DealStage.Closed && d.actualProfit !== null)
    .reduce((sum, d) => sum + Number(d.actualProfit || 0n), 0);

  const metrics = [
    {
      title: 'Active Leads',
      value: activeLeads,
      icon: TrendingUp,
      color: 'text-chart-1',
    },
    {
      title: 'Under Contract',
      value: underContract,
      icon: Home,
      color: 'text-chart-2',
    },
    {
      title: 'Assigned to Buyers',
      value: assignedTobuyers,
      icon: Users,
      color: 'text-chart-3',
    },
    {
      title: 'Est. Assignment Fees',
      value: `$${totalEstimatedFees.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-chart-4',
    },
    {
      title: 'Total Closed Profit',
      value: `$${totalClosedProfit.toLocaleString()}`,
      icon: CheckCircle,
      color: 'text-primary',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your deal intelligence control room</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyPerformanceChart deals={deals} />
        </CardContent>
      </Card>

      {/* Current Membership */}
      <Card>
        <CardHeader>
          <CardTitle>Current Membership Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">
                {userProfile?.membershipTier || 'Basic'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {userProfile?.membershipTier === 'Basic' && 'Limited to 15 active deals'}
                {userProfile?.membershipTier === 'Pro' && 'Unlimited deals + Buyers List'}
                {userProfile?.membershipTier === 'Enterprise' && 'Full access to all features'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

