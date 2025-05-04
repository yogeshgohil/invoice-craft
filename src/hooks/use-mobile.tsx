
'use client'; // Ensure this hook is treated as client-side code

import * as React from "react"

const MOBILE_BREAKPOINT = 768 // md breakpoint

export function useIsMobile() {
  // Initialize state to undefined to handle SSR gracefully
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // This effect runs only on the client after hydration

    const checkDevice = () => {
      // Check window width and update state
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check immediately after mount
    checkDevice();

    // Add listener for window resize events
    window.addEventListener('resize', checkDevice);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Return the state: undefined on server, boolean on client after effect runs
  return isMobile;
}
