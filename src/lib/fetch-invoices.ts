
import type { Invoice } from '@/app/invoices/page'; // Import the full Invoice type

// Define the structure for filter parameters
interface FilterParams {
    customerName?: string;
    status?: string;
    dueDateStart?: string;
    dueDateEnd?: string;
    page?: number; // Add page number
    limit?: number; // Add limit per page
}

// Define the structure of the API response including pagination
interface FetchInvoicesResponse {
    invoices: Invoice[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalInvoices: number;
        limit: number;
    };
}


// Function to fetch multiple invoices with optional filters and pagination
export async function fetchInvoices(filters: FilterParams): Promise<FetchInvoicesResponse> {
    // Use relative URL directly in client components
    const queryParams = new URLSearchParams();
    if (filters.customerName) queryParams.append('customerName', filters.customerName);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.dueDateStart) queryParams.append('dueDateStart', filters.dueDateStart);
    if (filters.dueDateEnd) queryParams.append('dueDateEnd', filters.dueDateEnd);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());

    const apiUrl = `/api/invoices?${queryParams.toString()}`; // Use relative URL

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            // Cache strategy: 'no-store' for always fresh data needed for lists that change often
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
        if (!data || !Array.isArray(data.invoices) || !data.pagination) {
            throw new Error('Invalid data structure received from API.');
        }
        // Ensure dates are Dates or strings as needed by consumers
        // Convert dates from API (likely strings) to Date objects if required by components
        const formattedInvoices = data.invoices.map((invoice: any) => ({
            ...invoice,
            // Example: Convert to Date objects if needed elsewhere, otherwise keep as string
            // invoiceDate: new Date(invoice.invoiceDate),
            // dueDate: new Date(invoice.dueDate),
        })) as Invoice[];

        return {
            invoices: formattedInvoices,
            pagination: data.pagination,
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to load invoices. Please check the API connection or try again later. Original error: ${errorMessage}`);
    }
}
