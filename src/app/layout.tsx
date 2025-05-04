
import type { Metadata } from 'next';
// Removed Geist font imports: import { Geist_Sans, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { AuthProvider } from '@/contexts/auth-context'; // Import AuthProvider
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'; // Import Sidebar components
import { SidebarNav } from '@/components/sidebar-nav'; // Import the new SidebarNav

// Removed Geist font instantiations

export const metadata: Metadata = {
  title: 'Create Bill', // Update title
  description: 'Generate and manage invoices easily.', // Update description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        // Removed font variables from className
        className="antialiased" // Use default Tailwind fonts
        suppressHydrationWarning // Add suppression here for body tag modifications
      >
        <AuthProvider> {/* Wrap children with AuthProvider */}
          <SidebarProvider defaultOpen={true}> {/* Wrap with SidebarProvider */}
            <SidebarNav /> {/* Add the Sidebar */}
            <SidebarInset> {/* Wrap the main content */}
              {children}
            </SidebarInset>
            <Toaster /> {/* Add Toaster here */}
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

