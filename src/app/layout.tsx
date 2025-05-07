
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context'; // Import AuthProvider
import type { ReactNode } from 'react';
import { ClientLayout } from '@/components/client-layout'; // Import the new client layout component

// Metadata can only be exported from Server Components
export const metadata: Metadata = {
  title: 'Create Bill', // Update title
  description: 'Generate and manage invoices easily.', // Update description
};

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
           {/* Wrap children with the ClientLayout component */}
           <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
