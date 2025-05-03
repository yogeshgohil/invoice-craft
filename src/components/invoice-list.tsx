
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import type { Invoice } from '@/app/invoices/page'; // Import the Invoice type from page.tsx
import { format, parseISO } from 'date-fns'; // Use date-fns for reliable formatting
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Edit, Eye } from 'lucide-react'; // Import Eye icon

interface InvoiceListProps {
  invoices: Invoice[];
}

// Helper function to format date (handles potential timezone issues and invalid dates)
const formatDate = (dateString: string | undefined | Date): string => {
    if (!dateString) return 'N/A';
    try {
        // Prefer parsing ISO string if available, otherwise treat as Date object or YYYY-MM-DD string
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
         if (isNaN(date.getTime())) { // Check if date is valid after ISO parsing
            // Fallback: try parsing YYYY-MM-DD, assuming UTC
             const manualDate = new Date(dateString + 'T00:00:00Z');
             if (isNaN(manualDate.getTime())) return 'Invalid Date';
             return format(manualDate, 'MMM d, yyyy'); // Format: Jul 15, 2024
         }
        return format(date, 'MMM d, yyyy'); // Format: Jul 15, 2024
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
    }
};

// Helper function to get badge variant based on status
 const getStatusVariant = (status: Invoice['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
     switch (status) {
         case 'Completed':
             return 'default'; // Use primary color (often green/blue in themes)
         case 'In Process':
             return 'secondary'; // Use secondary color (often yellow/orange)
         case 'Pending':
         case 'Hold':
             return 'outline'; // Default outline (often gray/neutral)
         case 'Cancelled':
             return 'destructive'; // Use destructive color (often red)
         default:
             return 'outline'; // Fallback
     }
 };

 // Calculate total amount if not provided by API (fallback)
 const calculateTotalAmount = (items: Invoice['items']) => {
   return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
 };


export function InvoiceList({ invoices }: InvoiceListProps) {

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption className="text-xs sm:text-sm">A list of your invoices {invoices.length > 0 ? `(${invoices.length} found)` : ''}.</TableCaption>
        <TableHeader>
          {/* Adjust table head padding and potentially hide columns on small screens if needed */}
          <TableRow>
            <TableHead className="w-[80px] sm:w-[100px] p-2 sm:p-4 text-xs sm:text-sm">Invoice #</TableHead>
            <TableHead className="p-2 sm:p-4 text-xs sm:text-sm">Customer</TableHead>
            <TableHead className="p-2 sm:p-4 text-xs sm:text-sm">Invoice Date</TableHead>
            <TableHead className="p-2 sm:p-4 text-xs sm:text-sm">Due Date</TableHead>
            <TableHead className="p-2 sm:p-4 text-xs sm:text-sm">Status</TableHead>
            <TableHead className="text-right p-2 sm:p-4 text-xs sm:text-sm">Total Amount</TableHead>
            <TableHead className="text-right p-2 sm:p-4 text-xs sm:text-sm">Amount Due</TableHead>
            <TableHead className="p-2 sm:p-4 text-xs sm:text-sm text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
             // Use totalAmount from API if available, otherwise calculate
             const totalAmount = invoice.totalAmount ?? calculateTotalAmount(invoice.items);
             // Use totalDue from API if available, otherwise calculate
             const totalDue = invoice.totalDue ?? totalAmount - (invoice.paidAmount ?? 0);

             return (
              <TableRow key={invoice._id}>
                 {/* Adjust cell padding and font size */}
                <TableCell className="font-medium p-2 sm:p-4 text-xs sm:text-sm">{invoice.invoiceNumber}</TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">{invoice.customerName}</TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">{formatDate(invoice.invoiceDate)}</TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">{formatDate(invoice.dueDate)}</TableCell>
                <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                  <Badge variant={getStatusVariant(invoice.status)} className="text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-0.5">{invoice.status}</Badge>
                </TableCell>
                <TableCell className="text-right p-2 sm:p-4 text-xs sm:text-sm">{formatCurrency(totalAmount)}</TableCell>
                <TableCell className={cn("text-right font-semibold p-2 sm:p-4 text-xs sm:text-sm", totalDue > 0 ? "text-destructive" : "text-primary")}>
                  {formatCurrency(totalDue)}
                </TableCell>
                 <TableCell className="text-center p-2 sm:p-4 space-x-1 sm:space-x-2">
                     {/* View Button */}
                      <Link href={`/invoices/${invoice._id}/view`} passHref legacyBehavior>
                         <Button variant="ghost" size="icon" aria-label="View invoice" className="h-7 w-7 sm:h-8 sm:w-8">
                             <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                         </Button>
                     </Link>
                     {/* Edit Button */}
                     <Link href={`/invoices/${invoice._id}/edit`} passHref legacyBehavior>
                         <Button variant="ghost" size="icon" aria-label="Edit invoice" className="h-7 w-7 sm:h-8 sm:w-8">
                             <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                         </Button>
                     </Link>
                 </TableCell>
              </TableRow>
             );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
