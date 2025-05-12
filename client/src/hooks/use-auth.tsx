import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Authentication states to track the login flow
export type AuthState = 
  | 'unauthenticated' // No user is logged in
  | 'checking'        // Checking if user is authenticated
  | 'authenticated'   // User is authenticated
  | 'logging-in'      // Login in progress
  | 'logging-out'     // Logout in progress
  | 'redirecting';    // Redirect in progress after auth

type User = {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isParent: boolean;
  householdId?: number;
  phone?: string;
  metadata?: string; // JSON string containing address details
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  authState: AuthState;
  loginMutation: UseMutationResult<{ user: User }, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{ user: User }, Error, RegisterData>;
  setAuthState: (state: AuthState) => void;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState>('checking');

  // Set up the user query
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      // Check for emulation token
      const emulationToken = typeof window !== 'undefined' ? localStorage.getItem('emulationToken') : null;
      
      // Get cached ETag value from cache if available - specifically for user data
      let etag: string | null = null;
      const cacheKey = `etag:/api/user`;
      try {
        etag = localStorage.getItem(cacheKey);
      } catch (e) {
        console.warn('Could not access localStorage for user ETag:', e);
      }
      
      // Prepare headers - use conditional caching with ETag instead of disabling cache entirely
      const headers: HeadersInit = {
        'Cache-Control': 'max-age=3600' // Allow caching for an hour
      };
      
      // Add If-None-Match header if we have an ETag
      if (etag) {
        headers['If-None-Match'] = etag;
      }
      
      // Add emulation token if present
      if (emulationToken) {
        headers['x-emulation-token'] = emulationToken;
      }
      
      // Make request with appropriate caching headers
      const res = await fetch("/api/user", {
        credentials: "include", // Ensure cookies are sent
        headers
      });
      
      // Handle 304 Not Modified responses - use cached data
      if (res.status === 304) {
        // Let React Query use its cache
        throw new Error('Use cached data');
      }
      
      // Store the ETag for future requests if provided
      const newEtag = res.headers.get('ETag');
      if (newEtag) {
        try {
          localStorage.setItem(cacheKey, newEtag);
        } catch (e) {
          console.warn('Could not store user ETag in localStorage:', e);
        }
      }
      
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      
      const userData = await res.json();
      return userData;
    },
    retry: (failureCount, error) => {
      // Don't retry on "Use cached data" errors - this is expected behavior
      if (error instanceof Error && error.message === 'Use cached data') {
        return false;
      }
      // Only retry once for other types of errors
      return failureCount < 1;
    },
    refetchOnWindowFocus: false, // Don't refetch on focus
    staleTime: 60 * 60 * 1000, // 1 hour - consider data fresh for longer
    gcTime: 2 * 60 * 60 * 1000, // 2 hours - keep in cache longer
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        console.log('Login mutation called with:', credentials.email);
        
        // Update auth state to show we're logging in
        setAuthState('logging-in');
        
        // Prepare request with credentials - using username field as Passport expects
        const requestData = {
          email: credentials.email,
          password: credentials.password
        };
        
        console.log('Sending login request with data:', { email: requestData.email, passwordLength: requestData.password.length });
        
        // Add cache-busting to avoid any caching issues
        const timestamp = new Date().getTime();
        const res = await fetch(`/api/login?t=${timestamp}`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          body: JSON.stringify(requestData),
          credentials: "include",
        });
        
        console.log('Login response status:', res.status);
        
        // Handle error responses
        if (!res.ok) {
          let errorMessage;
          try {
            errorMessage = await res.text();
          } catch (e) {
            errorMessage = 'Login failed';
          }
          console.error('Login error response:', errorMessage);
          setAuthState('unauthenticated');
          throw new Error(errorMessage);
        }
        
        // Parse the successful response
        const data = await res.json();
        console.log('Login successful, received user data:', data ? 'Yes' : 'No');
        
        // Immediately fetch current user to ensure session is established
        try {
          console.log('Fetching current user after login');
          const userRes = await fetch('/api/user', {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'X-Cache-Bust': (timestamp + 1).toString()
            }
          });
          
          if (userRes.ok) {
            const userData = await userRes.json();
            console.log('User data fetched after login:', userData ? 'success' : 'not found');
            // Add the freshly fetched user data to the response
            data.freshUserData = userData;
          } else {
            console.warn('Failed to fetch user after login:', userRes.status);
          }
        } catch (e) {
          console.error('Error fetching user after login:', e);
        }
        
        // We got past all the error checks, update state to indicate success
        setAuthState('authenticated');
        
        return data;
      } catch (error) {
        // Make sure we reset the auth state on errors
        setAuthState('unauthenticated');
        throw error;
      }
    },
    onSuccess: (data) => {
      // Use the freshly fetched user data if available, otherwise fall back to the user from login response
      const userData = data.freshUserData || data.user;
      
      // Set the user data in the cache
      queryClient.setQueryData(["/api/user"], userData); 
      
      // Force a refetch to ensure we're using fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Update auth state to reflect successful authentication
      setAuthState('authenticated');
      
      toast({
        title: "Success",
        description: "Successfully logged in",
      });
    },
    onError: (error: Error) => {
      console.error('Login mutation error:', error);
      
      // Make sure we reset the auth state on errors
      setAuthState('unauthenticated');
      
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Update auth state to show we're logging out
      setAuthState('logging-out');
      
      // Add a timestamp to bust any caching completely
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/logout?t=${timestamp}`, { 
        method: "POST",
        credentials: "include",
        // Add cache-busting to ensure the request isn't cached
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, private',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
          'X-Cache-Bust': timestamp.toString()
        }
      });
      
      // Even if the response isn't ok, we should still try to clear the local state
      let responseData;
      try {
        responseData = await res.json();
      } catch (e) {
        // If we can't parse the response, create a default response
        responseData = { 
          message: "Logout processed", 
          timestamp: timestamp 
        };
      }
      
      // If there was an error from the server, we still want to clear client-side state
      if (!res.ok) {
        console.error("Server error during logout:", responseData);
      }
      
      // Set auth state to unauthenticated as we're clearing all state anyway
      setAuthState('unauthenticated');
      
      // Always return some data to trigger onSuccess in all cases
      return responseData;
    },
    onSuccess: () => {
      try {
        // Update auth state to unauthenticated before clearing cache and redirecting
        setAuthState('unauthenticated');
        
        // Clear all data from cache immediately
        queryClient.clear();
        
        // Set user to null and remove all user-related queries
        queryClient.setQueryData(["/api/user"], null);
        queryClient.removeQueries({ queryKey: ["/api/user"] });
        
        // Invalidate all queries to clear any remaining cache
        queryClient.invalidateQueries();
        
        // Also clear browser storage to be extra safe
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (storageError) {
          console.error("Error clearing browser storage:", storageError);
        }
        
        // Set redirecting state before navigation to avoid flicker
        setAuthState('redirecting');
        
        // Force a reload of the page to completely reset React state
        // This ensures that the router will detect that the user is logged out
        window.location.href = "/auth";
        return; // Early return to prevent toast from showing before redirect
      } catch (cacheError) {
        console.error("Error clearing cache:", cacheError);
        // Even if there's an error, make sure auth state is unauthenticated
        setAuthState('unauthenticated');
      }
      
      // Show success message
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      // Even if there's an error, try to clear the cache and state
      try {
        // Make sure auth state is set to unauthenticated
        setAuthState('unauthenticated');
        
        queryClient.clear();
        queryClient.setQueryData(["/api/user"], null);
        localStorage.clear();
        sessionStorage.clear();
        
        // Set redirecting state before navigation to avoid flicker
        setAuthState('redirecting');
        
        // Also force redirect to auth page on error
        window.location.href = "/auth";
        return; // Early return to prevent toast from showing before redirect
      } catch (e) {
        console.error("Failed to clean up state after logout error:", e);
        // Even if there's an error in cleanup, make sure auth state is unauthenticated
        setAuthState('unauthenticated');
      }
      
      // Show error message
      toast({
        title: "Logout issue",
        description: "There was an issue during logout, but your session has been cleared.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      try {
        // Update auth state to indicate registration in progress
        setAuthState('logging-in'); // We use logging-in for registration too
        
        // Always include cache-busting headers
        const timestamp = new Date().getTime();
        const res = await fetch(`/api/register?t=${timestamp}`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            'Cache-Control': 'no-cache, no-store, must-revalidate, private',
            'Pragma': 'no-cache',
            'X-Cache-Bust': timestamp.toString()
          },
          body: JSON.stringify(data),
          credentials: "include",
        });
        
        if (!res.ok) {
          const error = await res.text();
          // Set auth state back to unauthenticated on error
          setAuthState('unauthenticated');
          throw new Error(error);
        }
        
        const responseData = await res.json();
        
        // Trigger an immediate user fetch after registration to ensure session is active
        try {
          // Check for emulation token
          const emulationToken = typeof window !== 'undefined' ? localStorage.getItem('emulationToken') : null;
          
          // Prepare headers
          const headers: HeadersInit = {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Cache-Bust': (timestamp + 1).toString()
          };
          
          // Add emulation token if present
          if (emulationToken) {
            console.log('Fetching user with emulation token:', emulationToken);
            headers['x-emulation-token'] = emulationToken;
          }
          
          const userRes = await fetch('/api/user', {
            credentials: 'include',
            headers,
          });
          
          if (userRes.ok) {
            const userData = await userRes.json();
            // Update cache with fresh user data
            responseData.freshUserData = userData;
          }
        } catch (e) {
          console.error('Error fetching user after registration:', e);
        }
        
        // Set auth state to authenticated since registration was successful
        setAuthState('authenticated');
        
        return responseData;
      } catch (error) {
        // Reset auth state on error
        setAuthState('unauthenticated');
        throw error;
      }
    },
    onSuccess: (data) => {
      // Set user data in cache, prioritizing the freshly fetched data if available
      const userData = data.freshUserData || data.user;
      
      if (userData) {
        // Set the user data in cache
        queryClient.setQueryData(["/api/user"], userData);
        
        // Force refetch to ensure we have the latest data
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      } else {
        // Just invalidate in case we couldn't get user data
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
      
      // Update auth state to reflect successful authentication
      setAuthState('authenticated');
      
      // Show success message
      toast({
        title: "Success",
        description: "Registration successful",
      });
    },
    onError: (error: Error) => {
      // Make sure auth state is reset on registration error
      setAuthState('unauthenticated');
      
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add a useEffect to synchronize with user query state
  useEffect(() => {
    if (isLoading) {
      setAuthState('checking');
    } else if (user) {
      // Only set to authenticated if we're not in a transitional state
      if (authState !== 'logging-in' && authState !== 'redirecting' && authState !== 'logging-out') {
        setAuthState('authenticated');
      }
    } else if (!user && !isLoading) {
      // Only set to unauthenticated if we're not in a transitional state
      if (authState !== 'logging-in' && authState !== 'redirecting' && authState !== 'logging-out') {
        setAuthState('unauthenticated');
      }
    }
  }, [user, isLoading, authState]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        authState,
        setAuthState,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}