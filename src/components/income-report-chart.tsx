
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface MonthlyData {
  month: string; // Format: YYYY-MM
  totalInvoiced: number;
  totalPaid: number;
  totalDue: number;
}

interface IncomeReportChartProps {
  data: MonthlyData[];
}

// Custom Tooltip Content
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const monthData = payload[0].payload; // All bars for a month share the same payload
        const formattedMonth = format(new Date(monthData.month + '-02'), 'MMM yyyy'); // Add day for Date constructor

        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                <div className="font-semibold mb-1">{formattedMonth}</div>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => (
                         <div key={`item-${index}`} className="flex items-center justify-between gap-2">
                           <div className="flex items-center gap-1.5">
                             <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }}></span>
                             <span>{entry.name}:</span>
                           </div>
                           <span className="font-medium">{formatCurrency(entry.value)}</span>
                         </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};


export function IncomeReportChart({ data }: IncomeReportChartProps) {
  // Format data for the chart, keeping original values
  const chartData = data.map(item => ({
    name: format(new Date(item.month + '-02'), 'MMM yy'), // Format X-axis label (e.g., Jul 24)
    month: item.month, // Keep original month for tooltip
    totalInvoiced: item.totalInvoiced,
    totalPaid: item.totalPaid,
    totalDue: item.totalDue,
  }));

  return (
     // Parent div now takes full width and a fixed height responsive to screen size
    <div className="w-full h-[300px] sm:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 0, left: -15, bottom: 5 }}> {/* Adjusted margins */}
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={10} // Smaller font size for mobile
             tickLine={false}
             axisLine={false}
             interval={'preserveStartEnd'} // Adjust interval to avoid overlapping labels
             // dy={5} // Optional: Adjust vertical position
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={10} // Smaller font size for mobile
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${formatCurrency(value / 1000)}k`} // Format as thousands (e.g., 5k)
            width={55} // Slightly reduced width for mobile
             // dx={-5} // Optional: Adjust horizontal position
          />
           <Tooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} // Use muted for cursor fill
              content={<CustomTooltip />}
           />
           <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} /> {/* Smaller legend font size */}
          <Bar
             dataKey="totalInvoiced"
             name="Total Invoiced"
             fill="hsl(var(--chart-1))" // Use chart color 1
             radius={[3, 3, 0, 0]} // Slightly smaller radius
             stackId="a" // Optional: stack bars if desired, remove if side-by-side needed
             barSize={15} // Optional: Fixed bar size for consistency
          />
           <Bar
             dataKey="totalPaid"
             name="Total Paid"
             fill="hsl(var(--chart-2))" // Use chart color 2
             radius={[3, 3, 0, 0]} // Slightly smaller radius
             stackId="a" // Optional: stack bars if desired, remove if side-by-side needed
             barSize={15} // Optional: Fixed bar size for consistency
          />
           <Bar
             dataKey="totalDue"
             name="Total Due"
             fill="hsl(var(--chart-5))" // Use chart color 5 (often red/orange)
             radius={[3, 3, 0, 0]} // Slightly smaller radius
             stackId="a" // Optional: stack bars if desired, remove if side-by-side needed
             barSize={15} // Optional: Fixed bar size for consistency
           />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

    