
'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded credentials (highly insecure - for demonstration only)
const VALID_USERNAME = 'yogesh12';
const VALID_PASSWORD = 'Yoyo@12345';
const AUTH_STORAGE_KEY = 'app_auth_state';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Check local storage on initial load (client-side only)
    if (typeof window !== 'undefined') {
      try {
        const storedAuthState = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedAuthState) {
          const parsedState = JSON.parse(storedAuthState);
          if (parsedState.isLoggedIn && parsedState.username) {
             // Basic check - in real app, you'd validate a token
            setIsLoggedIn(true);
            setUsername(parsedState.username);
          }
        }
      } catch (error) {
        console.error("Error reading auth state from localStorage:", error);
        localStorage.removeItem(AUTH_STORAGE_KEY); // Clear corrupted state
      }
    }
  }, []);

  const login = async (user: string, pass: string): Promise<boolean> => {
    // Basic credential check (replace with real auth)
    if (user === VALID_USERNAME && pass === VALID_PASSWORD) {
      setIsLoggedIn(true);
      setUsername(user);
       // Store auth state in local storage (client-side only)
      if (typeof window !== 'undefined') {
         try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isLoggedIn: true, username: user }));
         } catch (error) {
            console.error("Error saving auth state to localStorage:", error);
         }
      }
      return true;
    } else {
      return false;
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUsername(null);
    // Remove auth state from local storage (client-side only)
     if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch (error) {
            console.error("Error removing auth state from localStorage:", error);
        }
     }
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/login'); // Redirect to login page after logout
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
