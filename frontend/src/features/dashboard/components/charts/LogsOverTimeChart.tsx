import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendPoint } from '@/types/analytics.types';
import { ChartContainer } from '../shared/ChartContainer';
import { LoadingChart } from '../shared/LoadingChart';
import { EmptyChart } from '../shared/EmptyChart';

interface LogsOverTimeChartProps {
  data: TrendPoint[] | undefined;
  isLoading: boolean;
}

export const LogsOverTimeChart = React.memo(({ data, isLoading }: LogsOverTimeChartProps) => {
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((point) => ({
      ...point,
      // Optional: Format date for display if needed
      displayDate: new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }));
  }, [data]);

  const hasData = chartData.length > 0;

  const legend = (
    <>
      <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-secondary))]">
        <span className="w-2 h-2 rounded-full bg-[hsl(var(--accent))]"></span>
        Volume
      </span>
    </>
  );

  return (
    <ChartContainer title="Log Volume Trend" legend={legend} className="lg:col-span-2">
      {isLoading && <LoadingChart />}
      {!isLoading && !hasData && <EmptyChart message="No volume data available" />}
      {!isLoading && hasData && (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} initialDimension={{ width: 400, height: 250 }}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" vertical={false} />
            <XAxis
              dataKey="displayDate"
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
              contentStyle={{
                backgroundColor: 'hsl(var(--surface-elevated))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--text-primary))',
              }}
              itemStyle={{ color: 'hsl(var(--accent))' }}
            />
            <Line
              type="monotone"
              dataKey="count"
              name="Logs"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              dot={{ r: 4, fill: 'hsl(var(--surface-elevated))', strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
});
LogsOverTimeChart.displayName = 'LogsOverTimeChart';
