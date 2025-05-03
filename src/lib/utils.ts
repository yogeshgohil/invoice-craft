
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to format currency
export const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
      // Format as INR (₹)
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(0);
  }
  // Format as INR (₹)
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

