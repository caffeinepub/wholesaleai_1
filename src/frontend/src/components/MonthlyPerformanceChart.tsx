import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Deal } from '../backend';
import { DealStage } from '../backend';

interface MonthlyPerformanceChartProps {
  deals: Deal[];
}

export default function MonthlyPerformanceChart({ deals }: MonthlyPerformanceChartProps) {
  const chartData = useMemo(() => {
    const monthlyData = new Map<string, { profit: number; fees: number }>();

    deals.forEach((deal) => {
      const date = new Date(Number(deal.createdAt) / 1_000_000);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { profit: 0, fees: 0 });
      }

      const data = monthlyData.get(monthKey)!;

      if (deal.stage === DealStage.Closed && deal.actualProfit) {
        data.profit += Number(deal.actualProfit);
      } else {
        data.fees += Number(deal.estimatedProfit);
      }
    });

    const sortedData = Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', {
          month: 'short',
        });
        return {
          month: monthName,
          profit: data.profit,
          fees: data.fees,
        };
      });

    return sortedData;
  }, [deals]);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
        <XAxis dataKey="month" stroke="oklch(var(--muted-foreground))" />
        <YAxis stroke="oklch(var(--muted-foreground))" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'oklch(var(--popover))',
            border: '1px solid oklch(var(--border))',
            borderRadius: '0.5rem',
          }}
          labelStyle={{ color: 'oklch(var(--popover-foreground))' }}
        />
        <Bar dataKey="profit" fill="oklch(var(--primary))" name="Closed Profit" />
        <Bar dataKey="fees" fill="oklch(var(--chart-2))" name="Est. Fees" />
      </BarChart>
    </ResponsiveContainer>
  );
}

