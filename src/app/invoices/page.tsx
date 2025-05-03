
'use client'; // Keep as client component due to state management for invoices, filters, loading, and errors

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import type { InvoiceFormData } from '@/components/invoice-form';
import { InvoiceFilters } from '@/components/invoice-filters';
import { Separator } from '@/components/ui/separator';
import { InvoiceViewSwitcher } from '@/components/invoice-view-switcher';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading

// Define the structure of the invoice object expected from the API
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

async function fetchInvoices(filters: FilterParams): Promise<Invoice[]> {
    // Use relative URL directly
    const queryParams = new URLSearchParams();
    if (filters.customerName) queryParams.append('customerName', filters.customerName);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.dueDateStart) queryParams.append('dueDateStart', filters.dueDateStart);
    if (filters.dueDateEnd) queryParams.append('dueDateEnd', filters.dueDateEnd);

    const apiUrl = `/api/invoices?${queryParams.toString()}`; // Use relative URL
    console.log(`Fetching invoices from: ${apiUrl}`);

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
        });

        if (!response.ok) {
            let errorBody = 'Failed to fetch invoices.';
            try {
                const errorData = await response.json();
                errorBody = errorData.message || `HTTP error! status: ${response.status}`;
            } catch (e) {
                console.error("Could not parse error response body:", e);
                errorBody = `HTTP error! status: ${response.status} ${response.statusText || ''}`.trim();
            }
            console.error(`Error fetching invoices: ${response.status} ${response.statusText}`, errorBody);
            throw new Error(errorBody);
        }

        const data = await response.json();
        if (!data || !Array.isArray(data.invoices)) {
            console.error('Invalid data structure received from API:', data);
            throw new Error('Invalid data structure received from API.');
        }
        console.log(`Successfully fetched ${data.invoices.length} invoices.`);
        return data.invoices as Invoice[];
    } catch (error) {
        console.error('An error occurred while fetching invoices:', error);
        // Ensure the error message is propagated correctly
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to load invoices. Please check the API connection or try again later. Original error: ${errorMessage}`);
    }
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
          console.error("Error in InvoicesPage fetching data:", error);
          setFetchError(error.message || "An unknown error occurred while loading invoices.");
        } finally {
          setIsLoading(false);
        }
      };

      loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]); // Re-fetch when searchParams change

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-8 bg-background">
      <Card className="w-full max-w-7xl shadow-lg border border-border rounded-xl overflow-hidden"> {/* Rounded Card */}
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4 pb-4 border-b p-4 sm:p-6 bg-card"> {/* Header background */}
            <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">Saved Invoices</CardTitle> {/* Adjusted size/weight */}
            {/* Moved Create Button to CardContent */}
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

             {/* Moved Create Button Here */}
             <div className="flex justify-start mb-4 sm:mb-6"> {/* Position button before the switcher */}
                 <Link href="/invoices/new" passHref legacyBehavior>
                     <Button size="sm" className="w-auto">
                         <PlusCircle className="mr-2 h-4 w-4" /> Create New Bill
                     </Button>
                 </Link>
             </div>

            {isLoading ? (
                 // Show a loading indicator (Skeleton) while fetching
                 <div className="space-y-4">
                     <div className="flex justify-end mb-4 space-x-2">
                        <Skeleton className="h-9 w-9 rounded-md" />
                        <Skeleton className="h-9 w-9 rounded-md" />
                     </div>
                     {/* Skeleton for List View */}
                      <div className="rounded-lg border">
                          <Skeleton className="h-12 w-full" /> {/* Header */}
                          <div className="divide-y divide-border">
                              {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full" />
                              ))}
                          </div>
                      </div>
                      {/* Or Skeleton for Grid View (uncomment if needed) */}
                      {/* <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4">
                           {[...Array(4)].map((_, i) => (
                             <div key={i} className="flex flex-col gap-4 flex-shrink-0 w-64 sm:w-72 md:w-80">
                               <Skeleton className="h-10 w-full" />
                               <Skeleton className="h-32 w-full" />
                               <Skeleton className="h-32 w-full" />
                             </div>
                           ))}
                      </div> */}
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
