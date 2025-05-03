
import { InvoicePreview } from '@/components/invoice-preview';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Invoice } from '@/app/invoices/page'; // Import the full Invoice type
import { fetchInvoiceById } from '@/lib/fetch-invoice'; // Refactor fetch logic
import { InvoiceViewActions } from '@/components/invoice-view-actions'; // Import the new client component
import { notFound } from 'next/navigation'; // Import notFound

// Define props for the page, including params for the ID
interface ViewInvoicePageProps {
  params: { id: string };
}


export default async function ViewInvoicePage({ params }: ViewInvoicePageProps) {
  const { id } = params;
  let invoice: Invoice | null = null;
  let fetchError: string | null = null;

  try {
    invoice = await fetchInvoiceById(id);
  } catch (error: any) {
    console.error(`Error fetching invoice ${id} for view page:`, error);
    // Capture the specific error message from the fetch function
    fetchError = error.message || "An unknown error occurred while loading the invoice data.";
  }

  // If fetchInvoiceById returned null, it means the invoice wasn't found (404)
  if (!invoice && !fetchError) {
      notFound(); // Use Next.js notFound() for clearer 404 handling
  }

  // If there was a fetch error (other than 404), throw it to trigger error.tsx
  if (fetchError) {
     throw new Error(fetchError); // Propagate the specific fetch error
  }

  // If invoice is somehow still null here (shouldn't happen if logic above is correct), treat as not found
  if (!invoice) {
      console.error(`Invoice ${id} was unexpectedly null after fetch attempt without explicit error.`);
      notFound();
  }

  // Render the invoice preview
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-8 bg-background print:bg-white print:p-0">
      <Card className="w-full max-w-4xl shadow-lg print:shadow-none print:border-none">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2 border-b mb-4 print:hidden">
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">View Invoice #{invoice.invoiceNumber}</CardTitle>
           {/* Use the new client component for actions */}
           <InvoiceViewActions invoiceId={invoice._id} />
        </CardHeader>
        <CardContent className="p-0 sm:p-6 print:p-0">
          {/* Pass calculated totals if not present in invoice data */}
          <InvoicePreview data={{
              ...invoice,
              // Ensure dates are passed as strings if they are Dates, InvoicePreview expects string dates
              invoiceDate: typeof invoice.invoiceDate === 'string' ? invoice.invoiceDate.substring(0, 10) : invoice.invoiceDate.toISOString().substring(0, 10),
              dueDate: typeof invoice.dueDate === 'string' ? invoice.dueDate.substring(0, 10) : invoice.dueDate.toISOString().substring(0, 10),
              // Calculate fallbacks for totals if necessary
              totalAmount: invoice.totalAmount ?? invoice.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0),
              totalDue: invoice.totalDue ?? invoice.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0) - (invoice.paidAmount || 0)
          }} />
        </CardContent>
      </Card>
    </main>
  );
}
