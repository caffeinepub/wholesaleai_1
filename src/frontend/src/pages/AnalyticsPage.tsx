import { useGetAnalytics, useGetCallerUserProfile } from '../hooks/useQueries';
import { MembershipTier } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Target, Percent } from 'lucide-react';
import FeatureLock from '../components/FeatureLock';
import ProfitByZipTable from '../components/ProfitByZipTable';

export default function AnalyticsPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: analytics, isLoading } = useGetAnalytics();

  const hasAccess = userProfile?.membershipTier === MembershipTier.Enterprise;

  if (!hasAccess) {
    return (
      <FeatureLock
        feature="Advanced Analytics"
        requiredTier="Enterprise"
        description="Access detailed insights including average assignment fees, close rates, conversion metrics, and profit analysis by location."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      title: 'Average Assignment Fee',
      value: `$${Math.round(analytics.averageAssignmentFee).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-chart-1',
    },
    {
      title: 'Monthly Revenue',
      value: `$${Number(analytics.monthlyRevenue).toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-chart-2',
    },
    {
      title: 'Close Rate',
      value: `${analytics.closeRate.toFixed(1)}%`,
      icon: Target,
      color: 'text-chart-3',
    },
    {
      title: 'Deal Conversion',
      value: `${analytics.dealConversionPercent.toFixed(1)}%`,
      icon: Percent,
      color: 'text-chart-4',
    },
    {
      title: 'Lead to Contract',
      value: `${analytics.leadToContractPercent.toFixed(1)}%`,
      icon: Percent,
      color: 'text-primary',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
        <p className="text-muted-foreground">Deep insights into your wholesaling performance</p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Profit by Zip Code</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfitByZipTable data={analytics.profitByZipCode} />
        </CardContent>
      </Card>
    </div>
  );
}

