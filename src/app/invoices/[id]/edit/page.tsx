
import { InvoiceForm } from '@/components/invoice-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2 border-b mb-4">
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">Edit Invoice #{invoice.invoiceNumber}</CardTitle>
          <Link href="/invoices" passHref>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
           {/* Ensure the initial data passed to the form is compatible */}
           {/* InvoiceForm expects dates as YYYY-MM-DD strings */}
          <InvoiceForm initialData={invoice} />
        </CardContent>
      </Card>
    </main>
  );
}
