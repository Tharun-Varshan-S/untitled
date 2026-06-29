import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { LogLevelsData } from '@/types/analytics.types';
import { ChartContainer } from '../shared/ChartContainer';
import { LoadingChart } from '../shared/LoadingChart';
import { EmptyChart } from '../shared/EmptyChart';

interface LogLevelsChartProps {
  data: LogLevelsData | undefined;
  isLoading: boolean;
}

const COLORS: Record<string, string> = {
  INFO: 'hsl(var(--accent))',
  WARN: 'hsl(var(--warning))', // Assuming --warning exists, else fallback to standard color
  ERROR: 'hsl(var(--error))',
  DEBUG: '#8b5cf6', // purple-500
  TRACE: '#6b7280', // gray-500
  UNKNOWN: '#9ca3af', // gray-400
};

export const LogLevelsChart = React.memo(({ data, isLoading }: LogLevelsChartProps) => {
  const chartData = useMemo(() => {
    if (!data) return [];
    
    // Convert object to array and filter out zeros
    const formatted = Object.entries(data)
      .map(([key, value]) => ({
        name: key.toUpperCase(),
        value: value as number,
      }))
      .filter((item) => item.value > 0);
      
    // Sort by value descending
    return formatted.sort((a, b) => b.value - a.value);
  }, [data]);

  const hasData = chartData.length > 0;

  return (
    <ChartContainer title="Log Levels Distribution">
      {isLoading && <LoadingChart />}
      {!isLoading && !hasData && <EmptyChart message="No level data available" />}
      {!isLoading && hasData && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name] || COLORS.UNKNOWN}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--surface-elevated))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--text-primary))',
              }}
              itemStyle={{ color: 'hsl(var(--text-primary))' }}
              formatter={(value: any) => [(Number(value) || 0).toLocaleString(), 'Count']}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
});
LogLevelsChart.displayName = 'LogLevelsChart';
