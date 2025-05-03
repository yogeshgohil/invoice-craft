
'use client'; // Convert to Client Component

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Use hook for params
import { InvoicePreview } from '@/components/invoice-preview';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Invoice } from '@/app/invoices/page';
import { fetchInvoiceById } from '@/lib/fetch-invoice';
import { InvoiceViewActions } from '@/components/invoice-view-actions';
import { Button } from '@/components/ui/button'; // Import Button
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { ArrowLeft } from 'lucide-react'; // Import icon
import Link from 'next/link'; // Import Link

// Define props for the page
interface ViewInvoicePageProps {} // Params are now handled by the hook

export default function ViewInvoicePage(props: ViewInvoicePageProps) {
  const params = useParams<{ id: string }>(); // Use hook to get params
  const router = useRouter();
  const id = params.id;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
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
        console.error(`Error fetching invoice ${id} for view page:`, error);
        setFetchError(error.message || "An unknown error occurred while loading the invoice data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [id, router]); // Add router to dependencies if used inside effect

  // Render loading state
  if (isLoading) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-8 bg-background print:bg-white print:p-0">
           <Card className="w-full max-w-4xl shadow-lg print:shadow-none print:border-none">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2 border-b mb-4 print:hidden">
                   <Skeleton className="h-7 w-48 rounded" />
                   <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                       <Skeleton className="h-9 w-full sm:w-24 rounded-md" />
                       <Skeleton className="h-9 w-full sm:w-24 rounded-md" />
                       <Skeleton className="h-9 w-full sm:w-24 rounded-md" />
                   </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 print:p-0">
                   {/* Skeleton for Invoice Preview */}
                   <div className="animate-pulse space-y-6 p-4 sm:p-6">
                       <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
                         <div className="mb-4 sm:mb-0">
                           <Skeleton className="h-8 w-32 mb-2" />
                           <Skeleton className="h-4 w-24 mb-2" />
                           <Skeleton className="h-6 w-20" />
                         </div>
                         <div className="text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0">
                           <Skeleton className="h-6 w-40 mb-1" />
                           <Skeleton className="h-4 w-48 mb-1" />
                           <Skeleton className="h-4 w-40 mb-1" />
                           <Skeleton className="h-4 w-32" />
                         </div>
                       </div>
                       <Skeleton className="h-px w-full my-6" />
                        {/* ... add more skeleton parts mirroring InvoicePreview structure ... */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
                           <div>
                             <Skeleton className="h-5 w-20 mb-2" />
                             <Skeleton className="h-5 w-36 mb-1" />
                             <Skeleton className="h-4 w-48 mb-1" />
                             <Skeleton className="h-4 w-40" />
                           </div>
                           <div className="text-left sm:text-right mt-3 sm:mt-0">
                             <Skeleton className="h-5 w-40 mb-1" />
                             <Skeleton className="h-5 w-40" />
                           </div>
                         </div>
                         <div className="mb-6">
                           <Skeleton className="h-10 w-full rounded-t-md" />
                           <div className="border border-t-0 rounded-b-md p-2 space-y-2">
                             <Skeleton className="h-8 w-full" />
                             <Skeleton className="h-8 w-full" />
                           </div>
                         </div>
                         <div className="flex flex-col items-end mb-6">
                           <Skeleton className="h-20 w-1/2 max-w-sm" />
                         </div>
                         <Skeleton className="h-16 w-full" />
                         <Skeleton className="h-4 w-32 mx-auto mt-12" />
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

  // Render invoice preview if loaded
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-8 bg-background print:bg-white print:p-0">
      <Card className="w-full max-w-4xl shadow-lg print:shadow-none print:border-none">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2 border-b mb-4 print:hidden">
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">View Invoice #{invoice?.invoiceNumber || '...'}</CardTitle>
          {/* Pass invoiceId to actions */}
          {invoice?._id && <InvoiceViewActions invoiceId={invoice._id} />}
        </CardHeader>
        <CardContent className="p-0 sm:p-6 print:p-0">
          {invoice ? (
            <InvoicePreview data={{
              ...invoice,
              // Ensure dates are passed as strings if they are Dates
              invoiceDate: typeof invoice.invoiceDate === 'string' ? invoice.invoiceDate.substring(0, 10) : invoice.invoiceDate.toISOString().substring(0, 10),
              dueDate: typeof invoice.dueDate === 'string' ? invoice.dueDate.substring(0, 10) : invoice.dueDate.toISOString().substring(0, 10),
              // Provide fallbacks for totals if needed
              totalAmount: invoice.totalAmount ?? invoice.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0),
              totalDue: invoice.totalDue ?? invoice.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0) - (invoice.paidAmount || 0)
            }} />
          ) : (
             // This case should ideally not be reached
             <div className="p-6 text-center text-muted-foreground">Invoice data could not be displayed.</div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
