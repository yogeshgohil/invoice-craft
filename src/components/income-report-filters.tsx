'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, FilterX, Filter } from 'lucide-react'; // Added Filter icon
import { format, isValid, parse, startOfMonth, endOfMonth } from 'date-fns'; // Import parse
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface IncomeReportFiltersProps {
  initialStartDate: string; // Expect YYYY-MM-DD
  initialEndDate: string;   // Expect YYYY-MM-DD
}

export function IncomeReportFilters({ initialStartDate, initialEndDate }: IncomeReportFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  // Helper to parse YYYY-MM-DD string to Date, falling back gracefully
  const parseDateString = (dateStr: string | null | undefined, fallbackDate: Date): Date => {
      if (dateStr) {
          const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
          if (isValid(parsed)) {
              return parsed;
          }
      }
      return fallbackDate;
  };

  const defaultStart = startOfMonth(new Date());
  const defaultEnd = endOfMonth(new Date());

  // Initialize state based on props (which reflect URL or defaults from page)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
      const fromDate = parseDateString(initialStartDate, defaultStart);
      const toDate = parseDateString(initialEndDate, defaultEnd);
      // Ensure 'to' is not before 'from' if parsing fails weirdly
      return {
          from: fromDate,
          to: toDate >= fromDate ? toDate : endOfMonth(fromDate),
      };
  });

  useEffect(() => {
      setIsClient(true);
      // Sync state with URL params *if they differ from initial props*
      // This handles cases where the user navigates back/forward
      const urlStartDate = searchParams.get('startDate');
      const urlEndDate = searchParams.get('endDate');

      if (urlStartDate !== initialStartDate || urlEndDate !== initialEndDate) {
           const fromDate = parseDateString(urlStartDate, defaultStart);
           const toDate = parseDateString(urlEndDate, defaultEnd);
           setDateRange({
               from: fromDate,
               to: toDate >= fromDate ? toDate : endOfMonth(fromDate),
           });
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, initialStartDate, initialEndDate]); // Rerun if props or searchParams change

  // Handler for date selection change (updates state only)
  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  // Handler for applying filters (updates URL)
  const handleFilterApply = () => {
    const current = new URLSearchParams(); // Start fresh

    // Format dates back to YYYY-MM-DD for URL parameters
    if (dateRange?.from && isValid(dateRange.from)) {
      current.set('startDate', format(startOfMonth(dateRange.from), 'yyyy-MM-dd'));
    }
    if (dateRange?.to && isValid(dateRange.to)) {
      // Use end of the selected month for the 'to' date
      current.set('endDate', format(endOfMonth(dateRange.to), 'yyyy-MM-dd'));
    } else if (dateRange?.from && isValid(dateRange.from)) {
        // Default 'to' to end of 'from' month if only 'from' is selected
       current.set('endDate', format(endOfMonth(dateRange.from), 'yyyy-MM-dd'));
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`/reports/income${query}`, { scroll: false });
  };


   const clearFilters = () => {
      // Reset state to current month defaults
      setDateRange({ from: defaultStart, to: defaultEnd });
      // Navigate to base URL to clear URL params
      router.push('/reports/income', { scroll: false });
   };

   // Prevent rendering date-dependent UI on server
   if (!isClient) {
      return (
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 mb-4">
              <div className="grid gap-2 w-full sm:w-auto">
                 <Skeleton className="h-4 w-24" />
                 <Skeleton className="h-9 w-full sm:w-64" />
              </div>
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
          </div>
      );
   }

   const displayFrom = dateRange?.from && isValid(dateRange.from) ? format(dateRange.from, "LLL dd, y") : '';
   const displayTo = dateRange?.to && isValid(dateRange.to) ? format(dateRange.to, "LLL dd, y") : '';

  return (
     <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 mb-4">
       <div className="grid gap-2 w-full sm:w-auto">
        <Label htmlFor="date-range-picker" className="text-sm">Select Date Range</Label>
         <Popover>
           <PopoverTrigger asChild>
             <Button
               id="date-range-picker"
               variant={"outline"}
               className={cn(
                 "w-full sm:w-[300px] justify-start text-left font-normal",
                 !dateRange?.from && "text-muted-foreground"
               )}
             >
               <CalendarIcon className="mr-2 h-4 w-4" />
               {displayFrom ? (
                 displayTo ? (
                   <>
                     {displayFrom} - {displayTo}
                   </>
                 ) : (
                   displayFrom
                 )
               ) : (
                 <span>Pick a date range</span>
               )}
             </Button>
           </PopoverTrigger>
           <PopoverContent className="w-auto p-0" align="start">
             <Calendar
               initialFocus
               mode="range"
               // Use valid dates for defaultMonth, selected
               defaultMonth={dateRange?.from && isValid(dateRange.from) ? dateRange.from : defaultStart}
               selected={dateRange?.from && isValid(dateRange.from) ? dateRange : { from: defaultStart, to: defaultEnd }}
               onSelect={handleDateChange} // Update state on select
               numberOfMonths={2}
             />
           </PopoverContent>
         </Popover>
       </div>
        {/* Apply Filter Button */}
        <Button
           onClick={handleFilterApply}
           size="sm"
           className="w-full sm:w-auto" // Full width on mobile
           // Disable if 'from' date is missing or invalid
           disabled={!dateRange?.from || !isValid(dateRange.from)}
        >
            <Filter className="mr-2 h-4 w-4" /> Apply Filter
        </Button>
        {/* Clear Filter Button */}
        <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="w-full sm:w-auto" // Full width on mobile
            // Disable if state reflects default AND no params in URL
            disabled={
                dateRange?.from?.getTime() === defaultStart.getTime() &&
                dateRange?.to?.getTime() === defaultEnd.getTime() &&
                !searchParams.get('startDate') && !searchParams.get('endDate')
            }
        >
            <FilterX className="mr-2 h-4 w-4" /> Clear Range
        </Button>
     </div>
  );
}
