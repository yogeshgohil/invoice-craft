
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { AuthProvider } from '@/contexts/auth-context'; // Import AuthProvider
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'; // Import Sidebar components
import { SidebarNav } from '@/components/sidebar-nav'; // Import the SidebarNav
import { MobileNav } from '@/components/mobile-nav'; // Import the new MobileNav
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile hook
import { Suspense } from 'react'; // Import Suspense for loading boundary
import type { ReactNode } from 'react'; // Import ReactNode

export const metadata: Metadata = {
  title: 'Create Bill', // Update title
  description: 'Generate and manage invoices easily.', // Update description
};

// Add 'use client' because this component uses the useIsMobile hook
function LayoutContent({ children }: { children: ReactNode }) {
  'use client'; // <-- Add this directive

  const isMobile = useIsMobile();

  // While isMobile is undefined (during SSR or initial client render), show a loading state or nothing
  if (isMobile === undefined) {
     // You could return a loading skeleton or null here
     // Returning null might be better to avoid layout shifts
     return null;
  }

  return (
    <SidebarProvider defaultOpen={false}> {/* Default to collapsed */}
      {isMobile ? <MobileNav /> : <SidebarNav />} {/* Conditional Rendering */}
      {/* Adjust padding for SidebarInset */}
      <SidebarInset className="p-2 sm:p-4 md:p-6"> {/* Add responsive padding */}
        {children}
      </SidebarInset>
      <Toaster /> {/* Add Toaster here */}
    </SidebarProvider>
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
           {/* Wrap LayoutContent in Suspense to handle the initial undefined state of isMobile */}
           <Suspense fallback={<div>Loading...</div>}> {/* Consider a better fallback/skeleton */}
               <LayoutContent>{children}</LayoutContent> {/* Use the wrapper component */}
           </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}

