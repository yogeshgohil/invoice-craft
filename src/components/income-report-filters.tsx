

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, FilterX } from 'lucide-react';
import { format, isValid, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

interface IncomeReportFiltersProps {
  initialStartDate: string;
  initialEndDate: string;
}

export function IncomeReportFilters({ initialStartDate, initialEndDate }: IncomeReportFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  // Parse initial dates safely
  const parseDate = (dateStr: string): Date | undefined => {
    try {
      const parsed = parseISO(dateStr);
      return isValid(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: parseDate(initialStartDate),
    to: parseDate(initialEndDate),
  });

  useEffect(() => {
      setIsClient(true);
      // Sync state with URL params on mount
      setDateRange({
        from: parseDate(searchParams.get('startDate') || initialStartDate),
        to: parseDate(searchParams.get('endDate') || initialEndDate),
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Depend on searchParams directly

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);

    // Update URL search parameters
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (range?.from) {
      current.set('startDate', format(startOfMonth(range.from), 'yyyy-MM-dd'));
    } else {
      current.delete('startDate');
    }
    if (range?.to) {
      // Ensure we use the end of the month for the 'to' date for filtering logic
      current.set('endDate', format(endOfMonth(range.to), 'yyyy-MM-dd'));
    } else {
      // If only 'from' is selected, use end of that month as default 'to'
      if(range?.from) {
         current.set('endDate', format(endOfMonth(range.from), 'yyyy-MM-dd'));
      } else {
         current.delete('endDate');
      }
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`/reports/income${query}`, { scroll: false }); // Use push for navigation, scroll: false prevents jumping
  };

   const clearFilters = () => {
      setDateRange(undefined);
      router.push('/reports/income', { scroll: false });
   };

   // Prevent rendering on server to avoid hydration mismatches with Date
   if (!isClient) {
      return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <Skeleton className="h-9 w-full sm:w-64" />
              <Skeleton className="h-9 w-24" />
          </div>
      );
   }

  return (
     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
       <div className="grid gap-2 w-full sm:w-auto">
        <Label htmlFor="date-range-picker" className="text-sm">Select Date Range</Label>
         <Popover>
           <PopoverTrigger asChild>
             <Button
               id="date-range-picker"
               variant={"outline"}
               className={cn(
                 "w-full sm:w-[300px] justify-start text-left font-normal",
                 !dateRange && "text-muted-foreground"
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
               onSelect={handleDateChange}
               numberOfMonths={2}
             />
           </PopoverContent>
         </Popover>
       </div>
        <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="w-full sm:w-auto self-end sm:self-center mt-1 sm:mt-0" // Align button appropriately
            disabled={!dateRange?.from && !dateRange?.to} // Disable if no dates selected
        >
            <FilterX className="mr-2 h-4 w-4" /> Clear Range
        </Button>
     </div>
  );
}

