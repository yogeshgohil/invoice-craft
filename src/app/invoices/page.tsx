
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!baseUrl) {
        console.error("FATAL: NEXT_PUBLIC_APP_URL environment variable is not set.");
        throw new Error("Application is not configured correctly. NEXT_PUBLIC_APP_URL environment variable is missing. Please set it in your .env.local file (e.g., NEXT_PUBLIC_APP_URL=http://localhost:9002) or deployment environment.");
    }

    const queryParams = new URLSearchParams();
    if (filters.customerName) queryParams.append('customerName', filters.customerName);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.dueDateStart) queryParams.append('dueDateStart', filters.dueDateStart);
    if (filters.dueDateEnd) queryParams.append('dueDateEnd', filters.dueDateEnd);

    const apiUrl = `/api/invoices?${queryParams.toString()}`; // Use relative URL
    console.log(`Fetching invoices from: ${apiUrl}`);

    // No need to validate relative URL with new URL()

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
        if (error instanceof Error && (error.message.startsWith("Application is not configured correctly") || error.message.startsWith("Failed to construct valid API URL"))) {
             throw error;
        }
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
    }, [searchParams]); // Re-fetch when searchParams change

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-12 lg:p-24 bg-background">
      <Card className="w-full max-w-7xl shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4 pb-4 border-b mb-4 p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">Saved Invoices</CardTitle>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                 {/* Changed Link href to "/invoices/new" to point to the invoice creation page */}
                 <Link href="/invoices/new" passHref legacyBehavior>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create New Bill
                    </Button>
                 </Link>
            </div>
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
                 // Show a loading indicator while fetching
                 <div className="text-center py-10 text-muted-foreground">Loading invoices...</div>
             ) : (
                 // Render the View Switcher once data/error state is resolved
                 <InvoiceViewSwitcher invoices={invoices} fetchError={fetchError} />
             )}

        </CardContent>
      </Card>
    </main>
  );
}
