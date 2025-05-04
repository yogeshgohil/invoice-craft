
import { NextResponse, type NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/invoice';
import mongoose from 'mongoose';
import { startOfMonth, endOfMonth, format, parseISO, isValid, subMonths, startOfYear, endOfYear } from 'date-fns';

// Helper function to check DB connection state
const isConnected = () => mongoose.connection.readyState === 1;

// Define the structure for the API response
interface MonthlyIncome {
  month: string; // Format: YYYY-MM
  year: number;
  monthIndex: number; // 0-11 for sorting
  totalIncome: number;
}

interface IncomeReportResponse {
  monthlyData: MonthlyIncome[];
  totalIncomeInRange: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
}

// GET handler to retrieve income report data
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connectDB();
    if (!isConnected()) {
      throw new Error('Database connection error.');
    }

    // Get query parameters for date range
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let startDate: Date;
    let endDate: Date;

    // Validate or default dates
    if (startDateParam && isValid(parseISO(startDateParam))) {
      startDate = startOfMonth(parseISO(startDateParam));
    } else {
      // Default to the start of the current month
      startDate = startOfMonth(new Date());
    }

    if (endDateParam && isValid(parseISO(endDateParam))) {
      // Use end of the selected month
      endDate = endOfMonth(parseISO(endDateParam));
    } else {
       // Default to the end of the current month
      endDate = endOfMonth(new Date());
    }

    // Ensure end date is not before start date
    if (endDate < startDate) {
        return NextResponse.json({ message: 'End date cannot be before start date.' }, { status: 400 });
    }

    // Define the aggregation pipeline
    const pipeline = [
      // Stage 1: Filter invoices by status 'Completed' and within the date range
      // We filter by invoiceDate for simplicity, assuming payment correlates closely.
      // A more accurate report might use a dedicated 'paymentDate' field if available.
      {
        $match: {
          status: 'Completed', // Only count income from completed invoices
          invoiceDate: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      // Stage 2: Group by year and month of the invoiceDate
      {
        $group: {
          _id: {
            year: { $year: '$invoiceDate' },
            month: { $month: '$invoiceDate' },
          },
          // Sum the 'paidAmount' for each month.
          // If paidAmount isn't always set on completion, sum the items total.
          // Let's assume paidAmount reflects the income received for completed invoices.
          monthlyIncome: { $sum: '$paidAmount' }, // Or calculate from items if needed
          // If using calculated totalAmount:
          // monthlyIncome: { $sum: { $reduce: { input: "$items", initialValue: 0, in: { $add: ["$$value", { $multiply: ["$$this.quantity", "$$this.price"] }] } } } }
        },
      },
       // Stage 3: Calculate total income for the entire range
      {
          $group: {
              _id: null, // Group all documents together
              monthlyData: {
                  $push: { // Push each month's result into an array
                      year: '$_id.year',
                      monthIndex: { $subtract: ['$_id.month', 1] }, // 0-11
                      month: {
                          // Format month as YYYY-MM string
                          $dateToString: { format: '%Y-%m', date: { $dateFromParts: { 'year': '$_id.year', 'month': '$_id.month', 'day': 1 } } }
                      },
                      totalIncome: '$monthlyIncome'
                  }
              },
              totalIncomeInRange: { $sum: '$monthlyIncome' } // Sum all monthly incomes
          }
      },
      // Stage 4: Project the final structure (optional, but good practice)
      {
           $project: {
                _id: 0, // Exclude the default _id
                monthlyData: 1,
                totalIncomeInRange: 1
           }
      }
    ];

    // Execute the aggregation pipeline
    const results = await Invoice.aggregate(pipeline);

    // Aggregation returns an array, usually with one element if grouping by null
    const reportData = results[0] || { monthlyData: [], totalIncomeInRange: 0 };

     // Sort monthly data chronologically
     reportData.monthlyData.sort((a: MonthlyIncome, b: MonthlyIncome) => {
         if (a.year !== b.year) {
             return a.year - b.year;
         }
         return a.monthIndex - b.monthIndex;
     });

    const responsePayload: IncomeReportResponse = {
       monthlyData: reportData.monthlyData,
       totalIncomeInRange: reportData.totalIncomeInRange,
       startDate: startDate.toISOString(),
       endDate: endDate.toISOString(),
    };

    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching income report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
     if (errorMessage.toLowerCase().includes('database connection error')) {
       return NextResponse.json({ message: 'Database connection issue while fetching report.', error: error.name || 'DB Connection Error' }, { status: 503 });
     }
    return NextResponse.json({ message: 'Failed to fetch income report', error: errorMessage }, { status: 500 });
  }
}
      