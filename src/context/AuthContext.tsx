
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

  // Helper to set cookie (client-side only)
  const setAuthCookie = (loggedIn: boolean, user: string | null) => {
    if (typeof document !== 'undefined') {
      const cookieValue = JSON.stringify({ isLoggedIn: loggedIn, username: user });
      // Set a simple session cookie (expires when browser closes) or add max-age
      // For demo, using path=/ to be accessible by middleware
      document.cookie = `${AUTH_STORAGE_KEY}=${encodeURIComponent(cookieValue)}; path=/; SameSite=Lax`;
       console.log(`AuthContext: Set cookie ${AUTH_STORAGE_KEY}=${cookieValue}`);
    }
  };

  // Helper to remove cookie (client-side only)
  const removeAuthCookie = () => {
    if (typeof document !== 'undefined') {
      // Expire the cookie by setting max-age to 0
      document.cookie = `${AUTH_STORAGE_KEY}=; path=/; Max-Age=0; SameSite=Lax`;
      console.log(`AuthContext: Removed cookie ${AUTH_STORAGE_KEY}`);
    }
  };


  useEffect(() => {
    // Check local storage on initial load (client-side only)
    if (typeof window !== 'undefined') {
       console.log("AuthContext useEffect: Checking initial auth state.");
      try {
        const storedAuthState = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedAuthState) {
          console.log("AuthContext useEffect: Found stored state:", storedAuthState);
          const parsedState = JSON.parse(storedAuthState);
          if (parsedState.isLoggedIn && parsedState.username) {
            console.log("AuthContext useEffect: State indicates logged in. Setting state and cookie.");
            // Basic check - in real app, you'd validate a token
            setIsLoggedIn(true);
            setUsername(parsedState.username);
            // Ensure cookie is also set if localStorage has state (e.g., after refresh)
            setAuthCookie(true, parsedState.username);
          } else {
             console.log("AuthContext useEffect: Stored state indicates logged out. Removing cookie.");
             // If localStorage indicates logged out, ensure cookie is removed
             removeAuthCookie();
             setIsLoggedIn(false); // Ensure state is false
             setUsername(null);
          }
        } else {
            console.log("AuthContext useEffect: No stored state found. Removing cookie.");
           // If no localStorage state, ensure cookie is removed
            removeAuthCookie();
            setIsLoggedIn(false); // Ensure state is false
            setUsername(null);
        }
      } catch (error) {
        console.error("Error reading auth state from localStorage:", error);
        localStorage.removeItem(AUTH_STORAGE_KEY); // Clear corrupted state
        removeAuthCookie(); // Ensure cookie is cleared too
        setIsLoggedIn(false); // Reset state on error
        setUsername(null);
      }
    }
  }, []); // Run only once on mount

  const login = async (user: string, pass: string): Promise<boolean> => {
    console.log(`AuthContext login: Attempting login for user: ${user}`);
    // Basic credential check (replace with real auth)
    if (user === VALID_USERNAME && pass === VALID_PASSWORD) {
      console.log("AuthContext login: Credentials valid. Setting state, localStorage, and cookie.");
      const authState = { isLoggedIn: true, username: user };
      // Store auth state in local storage (client-side only)
      if (typeof window !== 'undefined') {
         try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
            console.log("AuthContext login: localStorage set.");
            setAuthCookie(true, user); // Set cookie
            console.log("AuthContext login: Cookie set.");
         } catch (error) {
            console.error("Error saving auth state to localStorage:", error);
             // Still proceed with setting state even if localStorage fails
         }
      }
      // Update state AFTER storage/cookie operations
      setIsLoggedIn(true);
      setUsername(user);
      console.log("AuthContext login: React state updated. isLoggedIn:", true, "username:", user);
      return true;
    } else {
      console.log("AuthContext login: Invalid credentials.");
      return false;
    }
  };

  const logout = () => {
     console.log("AuthContext logout: Logging out user:", username);
    // Remove auth state from local storage (client-side only)
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
         console.log("AuthContext logout: localStorage removed.");
        removeAuthCookie(); // Remove cookie
        console.log("AuthContext logout: Cookie removed.");
      } catch (error) {
        console.error("Error removing auth state from localStorage:", error);
      }
    }
     // Update state AFTER storage/cookie operations
    setIsLoggedIn(false);
    setUsername(null);
     console.log("AuthContext logout: React state updated. isLoggedIn:", false, "username:", null);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    // Use replace to avoid login page in history after logout
    console.log("AuthContext logout: Redirecting to /login...");
    router.replace('/login');
  };

  // Log state changes for debugging
  useEffect(() => {
    console.log("AuthContext state changed: isLoggedIn:", isLoggedIn, "username:", username);
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
