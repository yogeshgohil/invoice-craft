'use client'; // Ensure this is a Client Component

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
      // Handle cases where ID might not be available initially
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
        console.error("Error fetching invoice:", error); // Log the actual error
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
      <main className="flex min-h-screen flex-col items-center justify-start p-2 sm:p-4 bg-background"> {/* Reduced padding */}
         <Card className="w-full max-w-6xl shadow-lg border border-border rounded-xl overflow-hidden">
           <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-3 border-b p-3 sm:p-4 bg-card"> {/* Reduced padding */}
             <div>
               <Skeleton className="h-5 w-40 mb-1 rounded" /> {/* Adjusted size */}
               <Skeleton className="h-3 w-56 rounded" /> {/* Adjusted size */}
             </div>
             <Skeleton className="h-8 w-28 sm:w-36 rounded-md" /> {/* Adjusted size */}
           </CardHeader>
           <CardContent className="p-0">
               {/* Simplified skeleton for the form area */}
               <div className="p-4 space-y-4"> {/* Reduced padding/spacing */}
                   <Skeleton className="h-32 w-full rounded-md" />
                   <Skeleton className="h-48 w-full rounded-md" />
                   <Skeleton className="h-16 w-full rounded-md" />
                   <div className="flex flex-wrap justify-end gap-2">
                       <Skeleton className="h-8 w-20 rounded-md" /> {/* Adjusted size */}
                       <Skeleton className="h-8 w-20 rounded-md" />
                       <Skeleton className="h-8 w-28 rounded-md" />
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
    <main className="flex min-h-screen flex-col items-center justify-start p-2 sm:p-4 bg-background"> {/* Reduced padding */}
      <Card className="w-full max-w-6xl shadow-lg border border-border rounded-xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-3 border-b p-3 sm:p-4 bg-card"> {/* Reduced padding */}
            <div>
                <CardTitle className="text-base sm:text-lg font-semibold text-foreground">Edit Invoice</CardTitle> {/* Adjusted font size */}
                 <CardDescription className="text-[10px] sm:text-xs text-muted-foreground mt-0.5"> {/* Adjusted font size and margin */}
                    Update details for Invoice #{invoice?.invoiceNumber || '...'}
                 </CardDescription>
            </div>
          <Link href="/invoices" passHref>
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"> {/* Adjusted size */}
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Invoices {/* Adjusted icon margin/size */}
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
           {invoice ? (
              <InvoiceForm initialData={invoice} />
           ) : (
              // This case should ideally not be reached if loading/error states are handled
              <div className="p-4 text-center text-muted-foreground text-sm">Invoice data could not be loaded.</div>
           )}
        </CardContent>
      </Card>
    </main>
  );
}