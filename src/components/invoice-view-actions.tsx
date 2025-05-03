
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Edit } from 'lucide-react';

interface InvoiceViewActionsProps {
  invoiceId: string;
}

export function InvoiceViewActions({ invoiceId }: InvoiceViewActionsProps) {

  const handlePrint = () => {
    // Ensure this only runs on the client
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch"> {/* Use items-stretch */}
      <Link href="/invoices" passHref legacyBehavior>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </Link>
       <Link href={`/invoices/${invoiceId}/edit`} passHref legacyBehavior>
         <Button variant="outline" size="sm" className="w-full sm:w-auto">
           <Edit className="mr-2 h-4 w-4" /> Edit
         </Button>
       </Link>
      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" /> Print
      </Button>
      {/* Future: Download button might require more complex client-side PDF generation logic */}
      {/* <Button variant="outline" size="sm" className="w-full sm:w-auto">
        <Download className="mr-2 h-4 w-4" /> Download PDF
      </Button> */}
    </div>
  );
}
