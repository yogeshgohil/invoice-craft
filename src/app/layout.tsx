
import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Keep Geist Sans only if needed
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { AuthProvider } from '@/contexts/auth-context'; // Import AuthProvider

// Use Geist Sans if specifically desired, otherwise remove font imports
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

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
    <html lang="en">
      {/*
        Added suppressHydrationWarning to the body tag.
        This can help ignore hydration mismatches caused by browser extensions.
      */}
      <body
        // Apply font variable if using Geist Sans, otherwise use default Tailwind fonts
        className={`${geistSans.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider> {/* Wrap children with AuthProvider */}
           {children}
           <Toaster /> {/* Add Toaster here */}
         </AuthProvider>
      </body>
    </html>
  );
}
