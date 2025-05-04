
'use client';

import { useState, useEffect, Suspense, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IncomeReportFilters } from '@/components/income-report-filters';
import { IncomeReportChart } from '@/components/income-report-chart';
import { fetchIncomeReport, type IncomeReportData } from '@/lib/fetch-income-report';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, IndianRupee, TrendingDown, TrendingUp } from 'lucide-react'; // Added relevant icons
import { format as formatDateFns, isValid, parseISO, startOfMonth, endOfMonth } from 'date-fns'; // Renamed 'format' to avoid conflict, added date helpers

// Wrapper Component to use useSearchParams
function IncomeReportContent() {
    const searchParams = useSearchParams();
    const [reportData, setReportData] = useState<IncomeReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get date range from URL params or set defaults to current month
    const defaultEndDate = new Date(); // Use today as default end
    const defaultStartDate = new Date(defaultEndDate.getFullYear(), defaultEndDate.getMonth(), 1); // Start of current month

    // Parse dates from URL params safely, fall back to defaults
    const parseDateParam = (param: string | null, fallback: Date): Date => {
        if (param) {
            const parsed = parseISO(param + 'T00:00:00Z'); // Append time for reliable ISO parsing
            if (isValid(parsed)) return parsed;
        }
        return fallback;
    };


    const effectiveStartDate = parseDateParam(searchParams.get('startDate'), defaultStartDate);
    const effectiveEndDate = parseDateParam(searchParams.get('endDate'), defaultEndDate);

    // Format dates for API call and display (ensure valid dates)
    const startDateStr = isValid(effectiveStartDate) ? formatDateFns(effectiveStartDate, 'yyyy-MM-dd') : formatDateFns(defaultStartDate, 'yyyy-MM-dd');
    const endDateStr = isValid(effectiveEndDate) ? formatDateFns(effectiveEndDate, 'yyyy-MM-dd') : formatDateFns(defaultEndDate, 'yyyy-MM-dd');


    useEffect(() => {
        const loadReportData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch data based on the validated start/end date strings
                const data = await fetchIncomeReport({ startDate: startDateStr, endDate: endDateStr });
                setReportData(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load financial report.');
                console.error("Error loading financial report:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadReportData();
        // Re-fetch data when the derived date strings change
    }, [startDateStr, endDateStr]);

    // Ensure the return statement is correctly wrapped in parentheses
    return (
        <main className="flex min-h-screen flex-col items-center justify-start p-2 sm:p-4 md:p-6 bg-background">
             <Card className="w-full max-w-7xl shadow-lg border border-border rounded-xl overflow-hidden">
                <CardHeader className="border-b pb-3 p-3 sm:p-4">
                    <CardTitle className="text-base sm:text-lg font-semibold text-primary">Financial Report</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Monthly invoiced, paid, and due amounts based on invoice creation date.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                    <IncomeReportFilters initialStartDate={startDateStr} initialEndDate={endDateStr} />

                    {isLoading ? (
                        <div className="space-y-3 sm:space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                <Card className="bg-card border shadow-sm animate-pulse"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-5 w-5 rounded-full" /></CardHeader><CardContent className="pt-1 px-2 pb-2 sm:pt-2 sm:px-3 sm:pb-3"><Skeleton className="h-6 sm:h-7 w-1/2 mb-1" /><Skeleton className="h-3 w-4/5" /></CardContent></Card>
                                <Card className="bg-card border shadow-sm animate-pulse"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-5 w-5 rounded-full" /></CardHeader><CardContent className="pt-1 px-2 pb-2 sm:pt-2 sm:px-3 sm:pb-3"><Skeleton className="h-6 sm:h-7 w-1/2 mb-1" /><Skeleton className="h-3 w-4/5" /></CardContent></Card>
                                <Card className="bg-card border shadow-sm animate-pulse"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-5 w-5 rounded-full" /></CardHeader><CardContent className="pt-1 px-2 pb-2 sm:pt-2 sm:px-3 sm:pb-3"><Skeleton className="h-6 sm:h-7 w-1/2 mb-1" /><Skeleton className="h-3 w-4/5" /></CardContent></Card>
                            </div>
                            <Card className="bg-card border shadow-sm animate-pulse">
                                <CardHeader className='p-3 sm:p-4'><Skeleton className="h-5 w-1/3" /></CardHeader>
                                <CardContent className='p-1 sm:p-2 md:p-3 pt-0'><Skeleton className="h-56 sm:h-64 md:h-72 w-full" /></CardContent>
                            </Card>
                        </div>
                    ) : error ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error Loading Report</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : reportData ? (
                        <div className="space-y-3 sm:space-y-4">
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                <Card className="bg-card border shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3">
                                        <CardTitle className="text-xs sm:text-sm font-medium">Total Invoiced</CardTitle>
                                        <IndianRupee className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="pt-0 px-2 pb-2 sm:pt-1 sm:px-3 sm:pb-3">
                                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                                            {formatCurrency(reportData.totalInvoicedInRange)}
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                                            {formatDateFns(parseISO(reportData.startDate), 'MMM d')} - {formatDateFns(parseISO(reportData.endDate), 'MMM d, yyyy')}
                                        </p>
                                    </CardContent>
                                </Card>
                                 <Card className="bg-card border shadow-sm">
                                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3">
                                        <CardTitle className="text-xs sm:text-sm font-medium">Total Paid</CardTitle>
                                        <TrendingUp className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-green-600" />
                                    </CardHeader>
                                     <CardContent className="pt-0 px-2 pb-2 sm:pt-1 sm:px-3 sm:pb-3">
                                         <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-700">
                                            {formatCurrency(reportData.totalPaidInRange)}
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                                            Received within range
                                         </p>
                                    </CardContent>
                                </Card>
                                 <Card className="bg-card border shadow-sm">
                                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3">
                                        <CardTitle className="text-xs sm:text-sm font-medium">Total Due</CardTitle>
                                        <TrendingDown className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-red-600" />
                                    </CardHeader>
                                     <CardContent className="pt-0 px-2 pb-2 sm:pt-1 sm:px-3 sm:pb-3">
                                         <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-700">
                                            {formatCurrency(reportData.totalDueInRange)}
                                        </div>
                                         <p className="text-[10px] sm:text-xs text-muted-foreground">
                                            Outstanding within range
                                         </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="bg-card border shadow-sm">
                                <CardHeader className='p-3 sm:p-4'>
                                    <CardTitle className="text-sm sm:text-base md:text-lg font-semibold">Monthly Breakdown</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm text-muted-foreground -mt-0.5">Invoiced vs Paid vs Due</CardDescription>
                                </CardHeader>
                                <CardContent className='p-1 sm:p-2 md:p-3 pt-0 h-[300px] sm:h-[350px]'>
                                    {reportData.monthlyData.length > 0 ? (
                                        <IncomeReportChart data={reportData.monthlyData} />
                                     ) : (
                                         <div className="flex items-center justify-center h-full">
                                            <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">No data found for the selected period.</p>
                                         </div>
                                     )}
                                </CardContent>
                            </Card>

                        </div>
                    ) : (
                         <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">No data available.</p>
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
         <main className="flex min-h-screen flex-col items-center justify-start p-2 sm:p-4 md:p-6 bg-background">
             <Card className="w-full max-w-7xl shadow-lg border border-border rounded-xl overflow-hidden"> {/* Increased max-width */}
                  <CardHeader className="border-b pb-3 p-3 sm:p-4">
                     <Skeleton className="h-5 sm:h-6 w-32 sm:w-40 mb-1" /> {/* Adjusted size */}
                     <Skeleton className="h-3.5 sm:h-4 w-48 sm:w-56" /> {/* Adjusted size */}
                 </CardHeader>
                 <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4"> {/* Adjusted padding/spacing */}
                     {/* Skeleton for filters - Adjusted layout and size */}
                     <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 mb-3">
                       <div className="grid gap-1.5 w-full sm:w-auto">
                          <Skeleton className="h-3.5 w-16 sm:w-20" /> {/* Adjusted size */}
                          <Skeleton className="h-8 w-full sm:w-48 md:w-56" /> {/* Adjusted size */}
                       </div>
                        <div className="grid gap-1.5 w-full sm:w-auto">
                           <Skeleton className="h-3.5 w-16 sm:w-20" /> {/* Adjusted size */}
                           <Skeleton className="h-8 w-full sm:w-48 md:w-56" /> {/* Adjusted size */}
                        </div>
                       <Skeleton className="h-8 w-16 sm:w-20" /> {/* Adjusted size */}
                       <Skeleton className="h-8 w-16 sm:w-20" /> {/* Adjusted size */}
                     </div>
                      {/* Skeleton for summary cards - Adjusted layout and size */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                             <Card className="bg-card border shadow-sm animate-pulse"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-5 w-5 rounded-full" /></CardHeader><CardContent className="pt-1 px-2 pb-2 sm:pt-2 sm:px-3 sm:pb-3"><Skeleton className="h-6 sm:h-7 w-1/2 mb-1" /><Skeleton className="h-3 w-4/5" /></CardContent></Card>
                            <Card className="bg-card border shadow-sm animate-pulse"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-5 w-5 rounded-full" /></CardHeader><CardContent className="pt-1 px-2 pb-2 sm:pt-2 sm:px-3 sm:pb-3"><Skeleton className="h-6 sm:h-7 w-1/2 mb-1" /><Skeleton className="h-3 w-4/5" /></CardContent></Card>
                            <Card className="bg-card border shadow-sm animate-pulse"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-2 sm:p-3"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-5 w-5 rounded-full" /></CardHeader><CardContent className="pt-1 px-2 pb-2 sm:pt-2 sm:px-3 sm:pb-3"><Skeleton className="h-6 sm:h-7 w-1/2 mb-1" /><Skeleton className="h-3 w-4/5" /></CardContent></Card>
                        </div>
                      {/* Skeleton for chart - Adjusted size */}
                      <Card className="bg-card border shadow-sm animate-pulse">
                          <CardHeader className='p-3 sm:p-4'><Skeleton className="h-5 w-1/3" /></CardHeader>
                          <CardContent className='p-1 sm:p-2 md:p-3 pt-0'><Skeleton className="h-56 sm:h-64 md:h-72 w-full" /></CardContent> {/* Adjusted height */}
                      </Card>
                 </CardContent>
             </Card>
         </main>
    );
}
