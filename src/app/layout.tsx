
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { AuthProvider } from '@/contexts/auth-context'; // Import AuthProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
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
        The hydration error reported ("Expected server HTML to contain a matching <body> in <html>")
        often occurs when browser extensions (like Grammarly) inject elements or attributes into the DOM
        before React hydrates the page. This causes a mismatch between the server-rendered HTML
        and the client-side HTML structure React expects.
        suppressHydrationWarning tells React to ignore these specific mismatches on this element.
      */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
