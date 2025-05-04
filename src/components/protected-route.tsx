
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react'; // For loading state

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This check should ideally run after the initial auth state check in AuthProvider
    // to avoid flickering between login and protected routes.
    if (typeof window !== 'undefined' && !isAuthenticated && pathname !== '/login') {
       router.replace('/login');
    }
  }, [isAuthenticated, router, pathname]);

  // While checking authentication or if redirecting, show a loading indicator
  // or null. Avoid rendering children immediately if not authenticated.
  if (!isAuthenticated && pathname !== '/login') {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-12 lg:p-24 bg-background">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Loading...</p>
            </div>
        </main>
    );
  }

  // If authenticated, render the children components
  return <>{children}</>;
}
