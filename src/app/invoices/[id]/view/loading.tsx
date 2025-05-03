
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

export default function Loading() {
  // Skeleton mimicking the InvoicePreview structure
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-12 lg:p-24 bg-background">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2 border-b mb-4">
          <Skeleton className="h-7 w-48 rounded" /> {/* Skeleton for title */}
           <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
               <Skeleton className="h-9 w-full sm:w-40 rounded-md" /> {/* Back button */}
               <Skeleton className="h-9 w-full sm:w-24 rounded-md" /> {/* Print button */}
               {/* <Skeleton className="h-9 w-full sm:w-36 rounded-md" /> */} {/* Download button */}
           </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="animate-pulse space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
              <div className="mb-4 sm:mb-0">
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0">
                <Skeleton className="h-6 w-40 mb-1" />
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

             <Skeleton className="h-px w-full my-6" />

            {/* Customer Info Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
              <div>
                <Skeleton className="h-5 w-20 mb-2" />
                <Skeleton className="h-5 w-36 mb-1" />
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="text-left sm:text-right mt-3 sm:mt-0">
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>

            {/* Items Table Skeleton */}
            <div className="mb-6">
                <div className="flex justify-between bg-muted p-2 rounded-t-md">
                    <Skeleton className="h-5 w-2/5"/>
                    <Skeleton className="h-5 w-1/6 text-right"/>
                    <Skeleton className="h-5 w-1/6 text-right"/>
                    <Skeleton className="h-5 w-1/6 text-right"/>
                </div>
                <div className="border border-t-0 rounded-b-md p-2 space-y-2">
                    {[1, 2].map(i => ( // Simulate 2 item rows
                        <div key={i} className="flex justify-between items-center border-b last:border-b-0 py-1">
                            <Skeleton className="h-4 w-2/5"/>
                            <Skeleton className="h-4 w-1/6 text-right"/>
                            <Skeleton className="h-4 w-1/6 text-right"/>
                            <Skeleton className="h-4 w-1/6 text-right"/>
                        </div>
                    ))}
                </div>
            </div>

            {/* Totals Skeleton */}
             <div className="flex flex-col items-end mb-6">
                <div className="w-full max-w-sm space-y-1">
                    <div className="flex justify-between"><Skeleton className="h-4 w-24"/><Skeleton className="h-4 w-20"/></div>
                    <div className="flex justify-between"><Skeleton className="h-4 w-24"/><Skeleton className="h-4 w-20"/></div>
                     <Skeleton className="h-px w-full my-2" />
                    <div className="flex justify-between"><Skeleton className="h-6 w-24"/><Skeleton className="h-6 w-24"/></div>
                </div>
             </div>

            {/* Notes Skeleton */}
            <div>
                <Skeleton className="h-5 w-16 mb-2" />
                <Skeleton className="h-12 w-full" />
            </div>

             {/* Footer Skeleton */}
             <div className="mt-12 text-center">
                 <Skeleton className="h-4 w-32 mx-auto" />
             </div>

          </div>
        </CardContent>
      </Card>
    </main>
  );
}
