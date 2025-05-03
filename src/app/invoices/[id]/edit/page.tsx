import { InvoiceForm } from '@/components/invoice-form';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Invoice } from '@/app/invoices/page'; // Import the full Invoice type
import { fetchInvoiceById } from '@/lib/fetch-invoice'; // Import the refactored fetch function

// Define props for the page, including params for the ID
interface EditInvoicePageProps {
  params: { id: string };
}


export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id } = params;
  let invoice: Invoice | null = null;
  let fetchError: string | null = null;

  try {
    invoice = await fetchInvoiceById(id);
  } catch (error: any) {
    console.error("Error fetching invoice for edit page:", error);
    fetchError = error.message || "An unknown error occurred while loading the invoice data.";
  }

  if (fetchError) {
    // Display a user-friendly error message (uses the new ErrorDisplay component implicitly via error.tsx)
    // Throwing the error will automatically be caught by the nearest error.tsx boundary
     throw new Error(fetchError);
  }

  if (!invoice) {
    // Handle case where invoice is not found (e.g., invalid ID)
    // This scenario should ideally be caught by the API returning 404,
    // which fetchInvoiceById translates to returning null.
     throw new Error("Invoice not found."); // Throw error to be caught by error.tsx
  }

  // Render the form with initial data
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-8 bg-background">
      {/* Use a Card for consistent container style */}
      <Card className="w-full max-w-6xl shadow-lg border border-border rounded-xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4 border-b p-4 sm:p-6 bg-card">
            <div> {/* Group title and description */}
                <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">Edit Invoice</CardTitle>
                 <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Update details for Invoice #{invoice.invoiceNumber}
                 </CardDescription>
            </div>
          <Link href="/invoices" passHref>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
            </Button>
          </Link>
        </CardHeader>
         {/* Remove CardContent padding as InvoiceForm now handles internal padding */}
        <CardContent className="p-0">
           {/* Ensure the initial data passed to the form is compatible */}
           {/* InvoiceForm expects dates as YYYY-MM-DD strings */}
          <InvoiceForm initialData={invoice} />
        </CardContent>
      </Card>
    </main>
  );
}
