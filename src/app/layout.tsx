
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { AuthProvider } from '@/contexts/auth-context'; // Import AuthProvider
import type { ReactNode } from 'react'; // Import ReactNode
import { Suspense } from 'react'; // Import Suspense

export const metadata: Metadata = {
  title: 'Create Bill', // Update title
  description: 'Generate and manage invoices easily.', // Update description
};

// Simplified LayoutContent without sidebar/nav logic
function LayoutContent({ children }: { children: ReactNode }) {
    return (
        <>
            {/* Adjust padding as needed since SidebarInset is removed */}
            {/* Reduced padding */}
            <main className="p-2 sm:p-4 min-h-screen"> {/* Add padding directly */}
                {children}
            </main>
            <Toaster /> {/* Add Toaster here */}
        </>
    );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased" // Use default Tailwind fonts
        suppressHydrationWarning // Add suppression here for body tag modifications
      >
        <AuthProvider> {/* Wrap children with AuthProvider */}
           {/* Wrap LayoutContent in Suspense for potential async operations */}
           <Suspense fallback={<div>Loading...</div>}> {/* Consider a better fallback/skeleton */}
               <LayoutContent>{children}</LayoutContent> {/* Use the wrapper component */}
           </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}

