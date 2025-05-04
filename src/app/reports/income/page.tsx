
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IncomeReportFilters } from '@/components/income-report-filters';
import { IncomeReportChart } from '@/components/income-report-chart';
import { fetchIncomeReport, type IncomeReportData } from '@/lib/fetch-income-report';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

// Wrapper Component to use useSearchParams
function IncomeReportContent() {
    const searchParams = useSearchParams();
    const [reportData, setReportData] = useState<IncomeReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get date range from URL params or set defaults
    const defaultEndDate = endOfMonth(new Date());
    const defaultStartDate = startOfMonth(subMonths(defaultEndDate, 5)); // Default to last 6 months

    const startDate = searchParams.get('startDate') || defaultStartDate.toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || defaultEndDate.toISOString().split('T')[0];

    useEffect(() => {
        const loadReportData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchIncomeReport({ startDate, endDate });
                setReportData(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load income report.');
                console.error("Error loading income report:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadReportData();
    }, [startDate, endDate]); // Refetch when date range changes

    return (
        <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-8 lg:p-12 bg-background">
            <Card className="w-full max-w-6xl shadow-lg border border-border rounded-xl overflow-hidden">
                <CardHeader className="border-b pb-4">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-primary">Income Report</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                        Monthly income from completed invoices within the selected date range.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                    <IncomeReportFilters initialStartDate={startDate} initialEndDate={endDate} />

                    {isLoading ? (
                        <div className="space-y-6">
                            <Skeleton className="h-10 w-48" />
                            <Skeleton className="h-72 w-full" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        </div>
                    ) : error ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error Loading Report</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : reportData ? (
                        <div className="space-y-6">
                             {/* Summary Cards */}
                             <div className="grid grid-cols-1 gap-4">
                                <Card className="bg-card border shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Income (Selected Range)</CardTitle>
                                        {/* Optional: Add an icon like DollarSign */}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-primary">
                                            {formatCurrency(reportData.totalIncomeInRange)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            From {new Date(reportData.startDate).toLocaleDateString()} to {new Date(reportData.endDate).toLocaleDateString()}
                                        </p>
                                    </CardContent>
                                </Card>
                                {/* Add more summary cards if needed (e.g., average monthly income) */}
                            </div>

                            {/* Chart */}
                            <Card className="bg-card border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Monthly Income Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {reportData.monthlyData.length > 0 ? (
                                        <IncomeReportChart data={reportData.monthlyData} />
                                     ) : (
                                        <p className="text-center text-muted-foreground py-8">No income data found for the selected period.</p>
                                     )}
                                </CardContent>
                            </Card>


                        </div>
                    ) : (
                         <p className="text-center text-muted-foreground py-8">No data available.</p>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}


export default function IncomeReportPage() {
    // Wrap Content with Suspense to handle loading of searchParams
    return (
        <Suspense fallback={<LoadingSkeleton />}>
             <IncomeReportContent />
        </Suspense>
    );
}

// Basic Skeleton for Suspense Fallback
function LoadingSkeleton() {
    return (
         <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-8 lg:p-12 bg-background">
             <Card className="w-full max-w-6xl shadow-lg border border-border rounded-xl overflow-hidden">
                 <CardHeader className="border-b pb-4">
                     <Skeleton className="h-7 w-48 mb-1" />
                     <Skeleton className="h-4 w-64" />
                 </CardHeader>
                 <CardContent className="p-4 sm:p-6 space-y-6">
                     <Skeleton className="h-10 w-full max-w-md" />
                     <Skeleton className="h-10 w-48" />
                     <Skeleton className="h-72 w-full" />
                 </CardContent>
             </Card>
         </main>
    );
}
      