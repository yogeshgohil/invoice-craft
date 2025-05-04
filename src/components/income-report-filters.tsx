
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, FilterX, Filter } from 'lucide-react'; // Added Filter icon
import { format, isValid, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface IncomeReportFiltersProps {
  initialStartDate: string;
  initialEndDate: string;
}

export function IncomeReportFilters({ initialStartDate, initialEndDate }: IncomeReportFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  // Parse initial dates safely, falling back to current month if invalid/missing
  const parseDate = (dateStr: string | null | undefined, fallback: Date): Date => {
    if (!dateStr) return fallback;
    try {
      const parsed = parseISO(dateStr);
      return isValid(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const defaultStart = startOfMonth(new Date());
  const defaultEnd = endOfMonth(new Date());

  // Initialize state with URL params or current month defaults
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
      from: parseDate(searchParams.get('startDate'), defaultStart),
      to: parseDate(searchParams.get('endDate'), defaultEnd),
  }));

  useEffect(() => {
      setIsClient(true);
      // Sync state with URL params on mount if they exist
      const urlStartDate = searchParams.get('startDate');
      const urlEndDate = searchParams.get('endDate');
      if (urlStartDate || urlEndDate) {
         setDateRange({
            from: parseDate(urlStartDate, defaultStart),
            to: parseDate(urlEndDate, defaultEnd),
         });
      } else {
         // If no URL params, ensure state reflects default current month
         setDateRange({ from: defaultStart, to: defaultEnd });
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Handler for date selection change (updates state only)
  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  // Handler for applying filters (updates URL)
  const handleFilterApply = () => {
    const current = new URLSearchParams(); // Start fresh

    if (dateRange?.from) {
      current.set('startDate', format(startOfMonth(dateRange.from), 'yyyy-MM-dd'));
    }
    if (dateRange?.to) {
      // Use end of the selected month for the 'to' date
      current.set('endDate', format(endOfMonth(dateRange.to), 'yyyy-MM-dd'));
    } else if (dateRange?.from) {
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
      // Navigate to base URL to reflect default state in URL too
      router.push('/reports/income', { scroll: false });
   };

   // Prevent rendering on server to avoid hydration mismatches with Date
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
                 !dateRange?.from && "text-muted-foreground" // Adjust condition slightly
               )}
             >
               <CalendarIcon className="mr-2 h-4 w-4" />
               {dateRange?.from ? (
                 dateRange.to ? (
                   <>
                     {format(dateRange.from, "LLL dd, y")} -{" "}
                     {format(dateRange.to, "LLL dd, y")}
                   </>
                 ) : (
                   format(dateRange.from, "LLL dd, y")
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
               defaultMonth={dateRange?.from || new Date()}
               selected={dateRange}
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
           disabled={!dateRange?.from} // Disable if no start date selected
        >
            <Filter className="mr-2 h-4 w-4" /> Apply Filter
        </Button>
        {/* Clear Filter Button */}
        <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="w-full sm:w-auto" // Full width on mobile
            disabled={!dateRange?.from && !dateRange?.to && !searchParams.get('startDate') && !searchParams.get('endDate')} // Disable if no dates selected AND no params in URL
        >
            <FilterX className="mr-2 h-4 w-4" /> Clear Range
        </Button>
     </div>
  );
}

