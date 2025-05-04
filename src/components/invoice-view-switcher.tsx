
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid, PlusCircle } from 'lucide-react'; // Added PlusCircle
import { InvoiceList } from './invoice-list';
import { InvoiceGrid } from './invoice-grid'; // Import the new grid component
import type { Invoice } from '@/app/invoices/page'; // Import the Invoice type
import Link from 'next/link';

interface InvoiceViewSwitcherProps {
  invoices: Invoice[];
  fetchError: string | null;
  onInvoiceDeleted?: (invoiceId: string) => void; // Accept callback prop
}

export function InvoiceViewSwitcher({ invoices, fetchError, onInvoiceDeleted }: InvoiceViewSwitcherProps) {
  const [view, setView] = useState<'list' | 'grid'>('list'); // Default to list view

  return (
    <div>
       {/* Use flex-col on small screens, adjust spacing */}
       <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-3 gap-2"> {/* Adjusted layout, reduced margin */}
          {/* Create Button and View Toggle Group */}
         <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch">
            {/* Create New Bill Button */}
            <Link href="/invoices/new" passHref legacyBehavior>
              <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Create New Bill {/* Adjusted icon margin/size */}
              </Button>
            </Link>
         </div>

         {/* View Toggle Buttons - Align end */}
         <div className="flex items-center justify-end sm:justify-end"> {/* Align end */}
             <Button
               variant={view === 'list' ? 'default' : 'outline'}
               size="icon" // Use icon size for compact buttons
               onClick={() => setView('list')}
               className="mr-1.5 h-8 w-8" // Explicit smaller size
               aria-label="List view"
             >
               <List className="h-4 w-4" /> {/* Keep icon size */}
             </Button>
             <Button
               variant={view === 'grid' ? 'default' : 'outline'}
               size="icon" // Use icon size for compact buttons
               onClick={() => setView('grid')}
               aria-label="Grid view"
               className="h-8 w-8" // Explicit smaller size
             >
               <LayoutGrid className="h-4 w-4" /> {/* Keep icon size */}
             </Button>
         </div>
      </div>

      {/* Conditional rendering based on fetchError */}
      {fetchError ? (
         <div className="text-center text-destructive py-4 sm:py-8 px-3 rounded-md border border-destructive/50 bg-destructive/10"> {/* Reduced padding */}
            <p className="font-semibold text-sm sm:text-base mb-1">Error loading invoices</p> {/* Smaller text, reduced margin */}
            <p className="text-[10px] sm:text-xs">{fetchError}</p> {/* Smaller text */}
            {fetchError.includes("NEXT_PUBLIC_APP_URL") && (
                <p className="mt-1.5 sm:mt-2 text-[10px] text-destructive/80"> {/* Reduced margin/size */}
                  Please ensure the <code className="bg-destructive/20 px-1 py-0.5 rounded text-[10px]">NEXT_PUBLIC_APP_URL</code> environment variable is correctly set in your <code className="bg-destructive/20 px-1 py-0.5 rounded text-[10px]">.env.local</code> file or deployment settings. Restart your dev server after changes.
                </p>
            )}
            {fetchError.includes("Failed to construct valid API URL") && (
                <p className="mt-1.5 sm:mt-2 text-[10px] text-destructive/80">The base URL provided by <code className="bg-destructive/20 px-1 py-0.5 rounded text-[10px]">NEXT_PUBLIC_APP_URL</code> seems incorrect. Please verify it.</p>
            )}
             {!fetchError.includes("NEXT_PUBLIC_APP_URL") && !fetchError.includes("Failed to construct valid API URL") && (
                <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-muted-foreground">Please try refreshing the page or check the server logs for more details.</p>
            )}
          </div>
      ) : invoices.length === 0 ? (
          <div className="text-center text-muted-foreground py-4 sm:py-8"> {/* Reduced padding */}
            <p className="text-xs sm:text-sm">No invoices found matching the current filters.</p> {/* Smaller text */}
             <Link href="/invoices" passHref>
               <Button variant="link" size="sm" className="mt-1 text-xs">Clear Filters</Button> {/* Smaller button/text */}
             </Link>
          </div>
        ) : (
        // Render list or grid view
        view === 'list' ? (
          <InvoiceList invoices={invoices} onInvoiceDeleted={onInvoiceDeleted} /> // Pass delete handler
        ) : (
          // Pass invoices as initialInvoices to the grid component
          <InvoiceGrid initialInvoices={invoices} />
        )
      )}
    </div>
  );
}

