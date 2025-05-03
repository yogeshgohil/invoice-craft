
// The root page no longer needs client-side logic for redirection.
// Authentication checks and redirects are handled by AuthProvider and ProtectedRoute.
// This component can remain a simple Server Component if it doesn't need client-side interactivity itself.

import { Loader2 } from 'lucide-react';

export default function Home() {
  // Render a loading indicator or basic structure.
  // The actual content display or redirection will be managed
  // by the authentication context and protected routes.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-12 lg:p-24 bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Loading application...</p>
        </div>
    </main>
  );
}
