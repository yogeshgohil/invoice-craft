
'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react'; // Moved useState and useEffect here
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { Separator } from '@/components/ui/separator';
import { Download, PlusCircle, Trash2, Save, Loader2, Send, Ban, Eye } from 'lucide-react'; // Added Eye icon
import { InvoicePreview } from './invoice-preview'; // Import InvoicePreview
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency, cn } from '@/lib/utils'; // Import utility
import { useToast } from '@/hooks/use-toast'; // Import useToast
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"; // Import Form components
import { useRouter } from 'next/navigation'; // Import useRouter for redirect
import type { Invoice } from '@/app/invoices/page'; // Import full Invoice type for initial data
import { format, parseISO } from 'date-fns'; // Import date-fns
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog" // Import Dialog components
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton


const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  price: z.coerce.number().min(0.01, 'Price must be positive'),
  color: z.string().optional().default('#000000'), // Added optional color field
});

// Define allowed status values
const statusEnum = z.enum(["Pending", "In Process", "Hold", "Cancelled", "Completed"]);

const invoiceSchema = z.object({
  _id: z.string().optional(), // Add _id field for editing
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  customerAddress: z.string().optional(),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  // Keep date validation simple, rely on native input type="date" and refine check
  invoiceDate: z.string().refine((date) => {
    try { return !!date && !isNaN(new Date(date).getTime()); } catch { return false; }
  }, { message: 'Invalid invoice date.' }),
  dueDate: z.string().refine((date) => {
     try { return !!date && !isNaN(new Date(date).getTime()); } catch { return false; }
  }, { message: 'Invalid due date.' }),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  paidAmount: z.coerce.number().min(0, 'Paid amount cannot be negative').optional().default(0),
  status: statusEnum.default("Pending"), // Add status field with default
}).refine(data => {
    try {
        // Use UTC interpretation for comparison to avoid timezone issues on server/client
        const invoiceD = new Date(data.invoiceDate + 'T00:00:00Z');
        const dueD = new Date(data.dueDate + 'T00:00:00Z');
        return dueD >= invoiceD;
    } catch {
        return false; // Invalid date format fails the refinement
    }
}, {
  message: "Due date cannot be before invoice date.",
  path: ["dueDate"], // Point the error to the dueDate field
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
    initialData?: Invoice | null; // Accept initial data for editing
}

// Helper to format date from potentially Date object or ISO string to YYYY-MM-DD
const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return '';
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return format(dateObj, 'yyyy-MM-dd');
    } catch {
        // Fallback for potentially already formatted string or invalid date
        return typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/) ? date : '';
    }
};

export function InvoiceForm({ initialData }: InvoiceFormProps) {
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData | null>(null); // Start with null, update on preview/load
  const invoicePreviewRef = useRef<HTMLDivElement>(null); // Ref for the preview component
  const [defaultInvoiceNumber, setDefaultInvoiceNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false); // Loading state for save button
  const [isClient, setIsClient] = useState(false); // State to track client-side mount
  const { toast } = useToast(); // Toast hook

   // Determine if we are in edit mode
   const isEditMode = !!initialData?._id;

  useEffect(() => {
    setIsClient(true); // Set client to true after mount
    // Generate default invoice number only on client side for new invoices
    if (!isEditMode) {
        setDefaultInvoiceNumber(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
    }
    // Set initial data for preview if editing
    if (isEditMode && initialData) {
        setInvoiceData({
            ...initialData,
            items: initialData.items.map(item => ({ ...item, color: item.color || '#000000' })), // Ensure color exists
            invoiceDate: formatDateForInput(initialData.invoiceDate),
            dueDate: formatDateForInput(initialData.dueDate),
            paidAmount: initialData.paidAmount ?? 0,
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]); // Re-run if edit mode changes (though unlikely)


  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData ? {
        ...initialData,
        items: initialData.items.map(item => ({ ...item, color: item.color || '#000000' })), // Ensure color exists
        // Ensure dates are formatted correctly for the input type="date"
        invoiceDate: formatDateForInput(initialData.invoiceDate),
        dueDate: formatDateForInput(initialData.dueDate),
        paidAmount: initialData.paidAmount ?? 0, // Ensure paidAmount has a default
    } : {
      _id: undefined,
      customerName: '',
      customerEmail: '',
      customerAddress: '',
      invoiceNumber: '', // Will be set by useEffect for new invoices
      invoiceDate: formatDateForInput(new Date()), // Default to today
      dueDate: formatDateForInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // Default 30 days from now
      items: [{ description: '', quantity: 1, price: 0, color: '#000000' }], // Add default color
      notes: '',
      paidAmount: 0,
      status: "Pending",
    },
    mode: 'onChange', // Trigger validation and calculations on change
  });

   // Set the default invoice number for new invoices once generated
   useEffect(() => {
     // Only run on client and only for new invoices
    if (isClient && !isEditMode && defaultInvoiceNumber && !form.getValues('invoiceNumber')) {
      form.setValue('invoiceNumber', defaultInvoiceNumber, { shouldValidate: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, isEditMode, defaultInvoiceNumber]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Watch form values to calculate totals dynamically
  const watchedItems = form.watch('items');
  const watchedPaidAmount = form.watch('paidAmount');

  const calculateTotalAmount = (items: typeof watchedItems) => {
    return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
  };

  const totalAmount = calculateTotalAmount(watchedItems);
  const totalDue = totalAmount - (watchedPaidAmount || 0);


  const handlePreviewData = async () => {
     const isValid = await form.trigger(); // Validate before previewing
     if (!isValid) {
         toast({
             title: "Form Errors",
             description: "Please fix the errors before previewing.",
             variant: "destructive",
         });
         return;
     }
    const data = form.getValues();
    setInvoiceData(data); // Set data to trigger preview rendering inside the dialog
    // Toast notification might be excessive here, dialog opening is enough feedback
    // toast({ title: "Preview Ready", description: "Invoice preview updated." });
  };

  const handleSave = async () => {
    setIsSaving(true);
    let errorToastDescription = 'An unexpected error occurred while saving.';

    try {
        const isValid = await form.trigger();
        if (!isValid) {
            toast({
                title: "Validation Error",
                description: "Please check the form for errors before saving.",
                variant: "destructive",
            });
            setIsSaving(false);
            return;
        }

        const data = form.getValues();

        const apiUrl = isEditMode ? `/api/invoices/${data._id}` : '/api/invoices';
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(apiUrl, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! Status: ${response.status}`;
            let serverMessage = '';
             try {
                 const errorData = await response.json();
                 serverMessage = errorData.message || '';
                 errorMessage = serverMessage || errorMessage;

                 if (errorData.errors) {
                     errorMessage = 'Validation failed on the server. Please check your inputs.';
                 } else if (response.status === 503 && serverMessage.toLowerCase().includes('database connection')) {
                    // Specific handling for DB connection error
                    errorMessage = 'Database connection error. Please check the server logs and database configuration.';
                 } else if (response.status === 409) { // Conflict (duplicate invoice number)
                     errorMessage = serverMessage || 'Invoice conflict (e.g., duplicate number).';
                 } else if (response.status === 404) { // Not Found (for updates)
                     errorMessage = serverMessage || 'Invoice not found for update.';
                 }
            } catch (jsonError) {
                errorMessage = response.statusText || `HTTP error! Status: ${response.status}`;
                 if (response.status === 503) {
                     errorMessage = 'Service unavailable (503). Server/DB issue.';
                 }
            }
            // Set the specific error message for the toast
            errorToastDescription = `Could not ${isEditMode ? 'update' : 'save'} invoice: ${errorMessage}`;
            throw new Error(errorMessage); // Throw to be caught by the outer catch block
        }

        const result = await response.json();
        toast({
            title: `Invoice ${isEditMode ? 'Updated' : 'Saved'}`,
            description: `Invoice ${data.invoiceNumber} has been ${isEditMode ? 'updated' : 'saved'} successfully.`,
            variant: 'default', // Use default success style
        });

        // Update preview data state after successful save/update
        setInvoiceData(data);

        // Redirect to the invoices list page after saving/updating
        router.push('/invoices');

    } catch (error: any) {
        const finalErrorDescription = errorToastDescription.startsWith(`Could not ${isEditMode ? 'update' : 'save'} invoice:`)
            ? errorToastDescription
            : error.message || 'An unknown error occurred.';

        toast({
            title: `${isEditMode ? 'Update' : 'Save'} Failed`,
            description: finalErrorDescription,
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
 };


  const downloadPDF = async () => {
    const isValid = await form.trigger();
     if (!isValid) {
        toast({ title: "Cannot Download", description: "Please fix form errors before downloading.", variant: "destructive"});
        return;
     }
    const currentData = form.getValues();
    // Ensure preview data is set for PDF generation
    setInvoiceData(currentData);

    // Wait for state update and potential re-render of the hidden preview
    await new Promise(resolve => setTimeout(resolve, 150));


    if (!invoicePreviewRef.current || !currentData) {
      toast({ title: "Error", description: "Could not generate PDF. Preview data missing.", variant: "destructive"});
      return;
    }

    // Temporarily make the preview visible but off-screen for rendering
    invoicePreviewRef.current.style.position = 'fixed'; // Use fixed to ensure it's in viewport calculations
    invoicePreviewRef.current.style.left = '-9999px';
    invoicePreviewRef.current.style.top = '0';
    invoicePreviewRef.current.style.zIndex = '-1'; // Ensure it's behind everything
    invoicePreviewRef.current.style.visibility = 'visible'; // Make it visible for html2canvas
    invoicePreviewRef.current.style.width = '8.5in'; // Standard paper width


    try {
        const canvas = await html2canvas(invoicePreviewRef.current, {
            scale: 2, // Higher scale for better resolution
            useCORS: true,
            logging: false,
             // Explicitly set width/height based on the element's scroll dimensions
            width: invoicePreviewRef.current.scrollWidth,
            height: invoicePreviewRef.current.scrollHeight,
            windowWidth: invoicePreviewRef.current.scrollWidth,
            windowHeight: invoicePreviewRef.current.scrollHeight,
        });

        // Restore hidden state
        invoicePreviewRef.current.style.position = '';
        invoicePreviewRef.current.style.left = '';
        invoicePreviewRef.current.style.top = '';
        invoicePreviewRef.current.style.zIndex = '';
        invoicePreviewRef.current.style.visibility = 'hidden';
        invoicePreviewRef.current.style.width = '';


        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'in',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = imgProps.width;
        const imgHeight = imgProps.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        // Adjust Y position slightly if needed, maybe add a small top margin
        const imgY = 0.1; // Example small top margin in inches

        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`invoice-${currentData?.invoiceNumber || 'preview'}.pdf`);
        toast({ title: "Download Started", description: "Your invoice PDF is being downloaded."});

    } catch (error) {
        toast({ title: "PDF Generation Failed", description: "An error occurred while creating the PDF.", variant: "destructive" });
        // Ensure hidden state is restored even on error
        if (invoicePreviewRef.current) {
             invoicePreviewRef.current.style.position = '';
             invoicePreviewRef.current.style.left = '';
             invoicePreviewRef.current.style.top = '';
             invoicePreviewRef.current.style.zIndex = '';
             invoicePreviewRef.current.style.visibility = 'hidden';
             invoicePreviewRef.current.style.width = '';
        }
    }
  };


  // Render skeleton or minimal UI if not client-side yet (important for date fields)
   if (!isClient) {
       return (
           <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
               {/* Placeholder cards */}
               <Card className="bg-card animate-pulse"><CardHeader className="p-4 sm:p-6"><Skeleton className="h-6 w-1/2 bg-muted rounded" /></CardHeader><CardContent className="p-4 sm:p-6 pt-0 space-y-4"><Skeleton className="h-10 bg-muted rounded" /><Skeleton className="h-10 bg-muted rounded" /><Skeleton className="h-20 bg-muted rounded" /></CardContent></Card>
               <Card className="bg-card animate-pulse"><CardHeader className="p-4 sm:p-6"><Skeleton className="h-6 w-1/2 bg-muted rounded" /></CardHeader><CardContent className="p-4 sm:p-6 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><Skeleton className="h-10 bg-muted rounded" /><Skeleton className="h-10 bg-muted rounded" /><Skeleton className="h-10 bg-muted rounded" /><Skeleton className="h-10 bg-muted rounded" /></CardContent></Card>
               <Card className="bg-card animate-pulse"><CardHeader className="p-4 sm:p-6"><Skeleton className="h-6 w-1/2 bg-muted rounded" /></CardHeader><CardContent className="p-4 sm:p-6 pt-0 space-y-4"><Skeleton className="h-20 bg-muted rounded" /><Skeleton className="h-10 w-32 bg-muted rounded" /></CardContent></Card>
               {/* Add more placeholders as needed */}
               <CardFooter className="flex justify-end gap-2 pt-6 px-4 sm:px-6">
                    <Skeleton className="h-9 w-24 bg-muted rounded-md" />
                    <Skeleton className="h-9 w-24 bg-muted rounded-md" />
                    <Skeleton className="h-9 w-32 bg-muted rounded-md" />
               </CardFooter>
           </div>
       );
   }


  return (
    <Form {...form}>
        {/* Use grid layout for better alignment and responsiveness */}
        <form className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 p-4 sm:p-6">
            {/* Left Column (or Main Column on smaller screens) */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">

                {/* Customer Information Card */}
                <Card className="bg-card shadow-sm border border-border">
                    <CardHeader className="p-4 sm:p-6 border-b">
                        <CardTitle className="text-base sm:text-lg">Customer Information</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Details of the person or company being billed.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4 sm:p-6">
                        <FormField control={form.control} name="customerName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Customer Name</FormLabel>
                                <FormControl><Input placeholder="Ravina" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="customerEmail" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Customer Email (Optional)</FormLabel>
                                <FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="customerAddress" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Customer Address (Optional)</FormLabel>
                                <FormControl><Textarea placeholder="123 Main St, Anytown, USA 12345" {...field} rows={3} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                {/* Invoice Items Card */}
                <Card className="bg-card shadow-sm border border-border">
                    <CardHeader className="p-4 sm:p-6 border-b">
                        <CardTitle className="text-base sm:text-lg">Invoice Items</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Add the services or products being billed.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 sm:p-6">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex flex-col gap-3 rounded-md border p-3 sm:p-4 md:flex-row md:items-start md:gap-2 bg-secondary/30"> {/* Subtle background */}
                                <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                                    <FormItem className="flex-grow">
                                        <FormLabel className="text-xs sr-only">Description</FormLabel> {/* Visually hide label */}
                                        <FormControl><Input placeholder="Service or Product" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                                    <FormItem className="w-full md:w-20"> {/* Narrower quantity */}
                                        <FormLabel className="text-xs sr-only">Quantity</FormLabel>
                                        <FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name={`items.${index}.price`} render={({ field }) => (
                                    <FormItem className="w-full md:w-28"> {/* Slightly narrower price */}
                                        <FormLabel className="text-xs sr-only">Price (₹)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" placeholder="Price (₹)" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                 {/* Color Picker */}
                                <FormField control={form.control} name={`items.${index}.color`} render={({ field }) => (
                                    <FormItem className="w-full md:w-16 flex flex-col items-start pt-1.5">
                                        <FormLabel className="text-xs sr-only">Color</FormLabel>
                                         <FormControl>
                                             <Input
                                                 type="color"
                                                 className="h-8 w-10 sm:w-12 p-1 border rounded cursor-pointer" // Basic styling for color input
                                                 {...field}
                                             />
                                         </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <div className="flex items-center self-center md:self-start mt-2 md:mt-0 md:pt-[1.7rem]"> {/* Align button */}
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Remove item" disabled={fields.length <= 1} className="w-8 h-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {/* Display root array error */}
                        {form.formState.errors.items?.root && (<p className="text-sm text-destructive">{form.formState.errors.items.root.message}</p>)}
                        {form.formState.errors.items && !form.formState.errors.items.root && typeof form.formState.errors.items === 'object' && 'message' in form.formState.errors.items && (<p className="text-sm text-destructive">{form.formState.errors.items.message}</p>)}

                        <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, price: 0, color: '#000000' })} className="w-full sm:w-auto border-dashed"> {/* Dashed border */}
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </CardContent>
                </Card>


                {/* Notes Card */}
                <Card className="bg-card shadow-sm border border-border">
                    <CardHeader className="p-4 sm:p-6 border-b">
                        <CardTitle className="text-base sm:text-lg">Notes (Optional)</CardTitle>
                         <CardDescription className="text-xs sm:text-sm">Add any additional terms or instructions.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormControl><Textarea placeholder="E.g., Payment due within 30 days." {...field} rows={4} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

            </div>

             {/* Right Column (or Bottom section on smaller screens) */}
            <div className="lg:col-span-1 space-y-6 sm:space-y-8">
                 {/* Invoice Details Card */}
                <Card className="bg-card shadow-sm border border-border">
                     <CardHeader className="p-4 sm:p-6 border-b">
                        <CardTitle className="text-base sm:text-lg">Invoice Details</CardTitle>
                         <CardDescription className="text-xs sm:text-sm">Core invoice identification and dates.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 p-4 sm:p-6">
                        <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Invoice Number</FormLabel>
                                <FormControl><Input {...field} disabled={isEditMode} className={cn(isEditMode && "cursor-not-allowed bg-muted/50")} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="invoiceDate" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Invoice Date</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="dueDate" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Due Date</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {statusEnum.options.map((status) => ( <SelectItem key={status} value={status}>{status}</SelectItem> ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>

                {/* Payment & Summary Card */}
                <Card className="bg-card shadow-sm border border-border sticky top-6"> {/* Sticky position */}
                    <CardHeader className="p-4 sm:p-6 border-b">
                        <CardTitle className="text-base sm:text-lg">Payment & Summary</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Track payments and totals.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 sm:p-6">
                        <FormField control={form.control} name="paidAmount" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount Paid (₹)</FormLabel>
                                <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <Separator className="my-4" />
                        <div className="space-y-2 text-sm">
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Amount:</span>
                                <span className="font-medium">{formatCurrency(totalAmount)}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount Paid:</span>
                                <span className="font-medium">{formatCurrency(watchedPaidAmount || 0)}</span>
                             </div>
                             <Separator className="my-2" />
                             <div className="flex justify-between text-base font-semibold">
                                <span>Total Due:</span>
                                <span>{formatCurrency(totalDue)}</span>
                             </div>
                        </div>
                    </CardContent>
                     <CardFooter className="flex flex-col sm:flex-row sm:flex-wrap justify-end gap-2 sm:gap-3 pt-4 pb-4 px-4 sm:px-6 border-t bg-secondary/30">
                        {/* Use Dialog for Preview */}
                         <Dialog>
                             <DialogTrigger asChild>
                                 <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={handlePreviewData}>
                                     <Eye className="mr-2 h-4 w-4" /> Preview
                                 </Button>
                             </DialogTrigger>
                             <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 flex flex-col">
                                 <DialogHeader className="p-4 border-b">
                                     <DialogTitle>Invoice Preview</DialogTitle>
                                 </DialogHeader>
                                 <div className="flex-grow overflow-auto p-4 bg-muted/20">
                                     {invoiceData ? (
                                         <InvoicePreview data={invoiceData} />
                                     ) : (
                                         <div className="flex items-center justify-center h-full text-muted-foreground">
                                             Update form to see preview.
                                         </div>
                                     )}
                                 </div>
                                <DialogFooter className="p-4 border-t">
                                    <Button type="button" variant="secondary" size="sm" onClick={downloadPDF} disabled={!invoiceData || isSaving}>
                                         <Download className="mr-2 h-4 w-4" /> Download PDF
                                    </Button>
                                    <DialogClose asChild>
                                         <Button type="button" variant="outline" size="sm">Close</Button>
                                    </DialogClose>
                                </DialogFooter>
                             </DialogContent>
                         </Dialog>

                         <Button type="button" variant="outline" size="sm" onClick={() => router.push('/invoices')} className="w-full sm:w-auto">
                             <Ban className="mr-2 h-4 w-4" /> Cancel
                         </Button>
                         <Button type="button" onClick={handleSave} disabled={isSaving} size="sm" className="w-full sm:w-auto">
                             {isSaving ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( isEditMode ? <Send className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" /> )}
                             {isSaving ? 'Saving...' : (isEditMode ? 'Update Invoice' : 'Save Invoice')}
                         </Button>
                     </CardFooter>
                </Card>
            </div>


        {/* Hidden Invoice Preview Component for PDF Generation */}
        <div
             ref={invoicePreviewRef}
             className="fixed -left-[9999px] top-0 invisible print:visible print:static print:left-auto print:top-auto print:w-auto print:h-auto print:overflow-visible bg-white text-black"
             style={{ visibility: 'hidden', position: 'fixed', pointerEvents: 'none' }} // Ensure it's hidden but available
             aria-hidden="true"
         >
             {/* Render preview only when data is available */}
             {invoiceData && <InvoicePreview data={invoiceData} />}
        </div>
        </form>
    </Form>
  );
}

