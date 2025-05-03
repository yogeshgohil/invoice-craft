
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-12 lg:p-24 bg-background">
        <Card className="w-full max-w-6xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold text-primary">Saved Invoices</CardTitle>
                <Skeleton className="h-10 w-[180px] rounded-md" /> {/* Skeleton for the button */}
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Invoice #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Invoice Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total Amount</TableHead>
                            <TableHead className="text-right">Amount Due</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, index) => ( // Render 5 skeleton rows
                            <TableRow key={index}>
                                <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[90px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[90px]" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-[70px] ml-auto" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-[70px] ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </main>
    )
}
