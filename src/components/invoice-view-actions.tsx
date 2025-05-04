
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
     // Use flex-col and full width on small screens, adjust gap
    <div className="flex flex-col sm:flex-row gap-1.5 w-full sm:w-auto items-stretch"> {/* Use items-stretch */}
      <Link href="/invoices" passHref legacyBehavior>
         {/* Smaller button size */}
        <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm h-7 sm:h-8">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back {/* Adjusted icon margin/size */}
        </Button>
      </Link>
       <Link href={`/invoices/${invoiceId}/edit`} passHref legacyBehavior>
         {/* Smaller button size */}
         <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm h-7 sm:h-8">
           <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit {/* Adjusted icon margin/size */}
         </Button>
       </Link>
       {/* Smaller button size */}
      <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm h-7 sm:h-8" onClick={handlePrint}>
        <Printer className="mr-1.5 h-3.5 w-3.5" /> Print {/* Adjusted icon margin/size */}
      </Button>
      {/* Future: Download button might require more complex client-side PDF generation logic */}
      {/* <Button variant="outline" size="sm" className="w-full sm:w-auto">
        <Download className="mr-2 h-4 w-4" /> Download PDF
      </Button> */}
    </div>
  );
}
