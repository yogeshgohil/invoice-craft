
'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react'; // Moved useState and useEffect here
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, PlusCircle, Trash2, Save, Loader2, Send, Ban } from 'lucide-react'; // Added Ban icon
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


const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  price: z.coerce.number().min(0.01, 'Price must be positive'),
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
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData | null>(initialData || null);
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
  }, [isEditMode]); // Re-run if edit mode changes (though unlikely)


  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData ? {
        ...initialData,
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
      items: [{ description: '', quantity: 1, price: 0 }],
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
  }, [isClient, isEditMode, defaultInvoiceNumber, form]);


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


  const handlePreview: SubmitHandler<InvoiceFormData> = (data) => {
    console.log('Preview Data:', data);
    setInvoiceData(data); // Set data to trigger preview rendering
    toast({ title: "Preview Updated", description: "Invoice preview has been updated with the latest data." });
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
        console.log(`Attempting to ${isEditMode ? 'update' : 'save'} Invoice Data:`, data);

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
                    console.error("Server Validation Errors:", errorData.errors);
                     errorMessage = 'Validation failed on the server. Please check your inputs.';
                 } else if (response.status === 503 && serverMessage.toLowerCase().includes('database connection error')) {
                    // Specific handling for DB connection error
                    console.error("Database connection error reported by API.");
                    errorMessage = 'Database connection error. Please check the server logs and database configuration.';
                 } else if (response.status === 409) { // Conflict (duplicate invoice number)
                     console.warn("API reported conflict (409). API Message:", serverMessage);
                     errorMessage = serverMessage || 'Invoice conflict (e.g., duplicate number).';
                 } else if (response.status === 404) { // Not Found (for updates)
                     console.warn("API reported Not Found (404). API Message:", serverMessage);
                     errorMessage = serverMessage || 'Invoice not found for update.';
                 } else {
                    console.error(`API Error (${response.status}): ${errorMessage}`);
                 }
            } catch (jsonError) {
                console.error("Failed to parse error response JSON:", jsonError);
                errorMessage = response.statusText || `HTTP error! Status: ${response.status}`;
                 if (response.status === 503) {
                     errorMessage = 'Service unavailable (503). Server/DB issue.';
                     console.error(errorMessage);
                 } else {
                     console.error(`API Error (${response.status}): ${errorMessage}`);
                 }
            }
            // Set the specific error message for the toast
            errorToastDescription = `Could not ${isEditMode ? 'update' : 'save'} invoice: ${errorMessage}`;
            throw new Error(errorMessage); // Throw to be caught by the outer catch block
        }

        const result = await response.json();
        console.log(`Invoice ${isEditMode ? 'updated' : 'saved'} successfully:`, result);
        toast({
            title: `Invoice ${isEditMode ? 'Updated' : 'Saved'}`,
            description: `Invoice ${data.invoiceNumber} has been ${isEditMode ? 'updated' : 'saved'} successfully.`,
        });

        setInvoiceData(data); // Update preview

        // Redirect to the invoices list page after saving/updating
        router.push('/invoices');

    } catch (error: any) {
        console.error(`Failed to ${isEditMode ? 'update' : 'save'} invoice:`, error);
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
    setInvoiceData(currentData);

    await new Promise(resolve => setTimeout(resolve, 100));


    if (!invoicePreviewRef.current || !currentData) {
      console.error("Invoice preview element or data not found for PDF generation");
      toast({ title: "Error", description: "Could not generate PDF. Preview data missing.", variant: "destructive"});
      return;
    }
    invoicePreviewRef.current.style.position = 'absolute';
    invoicePreviewRef.current.style.left = '-9999px';
    invoicePreviewRef.current.style.display = 'block';
    invoicePreviewRef.current.style.width = '8.5in';


    try {
        const canvas = await html2canvas(invoicePreviewRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            width: invoicePreviewRef.current.offsetWidth,
            height: invoicePreviewRef.current.offsetHeight,
            windowWidth: invoicePreviewRef.current.scrollWidth,
            windowHeight: invoicePreviewRef.current.scrollHeight,
        });

        invoicePreviewRef.current.style.position = '';
        invoicePreviewRef.current.style.left = '';
        invoicePreviewRef.current.style.display = 'none';
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
        const imgRatio = imgProps.width / imgProps.height;
        const pdfRatio = pdfWidth / pdfHeight;

        let finalImgWidth, finalImgHeight;
         if (imgRatio > pdfRatio) {
           finalImgWidth = pdfWidth;
           finalImgHeight = pdfWidth / imgRatio;
         } else {
           finalImgHeight = pdfHeight;
           finalImgWidth = pdfHeight * imgRatio;
         }
         const xPos = (pdfWidth - finalImgWidth) / 2;
         const yPos = 0;


        pdf.addImage(imgData, 'PNG', xPos, yPos, finalImgWidth, finalImgHeight);
        pdf.save(`invoice-${currentData?.invoiceNumber || 'preview'}.pdf`);
        toast({ title: "Download Started", description: "Your invoice PDF is being downloaded."});

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({ title: "PDF Generation Failed", description: "An error occurred while creating the PDF.", variant: "destructive" });
        if (invoicePreviewRef.current) {
             invoicePreviewRef.current.style.position = '';
             invoicePreviewRef.current.style.left = '';
             invoicePreviewRef.current.style.display = 'none';
             invoicePreviewRef.current.style.width = '';
        }
    }
  };


  // Render skeleton or minimal UI if not client-side yet (important for date fields)
   if (!isClient) {
       return (
           <div className="space-y-4 sm:space-y-6">
               {/* Placeholder cards */}
               <Card className="bg-card animate-pulse"><CardHeader className="p-4 sm:p-6"><div className="h-6 w-1/2 bg-muted rounded"></div></CardHeader><CardContent className="p-4 sm:p-6 pt-0 space-y-4"><div className="h-10 bg-muted rounded"></div><div className="h-10 bg-muted rounded"></div></CardContent></Card>
               <Card className="bg-card animate-pulse"><CardHeader className="p-4 sm:p-6"><div className="h-6 w-1/2 bg-muted rounded"></div></CardHeader><CardContent className="p-4 sm:p-6 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><div className="h-10 bg-muted rounded"></div><div className="h-10 bg-muted rounded"></div><div className="h-10 bg-muted rounded"></div><div className="h-10 bg-muted rounded"></div></CardContent></Card>
               <Card className="bg-card animate-pulse"><CardHeader className="p-4 sm:p-6"><div className="h-6 w-1/2 bg-muted rounded"></div></CardHeader><CardContent className="p-4 sm:p-6 pt-0 space-y-4"><div className="h-20 bg-muted rounded"></div><div className="h-10 w-32 bg-muted rounded"></div></CardContent></Card>
               {/* Add more placeholders as needed */}
               <CardFooter className="flex justify-end gap-2 pt-6 px-4 sm:px-6">
                    <div className="h-9 w-24 bg-muted rounded"></div>
                    <div className="h-9 w-24 bg-muted rounded"></div>
                    <div className="h-9 w-32 bg-muted rounded"></div>
               </CardFooter>
           </div>
       );
   }


  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(handlePreview)} className="space-y-4 sm:space-y-6">
        {/* Customer Information Card */}
        <Card className="bg-card">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg md:text-xl">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4 sm:p-6 pt-0">
            <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                    <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Customer Email (Optional)</FormLabel>
                    <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="customerAddress"
                render={({ field }) => (
                <FormItem className="md:col-span-2">
                    <FormLabel>Customer Address (Optional)</FormLabel>
                    <FormControl>
                    <Textarea placeholder="123 Main St, Anytown, USA 12345" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            </CardContent>
        </Card>

        {/* Invoice Details Card */}
        <Card className="bg-card">
             <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg md:text-xl">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 p-4 sm:p-6 pt-0">
            <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                        {/* Disable invoice number field in edit mode */}
                        <Input {...field} disabled={isEditMode} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="invoiceDate"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                    <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                    <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {statusEnum.options.map((status) => (
                        <SelectItem key={status} value={status}>
                            {status}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            </CardContent>
        </Card>

        {/* Invoice Items Card */}
        <Card className="bg-card">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg md:text-xl">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col gap-3 rounded-md border p-3 sm:p-4 md:flex-row md:items-end md:gap-2">
                <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                    <FormItem className="flex-grow">
                        <FormLabel className="text-sm">Description</FormLabel>
                        <FormControl>
                        <Input placeholder="Service or Product" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                    <FormItem className="w-full md:w-24">
                        <FormLabel className="text-sm">Quantity</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="1" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={`items.${index}.price`}
                    render={({ field }) => (
                    <FormItem className="w-full md:w-32">
                        <FormLabel className="text-sm">Price (₹)</FormLabel> {/* Changed symbol */}
                        <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <div className="flex items-end mt-2 md:mt-0 md:mb-1">
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        aria-label="Remove item"
                        disabled={fields.length <= 1}
                        className="w-full h-9 md:w-9 md:h-9"
                    >
                    <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                </div>
            ))}
            {/* Display root array error */}
            {form.formState.errors.items?.root && (
                <p className="text-sm text-destructive">{form.formState.errors.items.root.message}</p>
            )}
            {/* Handle general array error message */}
            {form.formState.errors.items && !form.formState.errors.items.root && typeof form.formState.errors.items === 'object' && 'message' in form.formState.errors.items && (
                <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
            )}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: '', quantity: 1, price: 0 })}
                className="w-full sm:w-auto"
            >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>
            </CardContent>
        </Card>

        {/* Payment Details Card */}
        <Card className="bg-card">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg md:text-xl">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
                <FormField
                    control={form.control}
                    name="paidAmount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Amount Paid (₹)</FormLabel> {/* Changed symbol */}
                        <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                {/* Adjust alignment for totals on mobile */}
                <div className="space-y-1 md:space-y-2 md:pt-0 md:self-end">
                    <Label className="text-sm md:text-base">Total Amount</Label>
                    <p className="text-base md:text-lg font-semibold">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="space-y-1 md:space-y-2 md:pt-0 md:self-end">
                    <Label className="text-sm md:text-base">Total Due</Label>
                    <p className="text-base md:text-lg font-semibold">{formatCurrency(totalDue)}</p>
                </div>
            </div>
            </CardContent>
        </Card>


        {/* Notes Card */}
        <Card className="bg-card">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg md:text-xl">Notes (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                    <FormItem>
                        <FormControl>
                        <Textarea placeholder="Additional terms or payment instructions" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        {/* Responsive Footer Buttons */}
        <CardFooter className="flex flex-col sm:flex-row sm:flex-wrap justify-end gap-2 sm:gap-3 pt-6 px-4 sm:px-6">
            <Button type="submit" variant="outline" size="sm" className="w-full sm:w-auto bg-secondary hover:bg-secondary/90">
                Preview Invoice
            </Button>
             {/* Cancel Button */}
             <Button
                 type="button"
                 variant="outline"
                 size="sm"
                 onClick={() => router.push('/invoices')} // Navigate back to list
                 className="w-full sm:w-auto"
             >
                 <Ban className="mr-2 h-4 w-4" /> Cancel
             </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving} size="sm" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    isEditMode ? <Send className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving ? 'Saving...' : (isEditMode ? 'Update Invoice' : 'Save Invoice')}
            </Button>
            <Button
                type="button"
                onClick={downloadPDF}
                // Disable download if form is invalid OR if it's a new unsaved invoice
                disabled={!form.formState.isValid || isSaving || !isEditMode && !invoiceData}
                 size="sm"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
                <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
        </CardFooter>

        {/* Hidden Invoice Preview Component */}
        <div ref={invoicePreviewRef} className="fixed -left-[9999px] top-0 invisible print:visible print:static print:left-auto print:top-auto print:w-auto print:h-auto print:overflow-visible bg-white text-black" aria-hidden={!invoiceData}>
            {invoiceData && <InvoicePreview data={invoiceData} />}
        </div>
        </form>
    </Form>
  );
}

    