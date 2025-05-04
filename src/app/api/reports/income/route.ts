
import { NextResponse, type NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/invoice';
import mongoose from 'mongoose';
import { startOfMonth, endOfMonth, format, parseISO, isValid } from 'date-fns';

// Helper function to check DB connection state
const isConnected = () => mongoose.connection.readyState === 1;

// Define the structure for the API response
interface MonthlyData {
  month: string; // Format: YYYY-MM
  year: number;
  monthIndex: number; // 0-11 for sorting
  totalInvoiced: number; // Total amount of all invoices created in the month
  totalPaid: number;     // Total amount paid across all invoices created in the month
  totalDue: number;      // Total amount due across all invoices created in the month
}

interface IncomeReportResponse {
  monthlyData: MonthlyData[];
  totalInvoicedInRange: number;
  totalPaidInRange: number;
  totalDueInRange: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
}

// GET handler to retrieve financial report data
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
      // Stage 1: Filter invoices by invoiceDate within the date range
      // No longer filtering by status
      {
        $match: {
          invoiceDate: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      // Stage 2: Calculate totalAmount for each invoice (as it's not stored directly)
      {
        $addFields: {
          calculatedTotalAmount: {
            $reduce: {
              input: '$items',
              initialValue: 0,
              in: { $add: ['$$value', { $multiply: ['$$this.quantity', '$$this.price'] }] }
            }
          }
        }
      },
      // Stage 3: Group by year and month of the invoiceDate
      {
        $group: {
          _id: {
            year: { $year: '$invoiceDate' },
            month: { $month: '$invoiceDate' },
          },
          // Sum the calculated total amount for each month
          monthlyInvoiced: { $sum: '$calculatedTotalAmount' },
          // Sum the paid amount for each month
          monthlyPaid: { $sum: '$paidAmount' },
          // Sum the due amount (calculatedTotal - paid) for each month
          monthlyDue: { $sum: { $subtract: ['$calculatedTotalAmount', '$paidAmount'] } },
        },
      },
       // Stage 4: Calculate totals for the entire range and format monthly data
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
                      totalInvoiced: '$monthlyInvoiced',
                      totalPaid: '$monthlyPaid',
                      totalDue: '$monthlyDue',
                  }
              },
              totalInvoicedInRange: { $sum: '$monthlyInvoiced' }, // Sum all monthly invoiced amounts
              totalPaidInRange: { $sum: '$monthlyPaid' },     // Sum all monthly paid amounts
              totalDueInRange: { $sum: '$monthlyDue' },       // Sum all monthly due amounts
          }
      },
      // Stage 5: Project the final structure
      {
           $project: {
                _id: 0, // Exclude the default _id
                monthlyData: 1,
                totalInvoicedInRange: 1,
                totalPaidInRange: 1,
                totalDueInRange: 1,
           }
      }
    ];

    // Execute the aggregation pipeline
    const results = await Invoice.aggregate(pipeline);

    // Aggregation returns an array, usually with one element if grouping by null
    const reportData = results[0] || { monthlyData: [], totalInvoicedInRange: 0, totalPaidInRange: 0, totalDueInRange: 0 };

     // Sort monthly data chronologically
     reportData.monthlyData.sort((a: MonthlyData, b: MonthlyData) => {
         if (a.year !== b.year) {
             return a.year - b.year;
         }
         return a.monthIndex - b.monthIndex;
     });

    // Ensure monthly data has all required fields, defaulting to 0 if somehow missing
    const formattedMonthlyData = reportData.monthlyData.map((m: any) => ({
        month: m.month,
        year: m.year,
        monthIndex: m.monthIndex,
        totalInvoiced: m.totalInvoiced ?? 0,
        totalPaid: m.totalPaid ?? 0,
        totalDue: m.totalDue ?? 0,
    }));

    const responsePayload: IncomeReportResponse = {
       monthlyData: formattedMonthlyData,
       totalInvoicedInRange: reportData.totalInvoicedInRange,
       totalPaidInRange: reportData.totalPaidInRange,
       totalDueInRange: reportData.totalDueInRange,
       startDate: startDate.toISOString(),
       endDate: endDate.toISOString(),
    };

    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching financial report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
     if (errorMessage.toLowerCase().includes('database connection error')) {
       return NextResponse.json({ message: 'Database connection issue while fetching report.', error: error.name || 'DB Connection Error' }, { status: 503 });
     }
    return NextResponse.json({ message: 'Failed to fetch financial report', error: errorMessage }, { status: 500 });
  }
}
      
