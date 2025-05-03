
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
const AUTH_STORAGE_KEY = 'app_auth_state'; // Key for localStorage AND cookie

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const timestamp = () => new Date().toISOString(); // Helper for consistent timestamps

  // Helper to set cookie (client-side only)
  const setAuthCookie = (loggedIn: boolean, user: string | null) => {
    if (typeof document !== 'undefined') {
      const cookieValue = JSON.stringify({ isLoggedIn: loggedIn, username: user });
      // Set a simple session cookie (expires when browser closes) or add max-age
      // For demo, using path=/ to be accessible by middleware
      document.cookie = `${AUTH_STORAGE_KEY}=${encodeURIComponent(cookieValue)}; path=/; SameSite=Lax`;
       console.log(`[${timestamp()}] AuthContext: Set cookie ${AUTH_STORAGE_KEY}=${cookieValue} (Encoded: ${encodeURIComponent(cookieValue)})`);
    } else {
        console.warn(`[${timestamp()}] AuthContext: Attempted to set cookie in non-browser environment.`);
    }
  };

  // Helper to remove cookie (client-side only)
  const removeAuthCookie = () => {
    if (typeof document !== 'undefined') {
      // Expire the cookie by setting max-age to 0
      document.cookie = `${AUTH_STORAGE_KEY}=; path=/; Max-Age=0; SameSite=Lax`;
      console.log(`[${timestamp()}] AuthContext: Removed cookie ${AUTH_STORAGE_KEY}`);
    } else {
       console.warn(`[${timestamp()}] AuthContext: Attempted to remove cookie in non-browser environment.`);
    }
  };


  useEffect(() => {
    // Check local storage on initial load (client-side only)
    if (typeof window !== 'undefined') {
       console.log(`[${timestamp()}] AuthContext useEffect (Mount): Checking initial auth state from localStorage.`);
      try {
        const storedAuthState = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedAuthState) {
          console.log(`[${timestamp()}] AuthContext useEffect (Mount): Found stored state: ${storedAuthState}`);
          const parsedState = JSON.parse(storedAuthState);
          if (parsedState.isLoggedIn && parsedState.username) {
            console.log(`[${timestamp()}] AuthContext useEffect (Mount): State indicates logged in. Setting state and ensuring cookie.`);
            setIsLoggedIn(true);
            setUsername(parsedState.username);
            // Ensure cookie is also set if localStorage has state (e.g., after refresh)
            setAuthCookie(true, parsedState.username);
          } else {
             console.log(`[${timestamp()}] AuthContext useEffect (Mount): Stored state indicates logged out. Removing cookie and ensuring state is false.`);
             removeAuthCookie();
             setIsLoggedIn(false); // Ensure state is false
             setUsername(null);
          }
        } else {
            console.log(`[${timestamp()}] AuthContext useEffect (Mount): No stored state found. Removing cookie and ensuring state is false.`);
            removeAuthCookie();
            setIsLoggedIn(false); // Ensure state is false
            setUsername(null);
        }
      } catch (error: any) {
        console.error(`[${timestamp()}] AuthContext useEffect (Mount): Error reading auth state from localStorage: ${error.message}. Clearing state and cookie.`);
        localStorage.removeItem(AUTH_STORAGE_KEY); // Clear corrupted state
        removeAuthCookie(); // Ensure cookie is cleared too
        setIsLoggedIn(false); // Reset state on error
        setUsername(null);
      }
    } else {
        console.log(`[${timestamp()}] AuthContext useEffect (Mount): Running in non-browser environment. Skipping localStorage check.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const login = async (user: string, pass: string): Promise<boolean> => {
    console.log(`[${timestamp()}] AuthContext login: Attempting login for user: ${user}`);
    // Basic credential check (replace with real auth)
    if (user === VALID_USERNAME && pass === VALID_PASSWORD) {
      console.log(`[${timestamp()}] AuthContext login: Credentials valid. Setting state, localStorage, and cookie.`);
      const authState = { isLoggedIn: true, username: user };
      // Store auth state in local storage (client-side only)
      if (typeof window !== 'undefined') {
         try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
            console.log(`[${timestamp()}] AuthContext login: localStorage set with: ${JSON.stringify(authState)}`);
            setAuthCookie(true, user); // Set cookie
            console.log(`[${timestamp()}] AuthContext login: Cookie set/updated.`);
         } catch (error: any) {
            console.error(`[${timestamp()}] AuthContext login: Error saving auth state to localStorage: ${error.message}`);
             // Still proceed with setting state even if localStorage fails
         }
      } else {
          console.warn(`[${timestamp()}] AuthContext login: Attempted to set localStorage in non-browser environment.`);
      }
      // Update state AFTER storage/cookie operations
      setIsLoggedIn(true);
      setUsername(user);
      console.log(`[${timestamp()}] AuthContext login: React state updated. isLoggedIn: true, username: ${user}. Returning true.`);
      return true;
    } else {
      console.log(`[${timestamp()}] AuthContext login: Invalid credentials. Returning false.`);
      return false;
    }
  };

  const logout = () => {
     console.log(`[${timestamp()}] AuthContext logout: Logging out user: ${username}`);
    // Remove auth state from local storage (client-side only)
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
         console.log(`[${timestamp()}] AuthContext logout: localStorage key "${AUTH_STORAGE_KEY}" removed.`);
        removeAuthCookie(); // Remove cookie
        console.log(`[${timestamp()}] AuthContext logout: Cookie removed.`);
      } catch (error: any) {
        console.error(`[${timestamp()}] AuthContext logout: Error removing auth state from localStorage: ${error.message}`);
      }
    } else {
       console.warn(`[${timestamp()}] AuthContext logout: Attempted to remove localStorage/cookie in non-browser environment.`);
    }
     // Update state AFTER storage/cookie operations
    setIsLoggedIn(false);
    setUsername(null);
     console.log(`[${timestamp()}] AuthContext logout: React state updated. isLoggedIn: false, username: null.`);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    // Use replace to avoid login page in history after logout
    console.log(`[${timestamp()}] AuthContext logout: Redirecting to /login...`);
    router.replace('/login');
  };

  // Log state changes for debugging
  useEffect(() => {
    console.log(`[${timestamp()}] AuthContext state changed: isLoggedIn: ${isLoggedIn}, username: ${username}`);
    // If state changes to logged in, ensure cookie is set (belt-and-suspenders)
    if (isLoggedIn && username) {
        // Check if cookie exists and matches before setting again to avoid excessive logging
        if (typeof document !== 'undefined') {
            const currentCookie = document.cookie.split('; ').find(row => row.startsWith(`${AUTH_STORAGE_KEY}=`));
            let needsUpdate = true;
            if (currentCookie) {
                 try {
                    const parsedCookie = JSON.parse(decodeURIComponent(currentCookie.split('=')[1]));
                    if(parsedCookie.isLoggedIn === true && parsedCookie.username === username) {
                        needsUpdate = false;
                    }
                 } catch (e) { /* ignore parsing error, assume needs update */ }
            }
            if (needsUpdate) {
                console.log(`[${timestamp()}] AuthContext state change detected logged in - ensuring cookie is set/correct.`);
                setAuthCookie(true, username);
            }
        }
    } else if (!isLoggedIn && typeof document !== 'undefined') {
        // If state changes to logged out, ensure cookie is removed
        const currentCookie = document.cookie.split('; ').find(row => row.startsWith(`${AUTH_STORAGE_KEY}=`));
        if (currentCookie) {
            console.log(`[${timestamp()}] AuthContext state change detected logged out - ensuring cookie is removed.`);
            removeAuthCookie();
        }
    }

  }, [isLoggedIn, username]);

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
