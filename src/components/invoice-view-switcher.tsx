
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid } from 'lucide-react';
import { InvoiceList } from './invoice-list';
import { InvoiceGrid } from './invoice-grid'; // Import the new grid component
import type { Invoice } from '@/app/invoices/page'; // Import the Invoice type
import Link from 'next/link';

interface InvoiceViewSwitcherProps {
  invoices: Invoice[];
  fetchError: string | null;
}

export function InvoiceViewSwitcher({ invoices, fetchError }: InvoiceViewSwitcherProps) {
  const [view, setView] = useState<'list' | 'grid'>('list'); // Default to list view

  return (
    <div>
      {/* Adjust button size */}
      <div className="flex justify-end mb-4">
        <Button
          variant={view === 'list' ? 'default' : 'outline'}
          size="sm" // Use smaller icon button size
          onClick={() => setView('list')}
          className="mr-2 h-8 w-8 sm:h-9 sm:w-9" // Explicit size for consistency
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={view === 'grid' ? 'default' : 'outline'}
          size="sm" // Use smaller icon button size
          onClick={() => setView('grid')}
          aria-label="Grid view"
          className="h-8 w-8 sm:h-9 sm:w-9" // Explicit size for consistency
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>

      {/* Conditional rendering based on fetchError */}
      {fetchError ? (
         <div className="text-center text-destructive py-6 sm:py-10 px-4 rounded-md border border-destructive/50 bg-destructive/10">
            <p className="font-semibold text-base sm:text-lg mb-2">Error loading invoices</p>
            <p className="text-xs sm:text-sm">{fetchError}</p>
            {fetchError.includes("NEXT_PUBLIC_APP_URL") && (
                <p className="mt-2 sm:mt-3 text-xs text-destructive/80">
                  Please ensure the <code className="bg-destructive/20 px-1 py-0.5 rounded text-xs">NEXT_PUBLIC_APP_URL</code> environment variable is correctly set in your <code className="bg-destructive/20 px-1 py-0.5 rounded text-xs">.env.local</code> file or deployment settings. Restart your dev server after changes.
                </p>
            )}
            {fetchError.includes("Failed to construct valid API URL") && (
                <p className="mt-2 sm:mt-3 text-xs text-destructive/80">The base URL provided by <code className="bg-destructive/20 px-1 py-0.5 rounded text-xs">NEXT_PUBLIC_APP_URL</code> seems incorrect. Please verify it.</p>
            )}
             {!fetchError.includes("NEXT_PUBLIC_APP_URL") && !fetchError.includes("Failed to construct valid API URL") && (
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">Please try refreshing the page or check the server logs for more details.</p>
            )}
          </div>
      ) : invoices.length === 0 ? (
          <div className="text-center text-muted-foreground py-6 sm:py-10">
            <p className="text-sm sm:text-base">No invoices found matching the current filters.</p>
             <Link href="/invoices" passHref>
               <Button variant="link" size="sm" className="mt-2">Clear Filters</Button>
             </Link>
          </div>
        ) : (
        // Render list or grid view
        view === 'list' ? (
          <InvoiceList invoices={invoices} />
        ) : (
          // Pass invoices as initialInvoices to the grid component
          <InvoiceGrid initialInvoices={invoices} />
        )
      )}
    </div>
  );
}
