
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface MonthlyIncomeData {
  month: string; // Format: YYYY-MM
  totalIncome: number;
}

interface IncomeReportChartProps {
  data: MonthlyIncomeData[];
}

// Custom Tooltip Content
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const dataPoint = payload[0].payload;
        const formattedMonth = format(new Date(dataPoint.month + '-02'), 'MMM yyyy'); // Add day for Date constructor
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <div className="grid grid-cols-1 gap-1">
                     <div className="flex flex-col">
                         <span className="text-[0.70rem] uppercase text-muted-foreground">
                             Month
                         </span>
                         <span className="font-bold text-foreground">
                            {formattedMonth}
                         </span>
                    </div>
                     <div className="flex flex-col">
                         <span className="text-[0.70rem] uppercase text-muted-foreground">
                             Income
                         </span>
                         <span className="font-bold text-primary">
                            {formatCurrency(payload[0].value)}
                         </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};


export function IncomeReportChart({ data }: IncomeReportChartProps) {
  // Format data for the chart
  const chartData = data.map(item => ({
    name: format(new Date(item.month + '-02'), 'MMM yy'), // Format X-axis label (e.g., Jul 24) - Add day for valid Date
    totalIncome: item.totalIncome,
    month: item.month, // Keep original month for tooltip
  }));

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${formatCurrency(value)}`}
          />
           <Tooltip
              cursor={{ fill: "hsl(var(--accent))", opacity: 0.3 }}
              content={<CustomTooltip />}
           />
          <Bar
             dataKey="totalIncome"
             fill="hsl(var(--primary))"
             radius={[4, 4, 0, 0]}
             // Add animation
             // animationDuration={500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
