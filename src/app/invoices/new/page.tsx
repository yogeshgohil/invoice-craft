
'use client'; // Add 'use client' because InvoiceForm is a client component

import { InvoiceForm } from '@/components/invoice-form';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateInvoicePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-8 bg-background">
       <Card className="w-full max-w-6xl shadow-lg border border-border rounded-xl overflow-hidden"> {/* Rounded Card */}
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4 border-b p-4 sm:p-6 bg-card">
           <div> {/* Group title and description */}
               <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">Create New Bill</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                   Fill in the details below to generate a new invoice.
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
          {/* Render the form without initial data for creation */}
          <InvoiceForm />
        </CardContent>
      </Card>
    </main>
  );
}
