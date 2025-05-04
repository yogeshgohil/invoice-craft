
import type { Invoice } from '@/app/invoices/page'; // Import the full Invoice type

// Define the structure for filter parameters
interface FilterParams {
    customerName?: string;
    status?: string;
    dueDateStart?: string;
    dueDateEnd?: string;
}

// Function to fetch multiple invoices with optional filters
export async function fetchInvoices(filters: FilterParams): Promise<Invoice[]> {
    // Use relative URL directly in client components
    const queryParams = new URLSearchParams();
    if (filters.customerName) queryParams.append('customerName', filters.customerName);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.dueDateStart) queryParams.append('dueDateStart', filters.dueDateStart);
    if (filters.dueDateEnd) queryParams.append('dueDateEnd', filters.dueDateEnd);

    const apiUrl = `/api/invoices?${queryParams.toString()}`; // Use relative URL

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            // Consider cache strategy for lists: 'no-store' for always fresh,
            // or remove for default caching behavior.
            cache: 'no-store',
        });

        if (!response.ok) {
            let errorBody = 'Failed to fetch invoices.';
            try {
                const errorData = await response.json();
                errorBody = errorData.message || `HTTP error! status: ${response.status}`;
            } catch (e) {
                errorBody = `HTTP error! status: ${response.status} ${response.statusText || ''}`.trim();
            }
            throw new Error(errorBody);
        }

        const data = await response.json();
        if (!data || !Array.isArray(data.invoices)) {
            throw new Error('Invalid data structure received from API.');
        }
        // Ensure dates are Dates or strings as needed by consumers
        return data.invoices.map((invoice: any) => ({
            ...invoice,
            invoiceDate: invoice.invoiceDate, // Keep as string from API for consistency? Or parse?
            dueDate: invoice.dueDate,         // Decide based on usage
        })) as Invoice[];
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to load invoices. Please check the API connection or try again later. Original error: ${errorMessage}`);
    }
}
