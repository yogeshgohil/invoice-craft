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
import { subMonths, startOfMonth, endOfMonth, format as formatDateFns, isValid, parseISO } from 'date-fns'; // Added isValid, parseISO

// Wrapper Component to use useSearchParams
function IncomeReportContent() {
    const searchParams = useSearchParams();
    const [reportData, setReportData] = useState<IncomeReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get date range from URL params or set defaults to current month
    const defaultEndDate = endOfMonth(new Date());
    const defaultStartDate = startOfMonth(new Date());

    // Parse dates from URL params safely, fall back to defaults
    const parseDateParam = (param: string | null, fallback: Date): Date => {
        if (param) {
            const parsed = parseISO(param); // Use parseISO which expects YYYY-MM-DDTHH:mm:ss.sssZ but often works for YYYY-MM-DD
             if (isValid(parsed)) return parsed;

             // Fallback for simple YYYY-MM-DD parsing
             const manualParse = parseISO(param + 'T00:00:00Z');
             if (isValid(manualParse)) return manualParse;
        }
        return fallback;
    };


    const effectiveStartDate = parseDateParam(searchParams.get('startDate'), defaultStartDate);
    const effectiveEndDate = parseDateParam(searchParams.get('endDate'), defaultEndDate);

    // Ensure end date is not before start date after parsing/defaults
    if (effectiveEndDate < effectiveStartDate) {
        effectiveEndDate.setTime(endOfMonth(effectiveStartDate).getTime()); // Adjust end date if invalid range
    }

    const startDateStr = formatDateFns(effectiveStartDate, 'yyyy-MM-dd');
    const endDateStr = formatDateFns(effectiveEndDate, 'yyyy-MM-dd');


    useEffect(() => {
        const loadReportData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch data based on the validated start/end date strings
                const data = await fetchIncomeReport({ startDate: startDateStr, endDate: endDateStr });
                setReportData(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load income report.');
                console.error("Error loading income report:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadReportData();
        // Re-fetch data when the derived date strings change
    }, [startDateStr, endDateStr]);

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
                    {/* Pass the effective start/end date strings to the filters component */}
                    <IncomeReportFilters initialStartDate={startDateStr} initialEndDate={endDateStr} />

                    {isLoading ? (
                        <div className="space-y-6">
                            {/* Keep Skeleton structure */}
                            <div className="grid grid-cols-1 gap-4">
                                <Card className="bg-card border shadow-sm animate-pulse">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-5 w-3/5" /></CardHeader>
                                    <CardContent><Skeleton className="h-8 w-1/2 mb-1" /><Skeleton className="h-4 w-4/5" /></CardContent>
                                </Card>
                            </div>
                            <Card className="bg-card border shadow-sm animate-pulse">
                                <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                                <CardContent><Skeleton className="h-72 w-full" /></CardContent>
                            </Card>
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
                                            {/* Format dates from reportData safely */}
                                            From {formatDateFns(parseISO(reportData.startDate), 'MMM d, yyyy')} to {formatDateFns(parseISO(reportData.endDate), 'MMM d, yyyy')}
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
                     {/* Skeleton for filters */}
                     <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 mb-4">
                       <div className="grid gap-2 w-full sm:w-auto">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-9 w-full sm:w-64" />
                       </div>
                       <Skeleton className="h-9 w-24" />
                       <Skeleton className="h-9 w-24" />
                     </div>
                      {/* Skeleton for summary */}
                      <div className="grid grid-cols-1 gap-4">
                          <Card className="bg-card border shadow-sm animate-pulse">
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-5 w-3/5" /></CardHeader>
                              <CardContent><Skeleton className="h-8 w-1/2 mb-1" /><Skeleton className="h-4 w-4/5" /></CardContent>
                          </Card>
                      </div>
                      {/* Skeleton for chart */}
                      <Card className="bg-card border shadow-sm animate-pulse">
                          <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                          <CardContent><Skeleton className="h-72 w-full" /></CardContent>
                      </Card>
                 </CardContent>
             </Card>
         </main>
    );
}
