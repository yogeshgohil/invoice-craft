
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login, isLoggedIn } = useAuth(); // Use the login function and isLoggedIn state from context

   // Redirect if already logged in (Client-side check)
   useEffect(() => {
    console.log("LoginPage useEffect: Checking login status. isLoggedIn:", isLoggedIn);
    if (isLoggedIn) {
      console.log("LoginPage useEffect: Already logged in, attempting redirect to /invoices");
      router.replace('/invoices'); // Use replace to avoid login page in history
    }
   }, [isLoggedIn, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("LoginPage handleSubmit: Attempting login...");

    try {
        // Attempt login using the context function
        const success = await login(username, password);

        if (success) {
            console.log("LoginPage handleSubmit: Login successful.");
            toast({
                title: 'Login Successful',
                description: 'Redirecting to dashboard...',
            });
            // The useEffect hook above will now handle the redirect when isLoggedIn updates
            // No need to set isLoading false here, as the page navigates away or useEffect handles redirect
        } else {
             console.log("LoginPage handleSubmit: Login failed (invalid credentials).");
             toast({
                title: 'Login Failed',
                description: 'Invalid username or password.',
                variant: 'destructive',
            });
            setIsLoading(false); // Stop loading on failure
        }
    } catch (error) {
        console.error('Login error:', error);
        toast({
            title: 'Login Error',
            description: 'An unexpected error occurred. Please try again.',
            variant: 'destructive',
        });
         setIsLoading(false); // Stop loading on error
    }
     // Set loading to false only if login attempt failed or errored
     // On success, let the redirect/unmount handle it
     // setIsLoading(false); // Moved inside failure/error blocks
  };

   // If redirecting via useEffect, show loading indicator
   if (isLoggedIn) {
      console.log("LoginPage: Rendering loading spinner because isLoggedIn is true (while redirecting).")
      return <main className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></main>; // Or null
   }

   console.log("LoginPage: Rendering login form.");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-12 lg:p-24 bg-background">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl text-center font-bold text-primary">Login</CardTitle>
          <CardDescription className="text-center text-muted-foreground text-sm">
              Enter your credentials to access the dashboard.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
            <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                />
            </div>
             <p className="text-xs text-muted-foreground text-center pt-2">
                Use: yogesh12 / Yoyo@12345
              </p>
            </CardContent>
            <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            </CardFooter>
        </form>
      </Card>
    </main>
  );
}

