import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ServiceStat } from '@/types/analytics.types';
import { ChartContainer } from '../shared/ChartContainer';
import { LoadingChart } from '../shared/LoadingChart';
import { EmptyChart } from '../shared/EmptyChart';

interface TopServicesChartProps {
  data: ServiceStat[] | undefined;
  isLoading: boolean;
}

export const TopServicesChart = React.memo(({ data, isLoading }: TopServicesChartProps) => {
  const chartData = useMemo(() => {
    if (!data) return [];
    // Sort descending and take top 10
    return [...data].sort((a, b) => b.count - a.count).slice(0, 10);
  }, [data]);

  const hasData = chartData.length > 0;

  return (
    <ChartContainer title="Top Services">
      {isLoading && <LoadingChart />}
      {!isLoading && !hasData && <EmptyChart message="No services data available" />}
      {!isLoading && hasData && (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" vertical={false} />
            <XAxis
              dataKey="service"
              stroke="hsl(var(--text-muted))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="hsl(var(--text-muted))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value)}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--surface-hover))' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--surface-elevated))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--text-primary))',
              }}
              itemStyle={{ color: 'hsl(var(--accent))' }}
            />
            <Bar dataKey="count" name="Logs" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
});
TopServicesChart.displayName = 'TopServicesChart';
