
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, LogOut, Settings, User } from 'lucide-react'; // Added icons
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth

export function SidebarNav() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { logout, isAuthenticated } = useAuth(); // Get logout function and auth state

  const isActive = (path: string) => {
    // Handle exact match for dashboard/reports, broader match for invoices section
    if (path === '/invoices') {
      return pathname.startsWith('/invoices');
    }
    return pathname === path;
  };

  // Don't render sidebar on login page
  if (pathname === '/login' || !isAuthenticated) {
      return null;
  }


  return (
    <Sidebar>
      <SidebarHeader>
         {/* Simplified header - Add logo/title if needed */}
        <div className="flex items-center gap-2 p-2">
           {/* Placeholder for Logo/Icon */}
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
           </svg>
           {state === 'expanded' && <h2 className="font-semibold text-lg text-foreground">Create Bill</h2>}
        </div>
        {/* Optional: Add SidebarTrigger if needed within header */}
        {/* <SidebarTrigger className="absolute right-2 top-3 md:hidden" /> */}
      </SidebarHeader>

      <SidebarContent className="flex-grow">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/invoices')}
              tooltip={state === 'collapsed' ? 'Invoices' : undefined}
            >
              <Link href="/invoices">
                <FileText />
                <span>Invoices</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/reports/income')}
              tooltip={state === 'collapsed' ? 'Income Report' : undefined}
            >
              <Link href="/reports/income">
                <BarChart3 />
                <span>Income Report</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           {/* Add more menu items here if needed */}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border pt-2">
         {/* User Profile / Logout */}
        <div className="flex items-center justify-between gap-2 p-2">
           <div className='flex items-center gap-2 overflow-hidden'>
             <Avatar className="h-7 w-7">
               <AvatarImage src="https://picsum.photos/40/40?grayscale" alt="User Avatar" data-ai-hint="user avatar grayscale"/>
               <AvatarFallback>U</AvatarFallback> {/* Fallback initials */}
             </Avatar>
              {state === 'expanded' && (
                  <div className='flex flex-col text-xs truncate'>
                      <span className="font-medium text-foreground truncate">Demo User</span>
                      <span className="text-muted-foreground truncate">demo@example.com</span>
                  </div>
              )}
           </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={logout}
            aria-label="Logout"
             tooltip={state === 'collapsed' ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
