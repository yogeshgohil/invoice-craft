

interface MonthlyData {
  month: string; // Format: YYYY-MM
  year: number;
  monthIndex: number;
  totalInvoiced: number; // Total amount of all invoices created in the month
  totalPaid: number;     // Total amount paid across all invoices created in the month
  totalDue: number;      // Total amount due across all invoices created in the month
}

export interface IncomeReportData {
  monthlyData: MonthlyData[];
  totalInvoicedInRange: number;
  totalPaidInRange: number;
  totalDueInRange: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
}

interface FetchParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export async function fetchIncomeReport(params: FetchParams): Promise<IncomeReportData> {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  // Use relative path for API endpoint
  const apiUrl = `/api/reports/income?${queryParams.toString()}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store', // Fetch fresh data for reports
    });

    if (!response.ok) {
      let errorBody = 'Failed to fetch financial report.';
      try {
        const errorData = await response.json();
        errorBody = errorData.message || `HTTP error! status: ${response.status}`;
      } catch (e) {
        errorBody = `HTTP error fetching report! status: ${response.status} ${response.statusText || ''}`.trim();
      }
      throw new Error(errorBody);
    }

    const data: IncomeReportData = await response.json();
    if (!data || !Array.isArray(data.monthlyData)) {
       throw new Error('Invalid data structure received from API.');
    }

    // Validate structure of monthly data items
    data.monthlyData.forEach(item => {
       if (typeof item.totalInvoiced !== 'number' || typeof item.totalPaid !== 'number' || typeof item.totalDue !== 'number') {
           console.warn('Invalid item structure in monthlyData:', item);
           // Optionally, you could throw an error or provide default values
       }
    });


    return data;

  } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Fetch financial report error:", error); // Log detailed error
      // Provide a slightly more user-friendly message for the UI
      throw new Error(`Could not load report data. ${errorMessage}`);
  }
}
