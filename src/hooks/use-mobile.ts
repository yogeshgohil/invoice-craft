
'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // Example breakpoint for mobile (Tailwind's `md`)

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // Initial check after mount
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Run check on mount
    checkDevice();

    // Add resize listener
    window.addEventListener('resize', checkDevice);

    // Cleanup listener on component unmount
    return () => window.removeEventListener('resize', checkDevice);
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  // Return undefined during SSR or before the first client-side check
  return isMobile;
}
