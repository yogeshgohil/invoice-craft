
'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
  }, [error])

  return (
     <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-12 lg:p-24 bg-background">
       <Card className="w-full max-w-md shadow-lg border-destructive">
         <CardHeader>
           <CardTitle className="text-center text-destructive text-xl">Something went wrong!</CardTitle>
         </CardHeader>
         <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
                {error.message || 'An unexpected error occurred while loading the invoice details.'}
            </p>
           <div className="flex flex-col sm:flex-row justify-center gap-2">
               <Button
                 onClick={
                   // Attempt to recover by trying to re-render the segment
                   () => reset()
                 }
                 variant="destructive"
               >
                 Try again
               </Button>
                <Link href="/invoices" passHref>
                    <Button variant="outline">
                       <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
                    </Button>
                </Link>
           </div>
         </CardContent>
       </Card>
     </main>
  )
}
