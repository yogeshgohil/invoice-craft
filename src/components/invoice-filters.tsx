
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, X } from 'lucide-react';
import { format, isValid, parse } from 'date-fns';
import { cn } from '@/lib/utils';

const invoiceStatuses = ["Pending", "In Process", "Hold", "Cancelled", "Completed"];

interface InvoiceFiltersProps {
    initialFilters: {
        customerName: string;
        status: string;
        dueDateStart: string;
        dueDateEnd: string;
    }
}

export function InvoiceFilters({ initialFilters }: InvoiceFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [customerName, setCustomerName] = useState(initialFilters.customerName);
    const [status, setStatus] = useState(initialFilters.status);
    const [dueDateStart, setDueDateStart] = useState<Date | undefined>(
        initialFilters.dueDateStart && isValid(parse(initialFilters.dueDateStart, 'yyyy-MM-dd', new Date()))
        ? parse(initialFilters.dueDateStart, 'yyyy-MM-dd', new Date())
        : undefined
    );
    const [dueDateEnd, setDueDateEnd] = useState<Date | undefined>(
       initialFilters.dueDateEnd && isValid(parse(initialFilters.dueDateEnd, 'yyyy-MM-dd', new Date()))
        ? parse(initialFilters.dueDateEnd, 'yyyy-MM-dd', new Date())
        : undefined
    );
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Debounce function
    const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        return (...args: Parameters<F>): Promise<ReturnType<F>> =>
            new Promise((resolve) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(() => {
                resolve(func(...args));
            }, waitFor);
        });
    };

    // Update URL search parameters
    const updateSearchParams = useCallback((newParams: Record<string, string>) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));

        // Set new values
        Object.entries(newParams).forEach(([key, value]) => {
            if (value) {
                current.set(key, value);
            } else {
                current.delete(key); // Remove if value is empty/undefined
            }
        });

        const search = current.toString();
        const query = search ? `?${search}` : "";
        // Use router.push to trigger navigation and re-fetch data on the server component
        router.push(`/invoices${query}`);
    }, [searchParams, router]);

    // Debounced version of updateSearchParams for text input
    const debouncedUpdateSearchParams = useCallback(debounce(updateSearchParams, 500), [updateSearchParams]);

    // Handlers for filter changes
    const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomerName(value);
        debouncedUpdateSearchParams({ customerName: value });
    };

    const handleStatusChange = (value: string) => {
        const newStatus = value === 'all' ? '' : value; // Treat 'all' as clearing the filter
        setStatus(newStatus);
        updateSearchParams({ status: newStatus });
    };

    const handleDueDateStartChange = (date: Date | undefined) => {
        setDueDateStart(date);
        updateSearchParams({ dueDateStart: date ? format(date, 'yyyy-MM-dd') : '' });
    };

     const handleDueDateEndChange = (date: Date | undefined) => {
        setDueDateEnd(date);
        updateSearchParams({ dueDateEnd: date ? format(date, 'yyyy-MM-dd') : '' });
     };

    const clearFilters = () => {
        setCustomerName('');
        setStatus('');
        setDueDateStart(undefined);
        setDueDateEnd(undefined);
        router.push('/invoices'); // Navigate to base URL to clear all params
    };

    // Prevent rendering on server to avoid hydration issues with Date
    if (!isClient) {
        // Render minimal placeholders or null during SSR/initial render
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-end mb-4 sm:mb-6 animate-pulse"> {/* Reduced gap/margin */}
                 <div className="h-9 bg-muted rounded-md"></div> {/* Reduced height */}
                 <div className="h-9 bg-muted rounded-md"></div>
                 <div className="h-9 bg-muted rounded-md"></div>
                 <div className="h-9 bg-muted rounded-md"></div>
                 <div className="h-9 bg-muted rounded-md"></div>
            </div>
        );
    }


    return (
         // Use single column layout on mobile, adjust gaps
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 items-end mb-4 sm:mb-6"> {/* Reduced gap/margin */}
            {/* Customer Name Filter */}
            <div className="space-y-1">
                <Label htmlFor="customerNameFilter" className="text-xs sm:text-sm">Customer Name</Label> {/* Smaller label */}
                <Input
                    id="customerNameFilter"
                    placeholder="Filter by name..."
                    value={customerName}
                    onChange={handleCustomerNameChange}
                    className="h-9 text-sm" // Adjust height and font size
                />
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
                <Label htmlFor="statusFilter" className="text-xs sm:text-sm">Status</Label> {/* Smaller label */}
                <Select value={status || 'all'} onValueChange={handleStatusChange}>
                    <SelectTrigger id="statusFilter" className="h-9 text-sm"> {/* Adjust height and font size */}
                        <SelectValue placeholder="Filter by status..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {invoiceStatuses.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Due Date Start Filter */}
            <div className="space-y-1">
                 <Label htmlFor="dueDateStartFilter" className="text-xs sm:text-sm">Due Date From</Label> {/* Smaller label */}
                 <Popover>
                     <PopoverTrigger asChild>
                         <Button
                             id="dueDateStartFilter"
                             variant={"outline"}
                             className={cn(
                                 "w-full justify-start text-left font-normal h-9 text-xs", // Adjust height and text size
                                 !dueDateStart && "text-muted-foreground"
                             )}
                         >
                             <CalendarIcon className="mr-1 h-3.5 w-3.5" /> {/* Adjust icon size/margin */}
                             {dueDateStart ? format(dueDateStart, "PPP") : <span>Start date</span>} {/* Shorter placeholder */}
                         </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0">
                         <Calendar
                             mode="single"
                             selected={dueDateStart}
                             onSelect={handleDueDateStartChange}
                             initialFocus
                             disabled={(date) =>
                                dueDateEnd ? date > dueDateEnd : false
                             }
                         />
                     </PopoverContent>
                 </Popover>
            </div>

             {/* Due Date End Filter */}
             <div className="space-y-1">
                 <Label htmlFor="dueDateEndFilter" className="text-xs sm:text-sm">Due Date To</Label> {/* Smaller label */}
                 <Popover>
                     <PopoverTrigger asChild>
                         <Button
                             id="dueDateEndFilter"
                             variant={"outline"}
                             className={cn(
                                 "w-full justify-start text-left font-normal h-9 text-xs", // Adjust height and text size
                                 !dueDateEnd && "text-muted-foreground"
                             )}
                         >
                             <CalendarIcon className="mr-1 h-3.5 w-3.5" /> {/* Adjust icon size/margin */}
                             {dueDateEnd ? format(dueDateEnd, "PPP") : <span>End date</span>} {/* Shorter placeholder */}
                         </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0">
                         <Calendar
                             mode="single"
                             selected={dueDateEnd}
                             onSelect={handleDueDateEndChange}
                             initialFocus
                             disabled={(date) =>
                                dueDateStart ? date < dueDateStart : false
                             }
                         />
                     </PopoverContent>
                 </Popover>
             </div>

            {/* Clear Filters Button */}
             {/* Make full width on mobile */}
             <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full h-9 lg:w-auto lg:h-10 self-end mt-1 sm:mt-0 lg:mt-auto text-xs sm:text-sm" // Full width on mobile, adjust margins/text size
                disabled={!customerName && !status && !dueDateStart && !dueDateEnd} // Disable if no filters active
            >
                 <X className="mr-1 h-3.5 w-3.5" /> Clear Filters {/* Adjust icon size/margin */}
             </Button>
        </div>
    );
}

