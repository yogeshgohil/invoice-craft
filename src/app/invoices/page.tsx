
'use client'; // Convert to Client Component

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { InvoiceFormData } from '@/components/invoice-form';
import { InvoiceFilters } from '@/components/invoice-filters';
import { Separator } from '@/components/ui/separator';
import { InvoiceViewSwitcher } from '@/components/invoice-view-switcher';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading
import { fetchInvoices } from '@/lib/fetch-invoices'; // Import fetch function

// Define the structure of the invoice object expected from the API
// Keep this export if other components rely on it
export interface Invoice extends InvoiceFormData {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
  totalAmount?: number;
  totalDue?: number;
}

// Define the structure for filter parameters
interface FilterParams {
    customerName?: string;
    status?: string;
    dueDateStart?: string;
    dueDateEnd?: string;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Add loading state
    const searchParams = useSearchParams(); // Use hook to get searchParams

    // Extract filter values from searchParams, providing defaults or undefined
    const filters: FilterParams = {
        customerName: searchParams.get('customerName') || undefined,
        status: searchParams.get('status') || undefined,
        dueDateStart: searchParams.get('dueDateStart') || undefined,
        dueDateEnd: searchParams.get('dueDateEnd') || undefined,
    };

    useEffect(() => {
      const loadInvoices = async () => {
        setIsLoading(true);
        setFetchError(null); // Reset error on new fetch
        try {
          const fetchedInvoices = await fetchInvoices(filters);
          setInvoices(fetchedInvoices);
        } catch (error: any) {
          setFetchError(error.message || "An unknown error occurred while loading invoices.");
        } finally {
          setIsLoading(false);
        }
      };

      loadInvoices();
    // Re-fetch when searchParams change (dependency array includes searchParams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-8 bg-background">
      <Card className="w-full max-w-7xl shadow-lg border border-border rounded-xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4 pb-4 border-b p-4 sm:p-6 bg-card">
            <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">Invoice</CardTitle>
            {/* Create Button is now moved inside InvoiceViewSwitcher */}
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
            <InvoiceFilters
                initialFilters={{
                    customerName: filters.customerName ?? '',
                    status: filters.status ?? '',
                    dueDateStart: filters.dueDateStart ?? '',
                    dueDateEnd: filters.dueDateEnd ?? '',
                }}
             />

            <Separator className="my-4 sm:my-6" />

            {isLoading ? (
                 // Show a loading indicator (Skeleton) while fetching
                 <div className="space-y-4">
                     <div className="flex justify-between items-center mb-4 space-x-2"> {/* Adjusted layout */}
                        {/* Skeleton for create button */}
                        <Skeleton className="h-9 w-[180px] rounded-md" />
                        {/* Skeletons for view toggle buttons */}
                         <div className='flex items-center space-x-2'>
                           <Skeleton className="h-9 w-9 rounded-md" />
                           <Skeleton className="h-9 w-9 rounded-md" />
                         </div>
                     </div>
                     {/* Skeleton for List View */}
                      <div className="rounded-lg border">
                          <Skeleton className="h-12 w-full rounded-t-md" /> {/* Header */}
                          <div className="divide-y divide-border">
                              {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full" />
                              ))}
                          </div>
                          <Skeleton className="h-10 w-full rounded-b-md"/> {/* Footer/Caption */}
                      </div>
                 </div>
             ) : (
                 // Render the View Switcher once data/error state is resolved
                 <InvoiceViewSwitcher invoices={invoices} fetchError={fetchError} />
             )}

        </CardContent>
      </Card>
    </main>
  );
}
