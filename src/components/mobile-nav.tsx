
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, FileText, BarChart3, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/invoices') {
      return pathname.startsWith('/invoices');
    }
    return pathname === path;
  };

  // Don't render nav on login page or if not authenticated
  if (pathname === '/login' || !isAuthenticated) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
      {/* Left side: Logo/Title */}
      <Link href="/invoices" className="flex items-center gap-2 font-semibold text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
           <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
           <polyline points="14 2 14 8 20 8"></polyline>
           <line x1="16" y1="13" x2="8" y2="13"></line>
           <line x1="16" y1="17" x2="8" y2="17"></line>
           <line x1="10" y1="9" x2="8" y2="9"></line>
        </svg>
        <span className="">Mahakali</span>
      </Link>

      {/* Right side: Menu Trigger */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full max-w-[280px] p-0 flex flex-col">
          {/* Sheet Header */}
          <div className="flex items-center justify-between p-4 border-b">
             <Link href="/invoices" className="flex items-center gap-2 font-semibold text-primary" onClick={() => setIsOpen(false)}>
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                 <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                 <polyline points="14 2 14 8 20 8"></polyline>
                 <line x1="16" y1="13" x2="8" y2="13"></line>
                 <line x1="16" y1="17" x2="8" y2="17"></line>
                 <line x1="10" y1="9" x2="8" y2="9"></line>
               </svg>
               <span>Mahakali</span>
             </Link>
             {/* SheetClose is handled by Radix automatically, no extra button needed unless specific design requires */}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-grow px-4 py-4 space-y-2">
            <SheetClose asChild>
              <Link
                href="/invoices"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive('/invoices') && "bg-muted text-primary"
                )}
              >
                <FileText className="h-4 w-4" />
                Invoices
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/reports/income"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive('/reports/income') && "bg-muted text-primary"
                )}
              >
                <BarChart3 className="h-4 w-4" />
                Income Report
              </Link>
            </SheetClose>
            {/* Add more links here */}
          </nav>

           {/* Footer: User Info and Logout */}
           <div className="mt-auto border-t p-4">
              <div className="flex items-center justify-between gap-2">
                  <div className='flex items-center gap-2 overflow-hidden'>
                      <Avatar className="h-8 w-8">
                          <AvatarImage src="https://picsum.photos/40/40?grayscale" alt="User Avatar" data-ai-hint="user avatar grayscale" />
                          <AvatarFallback>D</AvatarFallback>
                      </Avatar>
                      <div className='flex flex-col text-xs truncate'>
                          <span className="font-medium text-foreground truncate">Demo User</span>
                          <span className="text-muted-foreground truncate">demo@example.com</span>
                      </div>
                  </div>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                         logout();
                         setIsOpen(false); // Close sheet on logout
                      }}
                      aria-label="Logout"
                  >
                      <LogOut className="h-4 w-4" />
                  </Button>
              </div>
           </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
