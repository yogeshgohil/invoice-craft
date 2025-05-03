
'use client';

import type { Invoice } from '@/app/invoices/page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import { format, parseISO, isToday, isValid } from 'date-fns';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface InvoiceGridProps {
  initialInvoices: Invoice[];
}

// Define the order of statuses for the Kanban board, adding "Due Today"
const statusOrder: (Invoice['status'] | 'Due Today')[] = ["Due Today", "Pending", "In Process", "Hold", "Completed", "Cancelled"];

// Helper function to parse date safely
const parseDateSafe = (dateString: string | undefined | Date): Date | null => {
    if (!dateString) return null;
    try {
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        // Check if parsing resulted in a valid date
        if (!isValid(date)) {
            // Fallback: try parsing YYYY-MM-DD assuming UTC if ISO fails
            const manualDate = new Date(dateString + 'T00:00:00Z');
            return isValid(manualDate) ? manualDate : null;
        }
        return date;
    } catch (e) {
        console.error("Error parsing date:", dateString, e);
        return null;
    }
};


// Helper function to format date
const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    try {
        return format(date, 'MMM d, yyyy'); // Format as 'Jul 15, 2024'
    } catch (e) {
        console.error("Error formatting date:", date, e);
        return 'Invalid Date';
    }
};

// Helper function to check if a date is today
const isDateToday = (date: Date | null): boolean => {
    return date ? isToday(date) : false;
};


// Helper function to get badge variant based on status or special column
 const getStatusVariant = (status: Invoice['status'] | 'Due Today'): 'default' | 'secondary' | 'destructive' | 'outline' => {
     switch (status) {
         case 'Due Today':
            return 'secondary'; // Use secondary for attention
         case 'Completed':
             return 'default'; // Primary (e.g., green/blue)
         case 'In Process':
             return 'secondary'; // Secondary (e.g., yellow/orange)
         case 'Pending':
         case 'Hold':
             return 'outline'; // Outline (e.g., gray)
         case 'Cancelled':
             return 'destructive'; // Destructive (e.g., red)
         default:
             return 'outline';
     }
 };

 // Calculate total amount if not provided by API (fallback)
 const calculateTotalAmount = (items: Invoice['items']) => {
   return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
 };

 // Type for grouped invoices, including 'Due Today'
type GroupedInvoices = { [key in Invoice['status'] | 'Due Today']?: Invoice[] };

export function InvoiceGrid({ initialInvoices }: InvoiceGridProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [groupedInvoices, setGroupedInvoices] = useState<GroupedInvoices>({});
  const [isDragging, setIsDragging] = useState(false); // Track dragging state
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // Track which card is updating
  const { toast } = useToast();

  useEffect(() => {
    setInvoices(initialInvoices); // Update local state if initial props change
  }, [initialInvoices]);


  useEffect(() => {
    // Group invoices whenever the local 'invoices' state changes
    const dueTodayInvoices: Invoice[] = [];
    const otherInvoices: Invoice[] = [];

    invoices.forEach(invoice => {
        const parsedDueDate = parseDateSafe(invoice.dueDate);
        if (isDateToday(parsedDueDate)) {
            dueTodayInvoices.push(invoice);
        } else {
            otherInvoices.push(invoice);
        }
    });

    const groups = otherInvoices.reduce((acc, invoice) => {
        const status = invoice.status;
        if (!acc[status]) {
        acc[status] = [];
        }
        acc[status].push(invoice);
        return acc;
    }, {} as Record<Invoice['status'], Invoice[]>);

     // Combine due today and status groups
     setGroupedInvoices({
        'Due Today': dueTodayInvoices,
        ...groups
     });

  }, [invoices]); // Depend on the local 'invoices' state

    const handleDragEnd = async (result: DropResult) => {
        setIsDragging(false); // Reset dragging state
        const { source, destination, draggableId } = result;

        // Dropped outside the list or into the "Due Today" column
        if (!destination || destination.droppableId === 'Due Today') {
            return;
        }

        const sourceStatus = source.droppableId as Invoice['status'] | 'Due Today';
        const destinationStatus = destination.droppableId as Invoice['status']; // Cannot drop into "Due Today"

        // If dropped in the same place or trying to drop into "Due Today"
        if (sourceStatus === destinationStatus && source.index === destination.index) {
            return;
        }

        // Optimistic UI update
        const updatedInvoices = Array.from(invoices);
        const movedInvoiceIndex = updatedInvoices.findIndex(inv => inv._id === draggableId);

        if (movedInvoiceIndex === -1) return; // Invoice not found

        const [movedInvoice] = updatedInvoices.splice(movedInvoiceIndex, 1);
        const updatedMovedInvoice = { ...movedInvoice, status: destinationStatus };

        // Find the correct index in the destination column based on existing sorting (e.g., date)
        // For simplicity, we'll just add it to the end for now. A more robust solution
        // would re-calculate the destination index based on sorting.
        updatedInvoices.push(updatedMovedInvoice); // Re-add with updated status
        setInvoices(updatedInvoices); // Update local state optimistically

        setIsUpdating(draggableId); // Start loading indicator for the card

        // API Call to update the status
        try {
             const response = await fetch(`/api/invoices/${draggableId}`, {
                 method: 'PATCH',
                 headers: {
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({ status: destinationStatus }),
             });

             if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update invoice status');
             }

            // If API call is successful, the optimistic update is already done.
             toast({
                title: "Status Updated",
                description: `Invoice ${movedInvoice.invoiceNumber} moved to ${destinationStatus}.`,
             });

         } catch (error: any) {
             console.error("Failed to update invoice status:", error);
             toast({
                title: "Update Failed",
                description: `Could not update status: ${error.message}`,
                variant: "destructive",
             });
             // Revert the optimistic update if API call fails
             setInvoices(initialInvoices); // Or revert to the state before drag
         } finally {
            setIsUpdating(null); // Stop loading indicator
         }
    };

    const handleDragStart = () => {
        setIsDragging(true); // Set dragging state
    };


  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <div className={cn(
          "flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-muted",
          isDragging && "cursor-grabbing" // Add grabbing cursor style when dragging
      )}>
        {statusOrder.map((status) => (
          <Droppable key={status} droppableId={status} isDropDisabled={status === 'Due Today'}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                // Adjust width: wider on mobile, standard on larger screens
                className={cn(
                  "flex flex-col gap-4 flex-shrink-0 w-64 sm:w-72 md:w-80 rounded-lg", // Adjusted width
                  "bg-muted/50", // Light background for the column itself
                  snapshot.isDraggingOver && status !== 'Due Today' && "bg-primary/10 ring-2 ring-primary/50", // Highlight when dragging over valid column
                  status === 'Due Today' ? "border-dashed border-2 border-amber-500/50 bg-amber-500/5" : "border border-transparent" // Style "Due Today" column differently
                )}
              >
                {/* Column Header - Remains sticky */}
                <div className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-t-md sticky top-0 z-10 shadow-sm",
                     status === 'Due Today' ? "bg-amber-500/10" : "bg-muted" // Header background matches column style
                    )}>
                  <h3 className={cn(
                      "font-semibold text-xs sm:text-sm capitalize", // Smaller text on mobile
                      status === 'Due Today' ? "text-amber-700" : "text-muted-foreground"
                    )}>
                    {status} {status === 'Due Today' && <Badge variant="secondary" className='ml-1 text-xs px-1 py-0 sm:px-1.5'>Dynamic</Badge>}
                  </h3>
                  <Badge variant={getStatusVariant(status)} className="text-xs px-1.5 py-0 sm:px-2 sm:py-0.5">
                    {groupedInvoices[status]?.length || 0}
                  </Badge>
                </div>

                {/* Invoice Cards Container - Scrolls vertically */}
                <div className={cn(
                    "flex flex-col gap-3 sm:gap-4 overflow-y-auto flex-grow min-h-[150px] sm:min-h-[200px] max-h-[calc(100vh-250px)] p-2 rounded-b-md scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-muted", // Adjusted gap and min-height
                    isDragging && "select-none" // Prevent text selection during drag
                 )}>
                  {(groupedInvoices[status] || []).length > 0 ? (
                    (groupedInvoices[status] || [])
                       // Sort by invoice date descending within column (optional, consider performance)
                      .sort((a, b) => {
                         const dateA = parseDateSafe(a.invoiceDate);
                         const dateB = parseDateSafe(b.invoiceDate);
                         if (!dateA && !dateB) return 0;
                         if (!dateA) return 1; // Place invoices with invalid dates at the end
                         if (!dateB) return -1;
                         return dateB.getTime() - dateA.getTime();
                       })
                      .map((invoice, index) => {
                        const totalAmount = invoice.totalAmount ?? calculateTotalAmount(invoice.items);
                        const totalDue = invoice.totalDue ?? totalAmount - (invoice.paidAmount ?? 0);
                        const parsedInvoiceDate = parseDateSafe(invoice.invoiceDate);
                        const parsedDueDate = parseDateSafe(invoice.dueDate);
                        const isDue = isDateToday(parsedDueDate);

                        return (
                          <Draggable key={invoice._id} draggableId={invoice._id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                    ...provided.draggableProps.style,
                                }}
                                className={cn(
                                    "outline-none", // Remove default outline
                                    snapshot.isDragging && "ring-2 ring-primary shadow-lg", // Style when dragging
                                )}
                              >
                                <Card
                                  className={cn(
                                    "shadow-sm hover:shadow-md transition-shadow duration-200 flex-shrink-0 bg-card relative", // Ensure card background and relative positioning for loader
                                    isDragging && "cursor-grabbing", // Cursor style for the card itself
                                    isUpdating === invoice._id && "opacity-70 pointer-events-none" // Style for updating state
                                  )}
                                >
                                   {isUpdating === invoice._id && (
                                       <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-20 rounded-md">
                                           <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
                                       </div>
                                   )}
                                  <CardHeader className="p-2 sm:p-3 pb-1">
                                    <CardTitle className="text-xs sm:text-sm font-semibold flex justify-between items-center">
                                      <span>{invoice.invoiceNumber}</span>
                                      <Badge variant={getStatusVariant(invoice.status)} className="text-[10px] sm:text-xs font-normal ml-2 capitalize px-1 sm:px-1.5 py-0.5">
                                        {invoice.status}
                                      </Badge>
                                    </CardTitle>
                                    <CardDescription className="text-[10px] sm:text-xs text-muted-foreground pt-0.5 sm:pt-1 truncate">
                                      {invoice.customerName}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="p-2 sm:p-3 text-[10px] sm:text-xs space-y-0.5 sm:space-y-1">
                                    <p><span className="text-muted-foreground">Inv:</span> {formatDate(parsedInvoiceDate)}</p>
                                    <p className={cn(isDue && "text-amber-700 font-medium")}><span className="text-muted-foreground">Due:</span> {formatDate(parsedDueDate)}</p>
                                  </CardContent>
                                  <CardFooter className="p-2 sm:p-3 pt-1 flex justify-between items-center text-[10px] sm:text-xs border-t mt-1 sm:mt-2">
                                    <span className="text-muted-foreground">Total: {formatCurrency(totalAmount)}</span>
                                    <span className={cn("font-semibold", totalDue > 0 ? "text-destructive" : "text-primary")}>
                                      Due: {formatCurrency(totalDue)}
                                    </span>
                                  </CardFooter>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        );
                      })
                  ) : (
                    // Placeholder for empty columns
                    <div className="text-center text-xs text-muted-foreground mt-4 p-4 border border-dashed rounded-md h-20 sm:h-24 flex items-center justify-center">
                      No invoices
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
