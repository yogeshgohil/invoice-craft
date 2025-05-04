
import { NextResponse, type NextRequest } from 'next/server'; // Import NextRequest
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/invoice'; // Assuming your model is in models/invoice.ts
import type { InvoiceFormData } from '@/components/invoice-form'; // Import the type
import mongoose, { type FilterQuery } from 'mongoose'; // Import FilterQuery type

// Helper function to check DB connection state
const isConnected = () => mongoose.connection.readyState === 1;

// POST handler to save an invoice
export async function POST(request: Request) {
  try {
    // Attempt to connect to the database first
    try {
        await connectDB();
        if (!isConnected()) {
            throw new Error('Database connected but readyState is not 1.');
        }
    } catch (dbError: any) {
        // Provide a more specific message for DB connection failure
        return NextResponse.json({ message: 'Database connection error. Please check server configuration, environment variables (MONGODB_URI), and database status/IP allowlist.', error: dbError.message || 'Failed to connect to DB' }, { status: 503 }); // Service Unavailable
    }

    const invoiceData: InvoiceFormData = await request.json();

    // Basic validation (though Mongoose schema handles more)
    if (!invoiceData || !invoiceData.invoiceNumber || !invoiceData.customerName || !invoiceData.items || invoiceData.items.length === 0 || !invoiceData.status) { // Added status check
      return NextResponse.json({ message: 'Missing required invoice fields (including status).' }, { status: 400 });
    }

    // Convert date strings to Date objects for Mongoose
    // Ensure dates are valid before creating the model instance
    const parsedInvoiceDate = new Date(invoiceData.invoiceDate + 'T00:00:00Z'); // Use UTC or ensure consistent timezone handling
    const parsedDueDate = new Date(invoiceData.dueDate + 'T00:00:00Z'); // Use UTC or ensure consistent timezone handling

    if (isNaN(parsedInvoiceDate.getTime()) || isNaN(parsedDueDate.getTime())) {
         return NextResponse.json({ message: 'Invalid date format provided. Use YYYY-MM-DD.' }, { status: 400 });
    }

    // Create a new invoice document using the Mongoose model
    const newInvoice = new Invoice({
        ...invoiceData,
        invoiceDate: parsedInvoiceDate,
        dueDate: parsedDueDate,
        // Status is already included in invoiceData
    });


    // Check connection again right before saving
    if (!isConnected()) {
        return NextResponse.json({ message: 'Database connection lost before save. Please try again.', error: 'Disconnected' }, { status: 503 });
    }

    // Save the document to the database
    const savedInvoice = await newInvoice.save();


    // Return the saved invoice data
    return NextResponse.json({ message: 'Invoice saved successfully', data: savedInvoice }, { status: 201 });

  } catch (error: any) {

    // Handle Mongoose Validation Errors specifically
    if (error instanceof mongoose.Error.ValidationError) {
      // Extract specific error messages for better feedback
       const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ message: 'Validation Error', errors: validationErrors }, { status: 400 });
    }

    // Handle potential duplicate key errors (e.g., unique invoiceNumber)
    if (error.code === 11000 && error.keyPattern?.invoiceNumber) {
       return NextResponse.json({ message: `Invoice number '${error.keyValue?.invoiceNumber}' already exists. Please use a different number.` }, { status: 409 }); // Conflict
    }

     // Handle specific database connection error scenarios during save
     if (error.message.toLowerCase().includes('database connection error') || error.message.toLowerCase().includes('service unavailable') || error.name === 'MongooseServerSelectionError' || error.message.toLowerCase().includes('connection refused')) {
        // Use the more specific message if available from connectDB or mongoose
        const specificMessage = error.message.includes('Database connection error') ? error.message : 'Unable to connect to the database. Please check connection and configuration.';
        return NextResponse.json({ message: specificMessage, error: error.name || 'DB Connection Error' }, { status: 503 });
    }

    // Handle other potential Mongoose or database errors
    if (error instanceof mongoose.Error) {
        return NextResponse.json({ message: 'Database operation failed during save', error: error.message }, { status: 500 });
    }


    // Generic internal server error for anything else
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error during save.';
    return NextResponse.json({ message: 'Failed to save invoice', error: errorMessage }, { status: 500 });
  }
}

// GET handler to retrieve invoices with filtering
export async function GET(request: NextRequest) { // Use NextRequest to access searchParams
  try {
     // Attempt to connect to the database first
     try {
        await connectDB();
         if (!isConnected()) {
            throw new Error('Database connected but readyState is not 1.');
        }
    } catch (dbError: any) {
        // Provide a more specific message for DB connection failure
        return NextResponse.json({ message: 'Database connection error. Please check server configuration, environment variables (MONGODB_URI), and database status/IP allowlist.', error: dbError.message || 'Failed to connect to DB' }, { status: 503 }); // Service Unavailable
    }

    // Check connection again right before finding
    if (!isConnected()) {
        return NextResponse.json({ message: 'Database connection lost before fetching invoices. Please try again.', error: 'Disconnected' }, { status: 503 });
    }

    // Get query parameters from the request URL
    const searchParams = request.nextUrl.searchParams;
    const customerName = searchParams.get('customerName');
    const status = searchParams.get('status');
    const dueDateStart = searchParams.get('dueDateStart');
    const dueDateEnd = searchParams.get('dueDateEnd');

    // Build the MongoDB query object based on filters
    const query: FilterQuery<InvoiceFormData & Document> = {};

    if (customerName) {
      // Use regex for partial, case-insensitive search
      query.customerName = { $regex: customerName, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }

    // Add due date range filtering
    const dueDateQuery: Record<string, any> = {};
    if (dueDateStart) {
        try {
            // Append time and Z to ensure consistent UTC parsing at the start of the day
            dueDateQuery.$gte = new Date(dueDateStart + 'T00:00:00Z');
             if (isNaN(dueDateQuery.$gte.getTime())) throw new Error('Invalid start date');
        } catch (e) {
             // Optionally return an error or ignore the filter
             return NextResponse.json({ message: 'Invalid start date format. Use YYYY-MM-DD.' }, { status: 400 });
        }
    }
    if (dueDateEnd) {
         try {
            // Append time and Z to ensure consistent UTC parsing at the end of the day
            dueDateQuery.$lte = new Date(dueDateEnd + 'T23:59:59.999Z');
            if (isNaN(dueDateQuery.$lte.getTime())) throw new Error('Invalid end date');
        } catch (e) {
            // Optionally return an error or ignore the filter
            return NextResponse.json({ message: 'Invalid end date format. Use YYYY-MM-DD.' }, { status: 400 });
        }
    }
    if (Object.keys(dueDateQuery).length > 0) {
        query.dueDate = dueDateQuery;
    }


    // Fetch invoices from the database based on the query, sorting by invoiceDate descending
    const invoices = await Invoice.find(query).sort({ invoiceDate: -1 });


    return NextResponse.json({ invoices }, { status: 200 });

  } catch (error: any) {

      // Handle specific database connection error scenarios during fetch
      if (error.message.toLowerCase().includes('database connection error') || error.message.toLowerCase().includes('service unavailable') || error.name === 'MongooseServerSelectionError' || error.message.toLowerCase().includes('connection refused')) {
          const specificMessage = error.message.includes('Database connection error') ? error.message : 'Unable to connect to the database. Please check connection and configuration.';
         return NextResponse.json({ message: specificMessage, error: error.name || 'DB Connection Error' }, { status: 503 });
     }

     // Handle other potential Mongoose or database errors during fetch
     if (error instanceof mongoose.Error) {
        return NextResponse.json({ message: 'Database query failed', error: error.message }, { status: 500 });
     }

     const errorMessage = error instanceof Error ? error.message : 'Internal Server Error during fetch.';
     return NextResponse.json({ message: 'Failed to fetch invoices', error: errorMessage }, { status: 500 });
  }
}
