
import { InvoiceForm } from '@/components/invoice-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateInvoicePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-12 lg:p-24 bg-background">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2 border-b mb-4">
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">Create New Bill</CardTitle>
           <Link href="/invoices" passHref>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Render the form without initial data for creation */}
          <InvoiceForm />
        </CardContent>
      </Card>
    </main>
  );
}
