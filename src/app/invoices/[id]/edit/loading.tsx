
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

export default function Loading() {
  // Skeleton mimicking the InvoiceForm structure
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-12 lg:p-24 bg-background">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2 border-b mb-4">
          <Skeleton className="h-7 w-48 rounded" /> {/* Skeleton for title */}
          <Skeleton className="h-9 w-40 rounded-md" /> {/* Skeleton for back button */}
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Customer Info Skeleton */}
            <Card className="bg-card animate-pulse">
              <CardHeader className="p-4 sm:p-6"><Skeleton className="h-6 w-1/2 bg-muted rounded" /></CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-10 bg-muted rounded" />
                  <Skeleton className="h-10 bg-muted rounded" />
                  <Skeleton className="h-20 md:col-span-2 bg-muted rounded" />
              </CardContent>
            </Card>

            {/* Invoice Details Skeleton */}
            <Card className="bg-card animate-pulse">
              <CardHeader className="p-4 sm:p-6"><Skeleton className="h-6 w-1/2 bg-muted rounded" /></CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Skeleton className="h-10 bg-muted rounded" />
                  <Skeleton className="h-10 bg-muted rounded" />
                  <Skeleton className="h-10 bg-muted rounded" />
                  <Skeleton className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>

            {/* Invoice Items Skeleton */}
            <Card className="bg-card animate-pulse">
              <CardHeader className="p-4 sm:p-6"><Skeleton className="h-6 w-1/2 bg-muted rounded" /></CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                  {/* Simulate one item row */}
                  <div className="flex flex-col md:flex-row gap-3 md:gap-2 border p-3 sm:p-4 rounded-md">
                     <Skeleton className="h-10 flex-grow bg-muted rounded" />
                     <Skeleton className="h-10 w-full md:w-24 bg-muted rounded" />
                     <Skeleton className="h-10 w-full md:w-32 bg-muted rounded" />
                     <Skeleton className="h-9 w-full md:w-9 bg-muted rounded" />
                  </div>
                  <Skeleton className="h-9 w-32 bg-muted rounded" /> {/* Add item button skeleton */}
              </CardContent>
            </Card>

            {/* Payment Details Skeleton */}
             <Card className="bg-card animate-pulse">
              <CardHeader className="p-4 sm:p-6"><Skeleton className="h-6 w-1/2 bg-muted rounded" /></CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-10 bg-muted rounded" />
                  <Skeleton className="h-10 bg-muted rounded" />
                  <Skeleton className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>

            {/* Notes Skeleton */}
            <Card className="bg-card animate-pulse">
                <CardHeader className="p-4 sm:p-6"><Skeleton className="h-6 w-1/2 bg-muted rounded" /></CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                    <Skeleton className="h-20 w-full bg-muted rounded" />
                </CardContent>
            </Card>

          </div>
        </CardContent>
         <CardFooter className="flex flex-col sm:flex-row sm:flex-wrap justify-end gap-2 sm:gap-3 pt-6 px-4 sm:px-6">
            <Skeleton className="h-9 w-full sm:w-32 rounded-md" />
            <Skeleton className="h-9 w-full sm:w-32 rounded-md" />
            <Skeleton className="h-9 w-full sm:w-36 rounded-md" />
        </CardFooter>
      </Card>
    </main>
  );
}
