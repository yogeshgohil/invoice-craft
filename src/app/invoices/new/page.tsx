
'use client'; // Add 'use client' because InvoiceForm is a client component

import { InvoiceForm } from '@/components/invoice-form';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateInvoicePage() {
  return (
     // Reduced padding for mobile view
     // Removed justify-start
    <main className="flex min-h-screen flex-col items-center p-2 sm:p-4 bg-background">
       <Card className="w-full max-w-6xl shadow-lg border border-border rounded-xl overflow-hidden"> {/* Rounded Card */}
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-3 border-b p-3 sm:p-4 bg-card"> {/* Reduced padding */}
           <div> {/* Group title and description */}
               <CardTitle className="text-base sm:text-lg font-semibold text-foreground">Create New Bill</CardTitle> {/* Adjusted font size */}
                <CardDescription className="text-[10px] sm:text-xs text-muted-foreground mt-0.5"> {/* Adjusted font size and margin */}
                   Fill in the details below to generate a new invoice.
                </CardDescription>
           </div>
           <Link href="/invoices" passHref>
             {/* Adjusted button size */}
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Invoices {/* Adjusted icon margin/size */}
            </Button>
          </Link>
        </CardHeader>
         {/* Remove CardContent padding as InvoiceForm now handles internal padding */}
        <CardContent className="p-0">
          {/* Render the form without initial data for creation */}
          <InvoiceForm />
        </CardContent>
      </Card>
    </main>
  );
}
