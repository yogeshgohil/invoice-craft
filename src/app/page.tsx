
'use client'; // Keep as client for now due to form interactions

import { InvoiceForm } from '@/components/invoice-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { List } from 'lucide-react'; // Removed LogOut icon
// Removed: import { useAuth } from '@/context/AuthContext'; // Import useAuth

export default function Home() {
   // Removed: const { logout, username } = useAuth(); // Get logout function and username

  return (
    // Use responsive padding: smaller padding on mobile, larger on desktop
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-12 lg:p-24 bg-background">
      {/* Card takes full width on small screens, max-width on larger screens */}
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
             <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <CardTitle className="text-xl sm:text-2xl font-bold text-primary">Create Bill</CardTitle>
                {/* Removed username display */}
             </div>
             <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                 <Link href="/invoices" passHref legacyBehavior>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <List className="mr-2 h-4 w-4" /> View Saved Invoices
                    </Button>
                 </Link>
                  {/* Removed Logout Button */}
             </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <InvoiceForm />
        </CardContent>
      </Card>
    </main>
  );
}
