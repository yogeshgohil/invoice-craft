
'use client'; // Convert to Client Component

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Use useParams hook
import { InvoiceForm } from '@/components/invoice-form';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Invoice } from '@/app/invoices/page';
import { fetchInvoiceById } from '@/lib/fetch-invoice';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Define props for the page
interface EditInvoicePageProps {} // Params are now handled by the hook

export default function EditInvoicePage(props: EditInvoicePageProps) {
  const params = useParams<{ id: string }>(); // Use hook to get params
  const router = useRouter();
  const id = params.id;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      // Handle cases where ID might not be available initially (though usually it is)
      setIsLoading(false);
      setFetchError("Invoice ID is missing.");
      return;
    }

    const loadInvoice = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const fetchedInvoice = await fetchInvoiceById(id);
        if (!fetchedInvoice) {
          setFetchError("Invoice not found.");
          // Optionally redirect or show a not found message
          // Example: router.push('/404');
        } else {
          setInvoice(fetchedInvoice);
        }
      } catch (error: any) {
        setFetchError(error.message || "An unknown error occurred while loading the invoice data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [id, router]); // Add router to dependencies if used for redirection inside effect

  // Render loading state
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-8 bg-background">
         <Card className="w-full max-w-6xl shadow-lg border border-border rounded-xl overflow-hidden">
           <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4 border-b p-4 sm:p-6 bg-card">
             <div>
               <Skeleton className="h-6 w-48 mb-1 rounded" />
               <Skeleton className="h-4 w-64 rounded" />
             </div>
             <Skeleton className="h-9 w-40 rounded-md" />
           </CardHeader>
           <CardContent className="p-0">
               {/* Simplified skeleton for the form area */}
               <div className="p-6 space-y-6">
                   <Skeleton className="h-40 w-full rounded-md" />
                   <Skeleton className="h-60 w-full rounded-md" />
                   <Skeleton className="h-20 w-full rounded-md" />
                   <div className="flex justify-end space-x-2">
                       <Skeleton className="h-9 w-24 rounded-md" />
                       <Skeleton className="h-9 w-24 rounded-md" />
                       <Skeleton className="h-9 w-32 rounded-md" />
                   </div>
               </div>
           </CardContent>
         </Card>
      </main>
    );
  }

  // Render error state
  if (fetchError) {
    return (
       <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-12 lg:p-24 bg-background">
          <Card className="w-full max-w-md shadow-lg border-destructive">
             <CardHeader>
               <CardTitle className="text-center text-destructive text-xl">Error Loading Invoice</CardTitle>
             </CardHeader>
             <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">{fetchError}</p>
                 <Link href="/invoices" passHref>
                     <Button variant="outline">
                         <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
                     </Button>
                 </Link>
             </CardContent>
          </Card>
       </main>
    );
  }

  // Render form if data is loaded successfully
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-8 bg-background">
      <Card className="w-full max-w-6xl shadow-lg border border-border rounded-xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4 border-b p-4 sm:p-6 bg-card">
            <div>
                <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">Edit Invoice</CardTitle>
                 <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Update details for Invoice #{invoice?.invoiceNumber || '...'}
                 </CardDescription>
            </div>
          <Link href="/invoices" passHref>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
           {invoice ? (
              <InvoiceForm initialData={invoice} />
           ) : (
              // This case should ideally not be reached if loading/error states are handled
              <div className="p-6 text-center text-muted-foreground">Invoice data could not be loaded.</div>
           )}
        </CardContent>
      </Card>
    </main>
  );
}
