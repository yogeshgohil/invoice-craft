
'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define valid credentials
const VALID_USERNAME = 'demo';
const VALID_PASSWORD = 'demo';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

   // Check local storage on initial load (client-side only)
   useEffect(() => {
     if (typeof window !== 'undefined') {
       const storedAuth = localStorage.getItem('isAuthenticated');
       if (storedAuth === 'true') {
           setIsAuthenticated(true);
           // If authenticated and on login page, redirect to invoices
           if (pathname === '/login') {
               router.replace('/invoices');
           }
       } else {
           // If not authenticated and not on login page, redirect to login
           if (pathname !== '/login') {
               router.replace('/login');
           }
       }
     }
   }, [pathname, router]); // Rerun effect if pathname changes


  const login = async (username: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Simulate API call delay
      setTimeout(() => {
        if (username === VALID_USERNAME && password === VALID_PASSWORD) {
          setIsAuthenticated(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem('isAuthenticated', 'true'); // Persist auth state
          }
          router.replace('/invoices'); // Redirect after successful login
          resolve();
        } else {
          reject(new Error('Invalid username or password'));
        }
      }, 500); // Simulate network delay
    });
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAuthenticated'); // Clear auth state
    }
    router.replace('/login'); // Redirect to login page after logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
