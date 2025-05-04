
'use client';

import type { InvoiceFormData } from './invoice-form'; // Ensure this path is correct
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils'; // Import utility
import { Badge } from '@/components/ui/badge'; // Import Badge
import { format, parseISO } from 'date-fns'; // Import date-fns

interface InvoicePreviewProps {
  data: InvoiceFormData;
}

export function InvoicePreview({ data }: InvoicePreviewProps) {
  const calculateTotal = () => {
    return data.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
  };

  const totalAmount = calculateTotal();
  const paidAmount = data.paidAmount || 0; // Use default 0 if undefined
  const totalDue = totalAmount - paidAmount;


   // Helper function to format date (handles potential timezone issues and invalid dates)
   const formatDate = (dateString: string | undefined | Date): string => {
    if (!dateString) return 'N/A';
    try {
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
         if (isNaN(date.getTime())) { // Check if date is valid after ISO parsing
             // Fallback: try parsing YYYY-MM-DD, assuming UTC
             const manualDate = new Date(dateString + 'T00:00:00Z');
             if (isNaN(manualDate.getTime())) return 'Invalid Date';
             return format(manualDate, 'MMM d, yyyy'); // Format: Jul 15, 2024
         }
        return format(date, 'MMM d, yyyy'); // Format: Jul 15, 2024
    } catch (e) {
        return 'Invalid Date';
    }
   };

   // Helper function to get badge variant based on status
   const getStatusVariant = (status: InvoiceFormData['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
       switch (status) {
           case 'Completed':
               return 'default'; // Use primary color for completed
           case 'In Process':
               return 'secondary'; // Use secondary color
           case 'Pending':
           case 'Hold':
                // Use outline or a custom muted variant if desired
               return 'outline'; // Default outline for pending/hold
           case 'Cancelled':
               return 'destructive'; // Use destructive color for cancelled
           default:
               return 'outline';
       }
   };


  return (
     // Responsive container: Use max-width for large screens, allows shrinking on smaller.
     // Added print-specific styles via @media print in the style tag below.
    <div className="p-2 sm:p-4 md:p-6 bg-white text-black border border-gray-300 shadow-md rounded-md print-container max-w-4xl mx-auto print:max-w-full print:shadow-none print:border-none" style={{ fontFamily: 'Arial, sans-serif', boxSizing: 'border-box' }}> {/* Reduced padding */}
      {/* Invoice Header - Use flex-col on small screens */}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-3 sm:mb-4"> {/* Reduced margin */}
        <div className="mb-3 sm:mb-0"> {/* Reduced margin */}
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">INVOICE</h1> {/* Smaller text */}
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-600"># {data.invoiceNumber}</p> {/* Smaller text */}
           {/* Display Status Badge */}
          <div className="mt-1 sm:mt-1.5"> {/* Reduced margin */}
              <Badge variant={getStatusVariant(data.status)} className="text-[10px] px-1.5 py-0.5">{data.status}</Badge> {/* Adjusted badge size */}
          </div>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0">
           {/* Your Company Details */}
           <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-700">Mahakali Ariwork</h2> {/* Smaller text */}
           <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500">41, Panchavati Society, Bapasitaram Chowk,Kataragam, Surat.</p> {/* Smaller text */}
           <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500">your.email@example.com</p> {/* Smaller text */}
           <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500">8141437848</p> {/* Smaller text */}
        </div>
      </div>

      <Separator className="my-2 sm:my-3 md:my-4"/> {/* Reduced margin */}

      {/* Customer Info and Dates - Stack on small screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-6 mb-3 sm:mb-4"> {/* Reduced gap and margin */}
        <div>
          <h3 className="font-semibold text-xs sm:text-sm text-gray-700 mb-0.5">Bill To:</h3> {/* Smaller text, reduced margin */}
          <p className="font-medium text-xs sm:text-sm text-gray-800">{data.customerName}</p> {/* Smaller text */}
          {data.customerEmail && <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500">{data.customerEmail}</p>} {/* Smaller text */}
          {data.customerAddress && <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 whitespace-pre-line">{data.customerAddress}</p>} {/* Smaller text */}
        </div>
        <div className="text-left sm:text-right mt-2 sm:mt-0"> {/* Reduced margin */}
           <p className="text-[10px] sm:text-xs md:text-sm"><span className="font-semibold text-gray-700">Invoice Date:</span> {formatDate(data.invoiceDate)}</p> {/* Smaller text */}
           <p className="text-[10px] sm:text-xs md:text-sm"><span className="font-semibold text-gray-700">Due Date:</span> {formatDate(data.dueDate)}</p> {/* Smaller text */}
        </div>
      </div>

      {/* Items Table - Ensure overflow works on small screens */}
      <div className="overflow-x-auto mb-3 sm:mb-4"> {/* Reduced margin */}
          <Table className="min-w-full w-full text-[9px] sm:text-[10px] md:text-xs"> {/* Smaller Base text size */}
            <TableHeader className="bg-gray-100">
              <TableRow>
                {/* Adjust padding and font size */}
                <TableHead className="w-[40%] sm:w-[45%] font-semibold text-gray-700 px-1 py-1 sm:px-1.5 sm:py-1.5">Description</TableHead> {/* Reduced padding */}
                <TableHead className="text-right font-semibold text-gray-700 px-1 py-1 sm:px-1.5 sm:py-1.5">Qty</TableHead> {/* Reduced padding */}
                <TableHead className="text-right font-semibold text-gray-700 px-1 py-1 sm:px-1.5 sm:py-1.5">Unit Price</TableHead> {/* Reduced padding */}
                <TableHead className="text-right font-semibold text-gray-700 px-1 py-1 sm:px-1.5 sm:py-1.5">Amount</TableHead> {/* Reduced padding */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item, index) => (
                <TableRow key={index} className="border-b border-gray-200">
                  <TableCell className="font-medium py-1 px-1 sm:py-1.5 sm:px-1.5 text-gray-800 break-words">{item.description}</TableCell> {/* Reduced padding */}
                  <TableCell className="text-right py-1 px-1 sm:py-1.5 sm:px-1.5 text-gray-600">{item.quantity}</TableCell> {/* Reduced padding */}
                  <TableCell className="text-right py-1 px-1 sm:py-1.5 sm:px-1.5 text-gray-600">{formatCurrency(item.price)}</TableCell> {/* Reduced padding */}
                  <TableCell className="text-right py-1 px-1 sm:py-1.5 sm:px-1.5 text-gray-600">{formatCurrency((item.quantity || 0) * (item.price || 0))}</TableCell> {/* Reduced padding */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>

      {/* Totals Section - Stack nicely on smaller screens */}
      <div className="flex flex-col items-end mb-3 sm:mb-4"> {/* Reduced margin */}
        <div className="w-full max-w-[180px] sm:max-w-[200px] md:max-w-xs"> {/* Adjusted width */}
          <div className="flex justify-between py-0.5 sm:py-0.5 text-[10px] sm:text-xs"> {/* Reduced padding/size */}
            <span className="text-gray-600">Total Amount:</span>
            <span className="text-gray-800">{formatCurrency(totalAmount)}</span>
          </div>
           <div className="flex justify-between py-0.5 sm:py-0.5 text-[10px] sm:text-xs"> {/* Reduced padding/size */}
             <span className="text-gray-600">Amount Paid:</span>
             <span className="text-gray-800">{formatCurrency(paidAmount)}</span>
           </div>
          <Separator className="my-1 sm:my-1"/> {/* Reduced margin */}
          <div className="flex justify-between py-0.5 sm:py-0.5"> {/* Reduced padding */}
            <span className="font-bold text-gray-700 text-xs sm:text-sm md:text-base">Total Due:</span> {/* Smaller text */}
            <span className="font-bold text-gray-800 text-xs sm:text-sm md:text-base">{formatCurrency(totalDue)}</span> {/* Smaller text */}
          </div>
        </div>
      </div>

       {/* Notes */}
       {data.notes && (
        <div className="mt-3 sm:mt-4 pt-1.5 sm:pt-2 border-t border-gray-200"> {/* Reduced margin/padding */}
          <h4 className="font-semibold text-xs sm:text-sm text-gray-700 mb-0.5">Notes:</h4> {/* Smaller text, reduced margin */}
          <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 whitespace-pre-line break-words">{data.notes}</p> {/* Smaller text */}
        </div>
       )}

      {/* Footer */}
      <div className="mt-4 sm:mt-6 md:mt-8 text-center text-[9px] sm:text-[10px] text-gray-400"> {/* Reduced margin/size */}
        Thank you for your business!
      </div>
    </div>
  );
}

// Optional: Add CSS for printing if needed
const styles = `
@media print {
  body {
    -webkit-print-color-adjust: exact; /* Ensure colors print in Chrome/Safari */
    print-color-adjust: exact; /* Standard */
  }
  .print-container {
    position: static; /* Override fixed positioning for print */
    width: 100% !important; /* Ensure full width for print */
    min-height: auto !important;
    margin: 0 !important;
    padding: 0 !important; /* Adjust padding for print if needed */
    border: none !important;
    box-shadow: none !important;
    max-width: none !important; /* Remove max-width for print */
    font-size: 9pt; /* Adjust base font size for print */
  }
  .print-container h1 { font-size: 16pt; }
  .print-container h2 { font-size: 12pt; }
  .print-container h3 { font-size: 10pt; }
  .print-container p, .print-container span, .print-container div { font-size: 9pt; }
  .print-container .text-xs { font-size: 8pt; }
  .print-container .text-sm { font-size: 9pt; }
  .print-container .text-base { font-size: 10pt; }
  .print-container .text-lg { font-size: 11pt; }
  .print-container th, .print-container td { padding: 3px 5px; font-size: 8pt;} /* Smaller padding for print table */
  .print-container .overflow-x-auto { overflow: visible; } /* Prevent table cutoff */
  /* Force responsive classes for print if needed */
  .print-container .sm\\:flex-row { flex-direction: row !important; }
  .print-container .sm\\:text-right { text-align: right !important; }
  .print-container .sm\\:w-auto { width: auto !important; }
  .print-container .sm\\:mb-0 { margin-bottom: 0 !important; }
  .print-container .sm\\:mt-0 { margin-top: 0 !important; }

  @page {
    size: A4 portrait; /* Or letter */
    margin: 0.4in; /* Adjust margins for print */
  }
}
`;

// Inject print styles only on the client-side after mount
if (typeof window !== 'undefined') {
  // Ensure styles are not added multiple times
  if (!document.getElementById('print-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'print-styles';
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
  }
}


