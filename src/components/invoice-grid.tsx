
'use client';

import type { Invoice } from '@/app/invoices/page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import { format, parseISO, isToday, isValid } from 'date-fns';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, GripVertical } from 'lucide-react'; // Added GripVertical for drag handle hint

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
        return null;
    }
};


// Helper function to format date
const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    try {
        return format(date, 'MMM d, yyyy'); // Format as 'Jul 15, 2024'
    } catch (e) {
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
            return 'secondary'; // Use secondary for attention (e.g., yellow/orange)
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
       {/* Reduced gap for mobile, slightly decreased column width */}
      <div className={cn(
          "flex gap-3 md:gap-4 lg:gap-5 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-muted-foreground/40 scrollbar-track-background",
          isDragging && "cursor-grabbing"
      )}>
        {statusOrder.map((status) => (
          <Droppable key={status} droppableId={status} isDropDisabled={status === 'Due Today'}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                // Adjust width and background for mobile
                className={cn(
                  "flex flex-col gap-3 flex-shrink-0 w-52 sm:w-56 md:w-64 rounded-lg", // Smaller width for mobile
                  "bg-secondary/50",
                  snapshot.isDraggingOver && status !== 'Due Today' && "bg-primary/10 ring-1 ring-primary/30",
                  status === 'Due Today' ? "border border-dashed border-secondary bg-secondary/20" : "border border-transparent"
                )}
              >
                {/* Column Header - Remains sticky, adjusted padding */}
                <div className={cn(
                    "flex items-center justify-between px-2 py-1.5 rounded-t-md sticky top-0 z-10 border-b", // Reduced padding
                     status === 'Due Today' ? "bg-secondary/40" : "bg-secondary/80"
                    )}>
                   <div className="flex items-center gap-1"> {/* Reduced gap */}
                       {status !== 'Due Today' && <GripVertical className="h-3 w-3 text-muted-foreground/50" />} {/* Smaller icon */}
                       <h3 className={cn(
                         "font-medium text-[10px] sm:text-xs capitalize", // Smaller font size
                         status === 'Due Today' ? "text-secondary-foreground" : "text-muted-foreground"
                       )}>
                         {status} {status === 'Due Today' && <Badge variant="secondary" className='ml-1 text-[9px] px-1 py-0'>Dynamic</Badge>} {/* Smaller badge */}
                       </h3>
                   </div>
                  {/* Smaller badge */}
                  <Badge variant={getStatusVariant(status)} className="text-[9px] px-1 py-0 sm:px-1.5 shadow-sm">
                    {groupedInvoices[status]?.length || 0}
                  </Badge>
                </div>

                {/* Invoice Cards Container - Scrolls vertically, adjusted gap/padding */}
                <div className={cn(
                    "flex flex-col gap-2 sm:gap-2.5 overflow-y-auto flex-grow min-h-[120px] sm:min-h-[150px] max-h-[calc(100vh-200px)] p-1.5 rounded-b-md scrollbar-thin scrollbar-thumb-muted-foreground/40 scrollbar-track-background", // Reduced gap/padding
                    isDragging && "select-none"
                 )}>
                  {(groupedInvoices[status] || []).length > 0 ? (
                    (groupedInvoices[status] || [])
                      .sort((a, b) => {
                         const dateA = parseDateSafe(a.invoiceDate);
                         const dateB = parseDateSafe(b.invoiceDate);
                         if (!dateA && !dateB) return 0;
                         if (!dateA) return 1;
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
                          <Draggable key={invoice._id} draggableId={invoice._id} index={index} isDragDisabled={status === 'Due Today'}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                    ...provided.draggableProps.style,
                                }}
                                className={cn(
                                    "outline-none",
                                    snapshot.isDragging && "ring-2 ring-primary shadow-xl rounded-lg",
                                    status === 'Due Today' && "opacity-80 cursor-not-allowed"
                                )}
                              >
                                <Card
                                  className={cn(
                                    "shadow-sm hover:shadow-md transition-shadow duration-200 flex-shrink-0 bg-card relative group",
                                    isDragging && "cursor-grabbing",
                                    isUpdating === invoice._id && "opacity-60 pointer-events-none",
                                    snapshot.isDragging && "border-primary"
                                  )}
                                >
                                   {isUpdating === invoice._id && (
                                       <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-20 rounded-md">
                                           <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary" /> {/* Smaller loader */}
                                       </div>
                                   )}
                                  {/* Reduced padding/font size in header */}
                                  <CardHeader className="p-1.5 sm:p-2 pb-0.5 flex flex-row items-center justify-between space-y-0">
                                      <CardTitle className="text-[10px] sm:text-xs font-medium truncate max-w-[100px] sm:max-w-[120px]"> {/* Truncate */}
                                        <span>{invoice.invoiceNumber}</span>
                                      </CardTitle>
                                      {/* Smaller badge */}
                                      <Badge variant={getStatusVariant(invoice.status)} className="text-[8px] sm:text-[9px] font-normal ml-1 capitalize px-1 py-0 leading-tight">
                                        {invoice.status}
                                      </Badge>
                                  </CardHeader>
                                   {/* Reduced padding/font size in content */}
                                   <CardContent className="p-1.5 sm:p-2 pt-0 text-[9px] sm:text-[10px] space-y-0.5">
                                    <CardDescription className="text-[9px] sm:text-[10px] text-muted-foreground pt-0 sm:pt-0.5 truncate">
                                      {invoice.customerName}
                                    </CardDescription>
                                    <p><span className="text-muted-foreground/80">Inv:</span> {formatDate(parsedInvoiceDate)}</p>
                                    <p className={cn(isDue && "text-amber-600 font-medium")}><span className="text-muted-foreground/80">Due:</span> {formatDate(parsedDueDate)}</p>
                                  </CardContent>
                                  {/* Reduced padding/font size in footer */}
                                  <CardFooter className="p-1.5 sm:p-2 pt-1 flex justify-between items-center text-[9px] sm:text-[10px] border-t mt-1 sm:mt-1.5">
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
                    // Placeholder for empty columns, adjusted padding/size
                    <div className="text-center text-[10px] text-muted-foreground/70 mt-3 p-3 border border-dashed border-muted rounded-md h-16 sm:h-20 flex items-center justify-center">
                      No invoices in {status.toLowerCase()}
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
