
import { NextResponse, type NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/invoice';
import mongoose from 'mongoose';
import type { InvoiceFormData } from '@/components/invoice-form'; // Import the type

// Helper function to check DB connection state
const isConnected = () => mongoose.connection.readyState === 1;

// Define allowed status values explicitly for validation
const allowedStatuses = ["Pending", "In Process", "Hold", "Cancelled", "Completed"];

// GET handler to retrieve a single invoice by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid invoice ID format.' }, { status: 400 });
    }

    try {
        await connectDB();
        if (!isConnected()) {
            throw new Error('Database connected but readyState is not 1.');
        }

        const invoice = await Invoice.findById(id);

        if (!invoice) {
            return NextResponse.json({ message: 'Invoice not found.' }, { status: 404 });
        }

        return NextResponse.json({ data: invoice }, { status: 200 });

    } catch (error: any) {
         if (error.message.toLowerCase().includes('database connection error') || error.name === 'MongooseServerSelectionError' || error.message.toLowerCase().includes('connection refused')) {
            return NextResponse.json({ message: 'Database connection issue during fetch.', error: error.name || 'DB Connection Error' }, { status: 503 });
        }
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error during fetch.';
        return NextResponse.json({ message: 'Failed to fetch invoice', error: errorMessage }, { status: 500 });
    }
}


// PUT handler to update an existing invoice
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid invoice ID format.' }, { status: 400 });
    }

    try {
        await connectDB();
        if (!isConnected()) {
            throw new Error('Database connected but readyState is not 1.');
        }

        const invoiceData: Partial<InvoiceFormData> = await request.json();

        // Basic validation (Mongoose schema will handle more)
        if (!invoiceData || Object.keys(invoiceData).length === 0) {
           return NextResponse.json({ message: 'No update data provided.' }, { status: 400 });
        }

        // Handle date conversions if dates are present in the update data
        if (invoiceData.invoiceDate) {
            const parsedDate = new Date(invoiceData.invoiceDate + 'T00:00:00Z');
            if (isNaN(parsedDate.getTime())) {
                 return NextResponse.json({ message: 'Invalid invoice date format provided. Use YYYY-MM-DD.' }, { status: 400 });
            }
            invoiceData.invoiceDate = parsedDate.toISOString(); // Store as ISO string or Date object
        }
        if (invoiceData.dueDate) {
            const parsedDate = new Date(invoiceData.dueDate + 'T00:00:00Z');
            if (isNaN(parsedDate.getTime())) {
                return NextResponse.json({ message: 'Invalid due date format provided. Use YYYY-MM-DD.' }, { status: 400 });
            }
             // Check if dueDate is before invoiceDate if both are present
            if (invoiceData.invoiceDate) {
                const invoiceD = new Date(invoiceData.invoiceDate); // Already parsed or original Date
                if (!isNaN(invoiceD.getTime()) && parsedDate < invoiceD) {
                     return NextResponse.json({ message: 'Due date cannot be before invoice date.' }, { status: 400 });
                }
            }
            invoiceData.dueDate = parsedDate.toISOString();
        }

         // Validate status if present
        if (invoiceData.status && !allowedStatuses.includes(invoiceData.status)) {
           return NextResponse.json({ message: `Invalid status provided. Allowed statuses are: ${allowedStatuses.join(', ')}.` }, { status: 400 });
        }

         // Ensure items array is valid if present
        if (invoiceData.items && (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0)) {
            return NextResponse.json({ message: 'Invoice must have at least one item.' }, { status: 400 });
        }

        // Prevent changing the invoice number if needed (optional business logic)
        // if (invoiceData.invoiceNumber) {
        //     delete invoiceData.invoiceNumber; // Or return an error
        // }


        // Find the invoice and update it
        // `runValidators: true` ensures schema validations are run on update
        const updatedInvoice = await Invoice.findByIdAndUpdate(
            id,
            { ...invoiceData, updatedAt: new Date() }, // Apply updates and set updatedAt timestamp
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!updatedInvoice) {
            return NextResponse.json({ message: 'Invoice not found.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Invoice updated successfully', data: updatedInvoice }, { status: 200 });

    } catch (error: any) {

        if (error instanceof mongoose.Error.ValidationError) {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return NextResponse.json({ message: 'Validation Error during update', errors: validationErrors }, { status: 400 });
        }
        // Handle duplicate key error specifically for invoiceNumber during update (less common but possible if logic changes)
        if (error.code === 11000 && error.keyPattern?.invoiceNumber) {
           return NextResponse.json({ message: `Invoice number '${error.keyValue?.invoiceNumber}' already exists. Cannot update to duplicate number.` }, { status: 409 });
        }
        if (error.message.toLowerCase().includes('database connection error') || error.name === 'MongooseServerSelectionError' || error.message.toLowerCase().includes('connection refused')) {
            return NextResponse.json({ message: 'Database connection issue during update.', error: error.name || 'DB Connection Error' }, { status: 503 });
        }
        if (error instanceof mongoose.Error) {
            return NextResponse.json({ message: 'Database operation failed during update', error: error.message }, { status: 500 });
        }
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error during update.';
        return NextResponse.json({ message: 'Failed to update invoice', error: errorMessage }, { status: 500 });
    }
}


// PATCH handler to update an invoice's status (Kept for potential specific status updates if needed)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: 'Invalid invoice ID format.' }, { status: 400 });
    }

    try {
        // Connect to DB
        try {
            await connectDB();
            if (!isConnected()) {
                throw new Error('Database connected but readyState is not 1.');
            }
        } catch (dbError: any) {
            return NextResponse.json({ message: 'Database connection error. Please check configuration and status.', error: dbError.message || 'Failed to connect to DB' }, { status: 503 });
        }

        // Get the status from the request body
        const { status } = await request.json();

        // Validate the status
        if (!status || !allowedStatuses.includes(status)) {
            return NextResponse.json({ message: `Invalid status provided. Allowed statuses are: ${allowedStatuses.join(', ')}.` }, { status: 400 });
        }

        // Check connection again before updating
        if (!isConnected()) {
            return NextResponse.json({ message: 'Database connection lost before update. Please try again.', error: 'Disconnected' }, { status: 503 });
        }

        // Find the invoice and update its status
        const updatedInvoice = await Invoice.findByIdAndUpdate(
            id,
            { status: status, updatedAt: new Date() }, // Update status and updatedAt timestamp
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!updatedInvoice) {
            return NextResponse.json({ message: 'Invoice not found.' }, { status: 404 });
        }


        // Return the updated invoice data
        return NextResponse.json({ message: 'Invoice status updated successfully', data: updatedInvoice }, { status: 200 });

    } catch (error: any) {

        if (error instanceof mongoose.Error.ValidationError) {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return NextResponse.json({ message: 'Validation Error during status update', errors: validationErrors }, { status: 400 });
        }

        if (error.message.toLowerCase().includes('database connection error') || error.name === 'MongooseServerSelectionError' || error.message.toLowerCase().includes('connection refused')) {
            return NextResponse.json({ message: 'Database connection issue during status update.', error: error.name || 'DB Connection Error' }, { status: 503 });
        }

        if (error instanceof mongoose.Error) {
            return NextResponse.json({ message: 'Database operation failed during status update', error: error.message }, { status: 500 });
        }

        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error during status update.';
        return NextResponse.json({ message: 'Failed to update invoice status', error: errorMessage }, { status: 500 });
    }
}
