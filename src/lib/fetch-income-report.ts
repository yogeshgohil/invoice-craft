
interface MonthlyIncome {
  month: string; // Format: YYYY-MM
  year: number;
  monthIndex: number;
  totalIncome: number;
}

export interface IncomeReportData {
  monthlyData: MonthlyIncome[];
  totalIncomeInRange: number;
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

  const apiUrl = `/api/reports/income?${queryParams.toString()}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store', // Fetch fresh data for reports
    });

    if (!response.ok) {
      let errorBody = 'Failed to fetch income report.';
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

    return data;

  } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Fetch income report error:", error); // Log detailed error
      // Provide a slightly more user-friendly message for the UI
      throw new Error(`Could not load report data. ${errorMessage}`);
  }
}
