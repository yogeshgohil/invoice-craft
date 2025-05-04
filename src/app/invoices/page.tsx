
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
          console.error("Error fetching invoices:", error); // Log the actual error
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
     // Reduced padding for mobile view
    <main className="flex min-h-screen flex-col items-center justify-start p-2 sm:p-4 md:p-6 bg-background">
      <Card className="w-full max-w-7xl shadow-lg border border-border rounded-xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-1 sm:space-y-0 sm:space-x-4 pb-3 border-b p-3 sm:p-4 bg-card"> {/* Reduced padding */}
            <CardTitle className="text-base sm:text-lg font-semibold text-foreground">Invoice</CardTitle> {/* Adjusted font size */}
            {/* Create Button is now moved inside InvoiceViewSwitcher */}
        </CardHeader>
        <CardContent className="p-3 sm:p-4"> {/* Reduced padding */}
            <InvoiceFilters
                initialFilters={{
                    customerName: filters.customerName ?? '',
                    status: filters.status ?? '',
                    dueDateStart: filters.dueDateStart ?? '',
                    dueDateEnd: filters.dueDateEnd ?? '',
                }}
             />

            <Separator className="my-3 sm:my-4" /> {/* Reduced margin */}

            {isLoading ? (
                 // Show a loading indicator (Skeleton) while fetching
                 <div className="space-y-3"> {/* Reduced spacing */}
                     <div className="flex justify-between items-center mb-3 space-x-2"> {/* Adjusted layout, reduced margin */}
                        {/* Skeleton for create button */}
                        <Skeleton className="h-8 w-28 sm:w-[160px] rounded-md" /> {/* Adjusted size */}
                        {/* Skeletons for view toggle buttons */}
                         <div className='flex items-center space-x-1.5'> {/* Reduced spacing */}
                           <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-md" /> {/* Adjusted size */}
                           <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-md" />
                         </div>
                     </div>
                     {/* Skeleton for List View */}
                      <div className="rounded-lg border">
                          <Skeleton className="h-10 w-full rounded-t-md" /> {/* Adjusted Header size */}
                          <div className="divide-y divide-border">
                              {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" /> /* Adjusted row height */
                              ))}
                          </div>
                          <Skeleton className="h-8 w-full rounded-b-md"/> {/* Adjusted Footer/Caption size */}
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
