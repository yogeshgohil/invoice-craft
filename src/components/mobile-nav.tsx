
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, X, LayoutDashboard, FileText, BarChart2 } from 'lucide-react'; // Import icons
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/invoices', label: 'Invoices', icon: FileText },
    { href: '/reports/income', label: 'Reports', icon: BarChart2 },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleLinkClick = () => {
      setIsOpen(false); // Close sheet when a link is clicked
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* Navbar Header for Mobile */}
       <header className="sm:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Brand/Logo */}
            <Link href="/invoices" className="flex items-center gap-2" onClick={handleLinkClick}>
                 {/* Placeholder for logo */}
                <LayoutDashboard className="h-5 w-5 text-primary" />
                <span className="font-bold text-md text-foreground">Mahakali</span>
            </Link>

            {/* Hamburger Menu Trigger */}
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
       </header>

      <SheetContent side="left" className="w-full max-w-xs p-0 bg-background">
        {/* Sheet Header */}
        <div className="flex h-14 items-center justify-between border-b px-4">
           <Link href="/invoices" className="flex items-center gap-2" onClick={handleLinkClick}>
               <LayoutDashboard className="h-5 w-5 text-primary" />
                <span className="font-bold text-md text-foreground">Mahakali</span>
           </Link>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-mr-2 text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close menu</span>
                </Button>
            </SheetTrigger>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {/* Add other mobile nav elements like user profile, settings etc. here if needed */}
      </SheetContent>
    </Sheet>
  );
}
