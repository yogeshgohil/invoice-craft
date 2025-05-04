
import type { Invoice } from '@/app/invoices/page'; // Import the full Invoice type

// Function to fetch a single invoice by ID
export async function fetchInvoiceById(id: string): Promise<Invoice | null> {
    // Use relative URL path directly in client components
    const apiUrl = `/api/invoices/${id}`;

     // No need to validate URL construction with relative paths

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Ensure we get the latest data for editing/viewing
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null; // Indicate not found
            }
            let errorBody = `Failed to fetch invoice ${id}.`;
             try {
                 const errorData = await response.json();
                 errorBody = errorData.message || `HTTP error! status: ${response.status}`;
             } catch (e) {
                  errorBody = `HTTP error fetching invoice ${id}! status: ${response.status} ${response.statusText || ''}`.trim();
             }
            throw new Error(errorBody);
        }

        const result = await response.json();
        if (!result || !result.data) {
            throw new Error('Invalid data structure received from API.');
        }
        // Ensure dates are Dates (Mongoose returns ISO strings)
        const invoiceData = result.data as Invoice;
        // Convert date strings from API to Date objects if needed by the consuming component
        // Note: Input type="date" expects YYYY-MM-DD string format
        // invoiceData.invoiceDate = new Date(invoiceData.invoiceDate);
        // invoiceData.dueDate = new Date(invoiceData.dueDate);

        return invoiceData;

    } catch (error) {
         // Re-throw specific configuration or URL errors, let others be generic
        if (error instanceof Error && (error.message.startsWith("Application configuration error") || error.message.startsWith("Failed to construct valid API URL"))) {
             throw error;
        }
        // Provide a user-friendly generic message
        throw new Error(`Failed to load invoice details. Please check the connection or try again later. Original error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
