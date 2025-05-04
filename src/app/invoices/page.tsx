
'use client'; // Convert to Client Component

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { InvoiceFormData } from '@/components/invoice-form';
import { InvoiceFilters } from '@/components/invoice-filters';
import { Separator } from '@/components/ui/separator';
import { InvoiceViewSwitcher } from '@/components/invoice-view-switcher';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading
import { fetchInvoices } from '@/lib/fetch-invoices'; // Import fetch function
import { Loader2 } from 'lucide-react'; // Import Loader2 for infinite scroll loading

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

// Define the structure for pagination info from the API
interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalInvoices: number;
    limit: number;
}

const ITEMS_PER_PAGE = 10; // Number of items to load per page/batch

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Loading state for initial load
    const [isFetchingMore, setIsFetchingMore] = useState(false); // Loading state for subsequent loads
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const searchParams = useSearchParams(); // Use hook to get searchParams
    const observerRef = useRef<IntersectionObserver | null>(null); // Ref for IntersectionObserver
    const loadMoreRef = useRef<HTMLDivElement | null>(null); // Ref for the element to observe

    // Extract filter values from searchParams, providing defaults or undefined
    const filters: FilterParams = {
        customerName: searchParams.get('customerName') || undefined,
        status: searchParams.get('status') || undefined,
        dueDateStart: searchParams.get('dueDateStart') || undefined,
        dueDateEnd: searchParams.get('dueDateEnd') || undefined,
    };

    const loadInvoices = useCallback(async (page: number, currentFilters: FilterParams) => {
        if (page === 1) {
            setIsLoading(true); // Initial load indicator
        } else {
            setIsFetchingMore(true); // Subsequent load indicator
        }
        setFetchError(null); // Reset error on new fetch

        try {
            const response = await fetchInvoices({
                ...currentFilters,
                page: page,
                limit: ITEMS_PER_PAGE,
            });

            // Append new invoices for subsequent pages, replace for first page or filter change
            setInvoices(prevInvoices => page === 1 ? response.invoices : [...prevInvoices, ...response.invoices]);
            setPagination(response.pagination);
            setCurrentPage(response.pagination.currentPage);

        } catch (error: any) {
            console.error("Error fetching invoices:", error); // Log the actual error
            setFetchError(error.message || "An unknown error occurred while loading invoices.");
        } finally {
            setIsLoading(false); // Stop initial loading indicator
            setIsFetchingMore(false); // Stop subsequent loading indicator
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Dependencies managed by useEffect


    // Effect to load initial data and reset on filter change
    useEffect(() => {
        // Reset state when filters change
        setInvoices([]);
        setCurrentPage(1);
        setPagination(null);
        // Load the first page with current filters
        loadInvoices(1, filters);
    }, [searchParams, loadInvoices]); // Re-run when searchParams (filters) change


    // Effect for setting up Intersection Observer
    useEffect(() => {
        if (isLoading || isFetchingMore || !pagination || pagination.currentPage >= pagination.totalPages) {
            return; // Don't observe if loading, fetching, or no more pages
        }

        const options = {
            root: null, // Use the viewport as the root
            rootMargin: '0px',
            threshold: 1.0, // Trigger when the element is fully visible
        };

        const handleObserver = (entries: IntersectionObserverEntry[]) => {
            const target = entries[0];
            if (target.isIntersecting) {
                // Load next page
                loadInvoices(currentPage + 1, filters);
            }
        };

        observerRef.current = new IntersectionObserver(handleObserver, options);

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        // Cleanup observer on component unmount or when dependencies change
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [isLoading, isFetchingMore, pagination, currentPage, filters, loadInvoices]);


     // Handler to remove deleted invoice from the list
     const handleInvoiceDeleted = (deletedInvoiceId: string) => {
         setInvoices(prevInvoices => prevInvoices.filter(invoice => invoice._id !== deletedInvoiceId));
         // Optionally adjust pagination totals if needed, though a refresh might be simpler
          setPagination(prevPagination => prevPagination ? { ...prevPagination, totalInvoices: prevPagination.totalInvoices - 1 } : null);
     };

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

            {isLoading && invoices.length === 0 ? (
                 // Show a skeleton loading indicator only on initial load
                 <div className="space-y-3"> {/* Reduced spacing */}
                      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-3 gap-2"> {/* Adjusted layout, reduced margin */}
                         <Skeleton className="h-8 w-full sm:w-[160px] rounded-md" />
                          <div className='flex items-center justify-end sm:justify-start space-x-1.5'>
                            <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-md" />
                            <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-md" />
                          </div>
                      </div>
                     {/* Skeleton for List View */}
                      <div className="rounded-lg border">
                          <Skeleton className="h-10 w-full rounded-t-md" />
                          <div className="divide-y divide-border">
                              {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                              ))}
                          </div>
                          <Skeleton className="h-8 w-full rounded-b-md"/>
                      </div>
                 </div>
             ) : (
                 // Render the View Switcher once data/error state is resolved
                 <>
                 <InvoiceViewSwitcher
                   invoices={invoices}
                   fetchError={fetchError}
                   onInvoiceDeleted={handleInvoiceDeleted} // Pass the delete handler
                 />
                  {/* Load More Indicator */}
                  <div ref={loadMoreRef} className="flex justify-center py-4">
                       {isFetchingMore && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
                       {!isFetchingMore && pagination && pagination.currentPage >= pagination.totalPages && invoices.length > 0 && (
                           <p className="text-sm text-muted-foreground">End of results.</p>
                       )}
                   </div>
                 </>
             )}

        </CardContent>
      </Card>
    </main>
  );
}
