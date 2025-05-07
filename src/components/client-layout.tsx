
'use client'; // This component uses client-side hooks

import type { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile
import { MobileNav } from '@/components/mobile-nav'; // Corrected import
// Removed unused import: import { SidebarNav } from '@/components/sidebar-nav'; // Import SidebarNav
import { Toaster } from '@/components/ui/toaster'; // Import Toaster

export function ClientLayout({ children }: { children: ReactNode }) {
    const isMobile = useIsMobile(); // Hook call is safe now

    return (
        <>
             <div className="flex min-h-screen">
                {isMobile ? (
                    // Render MobileNav at the top/bottom or as an overlay trigger
                     <MobileNav /> // Assuming MobileNav handles its own positioning/trigger
                 ) : (
                     // Sidebar was removed, so no desktop sidebar is rendered here
                     null
                 )}
                 {/* Adjust padding based on whether sidebar/navbar is present */}
                 <main className={`flex-1 transition-all duration-300 ease-in-out ${isMobile ? 'pt-14 p-2 sm:p-4' : 'p-2 sm:p-4'} print:p-0`}>
                     {children}
                 </main>
             </div>
            <Toaster /> {/* Add Toaster here */}
        </>
    );
}

