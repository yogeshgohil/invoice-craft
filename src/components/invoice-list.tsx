
'use client';

// Removed useState import as it's no longer needed here

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
import { format, parseISO, isValid } from 'date-fns'; // Use date-fns for reliable formatting
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Trash2, Loader2 } from 'lucide-react'; // Import Eye, Trash2, Loader2 icons
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { useState } from 'react'; // Keep useState for isDeleting

interface InvoiceListProps {
  invoices: Invoice[];
  onInvoiceDeleted?: (invoiceId: string) => void; // Add callback prop
}

// Helper function to format date (handles potential timezone issues and invalid dates)
const formatDate = (dateString: string | undefined | Date): string => {
    if (!dateString) return 'N/A';
    try {
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
         if (!isValid(date)) { // Check if date is valid after ISO parsing
             const manualDate = new Date(dateString + 'T00:00:00Z');
             if (!isValid(manualDate)) return 'Invalid Date';
             return format(manualDate, 'MMM d, yyyy');
         }
        return format(date, 'MMM d, yyyy'); // Format: Jul 15, 2024
    } catch (e) {
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


export function InvoiceList({ invoices, onInvoiceDeleted }: InvoiceListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track deleting state for specific invoice
  const { toast } = useToast();

   const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => {
      setIsDeleting(invoiceId); // Show loading state on the specific delete button

      try {
          const response = await fetch(`/api/invoices/${invoiceId}`, {
              method: 'DELETE',
          });

          if (!response.ok) {
             let errorMsg = `Failed to delete invoice #${invoiceNumber}.`;
             try {
                 const errorData = await response.json();
                 errorMsg = errorData.message || `HTTP error! Status: ${response.status}`;
             } catch (e) {
                 errorMsg = `HTTP error deleting invoice ${invoiceId}! Status: ${response.status} ${response.statusText || ''}`.trim();
             }
             throw new Error(errorMsg);
          }

          toast({
              title: "Invoice Deleted",
              description: `Invoice #${invoiceNumber} has been successfully deleted.`,
              duration: 3000, // Shorter duration for success
          });

          // Call the callback function to update the parent component's state
          if (onInvoiceDeleted) {
              onInvoiceDeleted(invoiceId);
          }

      } catch (error: any) {
          console.error("Error deleting invoice:", error);
          toast({
              title: "Deletion Failed",
              description: error.message || `Could not delete invoice #${invoiceNumber}. Please try again.`,
              variant: "destructive",
          });
      } finally {
          setIsDeleting(null); // Stop loading state
      }
   };


  return (
    <div className="overflow-x-auto rounded-lg border"> {/* Added border and rounded corners */}
      <Table>
        <TableCaption className="text-xs py-3"> {/* Adjusted padding and size */}
            {invoices.length > 0 ? `Showing ${invoices.length} invoices.` : 'No invoices to display.'}
            {/* Removed total count as it's handled by pagination */}
        </TableCaption>
        <TableHeader>
          {/* Adjust table head padding and potentially hide columns on small screens if needed */}
           {/* Remove top border from header row as table has border */}
          <TableRow className="border-t-0 hover:bg-transparent">
             {/* Reduced padding, adjusted font size */}
            <TableHead className="w-[70px] p-1.5 sm:p-2 text-[10px] sm:text-xs text-muted-foreground">Inv #</TableHead>
            <TableHead className="p-1.5 sm:p-2 text-[10px] sm:text-xs text-muted-foreground">Customer</TableHead>
            {/* Hide some columns on very small screens if needed, example: <TableHead className="hidden sm:table-cell p-1.5 sm:p-2 text-[10px] sm:text-xs text-muted-foreground">Invoice Date</TableHead> */}
            <TableHead className="hidden sm:table-cell p-1.5 sm:p-2 text-[10px] sm:text-xs text-muted-foreground">Invoice Date</TableHead>
            <TableHead className="p-1.5 sm:p-2 text-[10px] sm:text-xs text-muted-foreground">Due Date</TableHead>
            <TableHead className="p-1.5 sm:p-2 text-[10px] sm:text-xs text-muted-foreground">Status</TableHead>
            <TableHead className="text-right p-1.5 sm:p-2 text-[10px] sm:text-xs text-muted-foreground">Total</TableHead>
            <TableHead className="text-right p-1.5 sm:p-2 text-[10px] sm:text-xs text-muted-foreground">Due</TableHead>
            <TableHead className="p-1.5 sm:p-2 text-[10px] sm:text-xs text-center text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
             // Use totalAmount from API if available, otherwise calculate
             const totalAmount = invoice.totalAmount ?? calculateTotalAmount(invoice.items);
             // Use totalDue from API if available, otherwise calculate
             const totalDue = invoice.totalDue ?? totalAmount - (invoice.paidAmount ?? 0);

             return (
              <TableRow key={invoice._id} className="hover:bg-muted/50 cursor-pointer"> {/* Added hover effect and cursor */}
                 {/* Adjust cell padding and font size */}
                <TableCell className="font-medium p-1.5 sm:p-2 text-[10px] sm:text-xs">{invoice.invoiceNumber}</TableCell>
                <TableCell className="p-1.5 sm:p-2 text-[10px] sm:text-xs truncate max-w-[100px] sm:max-w-[150px]">{invoice.customerName}</TableCell> {/* Truncate long names */}
                 {/* Hide some columns on very small screens if needed, example: <TableCell className="hidden sm:table-cell p-1.5 sm:p-2 text-[10px] sm:text-xs">{formatDate(invoice.invoiceDate)}</TableCell> */}
                 <TableCell className="hidden sm:table-cell p-1.5 sm:p-2 text-[10px] sm:text-xs">{formatDate(invoice.invoiceDate)}</TableCell>
                <TableCell className="p-1.5 sm:p-2 text-[10px] sm:text-xs">{formatDate(invoice.dueDate)}</TableCell>
                <TableCell className="p-1.5 sm:p-2 text-[10px] sm:text-xs">
                   {/* Adjusted badge padding */}
                  <Badge variant={getStatusVariant(invoice.status)} className="text-[9px] px-1 py-0.5 sm:px-1.5 sm:py-0.5">{invoice.status}</Badge>
                </TableCell>
                <TableCell className="text-right p-1.5 sm:p-2 text-[10px] sm:text-xs">{formatCurrency(totalAmount)}</TableCell>
                <TableCell className={cn("text-right font-semibold p-1.5 sm:p-2 text-[10px] sm:text-xs", totalDue > 0 ? "text-destructive" : "text-primary")}>
                  {formatCurrency(totalDue)}
                </TableCell>
                 <TableCell className="text-center p-1 sm:p-2 space-x-0.5 sm:space-x-1"> {/* Reduced padding and spacing */}
                     {/* View Button - Smaller size */}
                      <Link href={`/invoices/${invoice._id}/view`} passHref legacyBehavior>
                         <Button variant="ghost" size="icon" aria-label="View invoice" className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-foreground"> {/* Smaller button */}
                             <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {/* Smaller icon */}
                         </Button>
                     </Link>
                     {/* Edit Button - Smaller size */}
                     <Link href={`/invoices/${invoice._id}/edit`} passHref legacyBehavior>
                         <Button variant="ghost" size="icon" aria-label="Edit invoice" className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-foreground"> {/* Smaller button */}
                             <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {/* Smaller icon */}
                         </Button>
                     </Link>
                      {/* Delete Button - Use AlertDialog for confirmation */}
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                           <Button
                             variant="ghost"
                             size="icon"
                             aria-label="Delete invoice"
                             className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-destructive"
                             disabled={isDeleting === invoice._id} // Disable while deleting this specific invoice
                           >
                             {isDeleting === invoice._id ? (
                               <Loader2 className="h-3.5 w-3.5 animate-spin" />
                             ) : (
                               <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                             )}
                           </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                         <AlertDialogHeader>
                           <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                           <AlertDialogDescription>
                             This action cannot be undone. This will permanently delete invoice
                             <strong className="mx-1">{invoice.invoiceNumber}</strong>
                             for customer <strong className="mx-1">{invoice.customerName}</strong>.
                           </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel>Cancel</AlertDialogCancel>
                           <AlertDialogAction
                              onClick={() => handleDeleteInvoice(invoice._id, invoice.invoiceNumber)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90" // Destructive action style
                            >
                             Delete
                           </AlertDialogAction>
                         </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
                 </TableCell>
              </TableRow>
             );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
