
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
   const router = useRouter();

   useEffect(() => {
     // Redirect to the invoices page immediately on mount
     router.replace('/invoices');
   }, [router]);

  // Display a loading indicator while redirecting
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-12 lg:p-24 bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Loading invoices...</p>
        </div>
    </main>
  );
}
