import { ReactNode, createContext, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  loginMutation: UseMutationResult<{ user: User }, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{ user: User }, Error, RegisterData>;
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
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // CRITICAL FIX: Check for redirectAfterAuth to log automatic redirection after login
      const redirectPath = sessionStorage.getItem('redirectAfterAuth');
      if (redirectPath) {
        console.log('✅ Login successful - detected redirect path in sessionStorage:', redirectPath);
        // Don't clear it here - we'll let the router components handle clearing it
        // when they actually perform the redirect
      } else {
        console.log('Login successful - no redirect path detected in sessionStorage');
      }
      
      toast({
        title: "Success",
        description: "Successfully logged in",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
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
      
      // Always return some data to trigger onSuccess in all cases
      return responseData;
    },
    onSuccess: () => {
      try {
        // Clear all data from cache immediately
        queryClient.clear();
        
        // Set user to null and remove all user-related queries
        queryClient.setQueryData(["/api/user"], null);
        queryClient.removeQueries({ queryKey: ["/api/user"] });
        
        // Invalidate all queries to clear any remaining cache
        queryClient.invalidateQueries();
        
        // Only clear logout-related storage items, but preserve redirectAfterAuth
        try {
          // Save any redirectAfterAuth value before clearing
          const redirectAfterAuth = sessionStorage.getItem('redirectAfterAuth');
          
          // Clear localStorage items (doesn't affect sessionStorage)
          localStorage.clear();
          
          // Selectively clear sessionStorage items except redirectAfterAuth
          const itemsToKeep = ['redirectAfterAuth'];
          const itemsToKeepValues: Record<string, string> = {};
          
          // Save values we want to keep
          itemsToKeep.forEach(key => {
            const value = sessionStorage.getItem(key);
            if (value) {
              itemsToKeepValues[key] = value;
            }
          });
          
          // Clear all sessionStorage
          sessionStorage.clear();
          
          // Restore items we want to keep
          Object.entries(itemsToKeepValues).forEach(([key, value]) => {
            sessionStorage.setItem(key, value as string);
          });
          
          console.log('Preserved redirect path during auth state update:', redirectAfterAuth);
        } catch (storageError) {
          console.error("Error managing browser storage:", storageError);
        }
        
        // Force a reload of the page to completely reset React state
        // This ensures that the router will detect that the user is logged out
        window.location.href = "/auth";
        return; // Early return to prevent toast from showing before redirect
      } catch (cacheError) {
        console.error("Error clearing cache:", cacheError);
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
        queryClient.clear();
        queryClient.setQueryData(["/api/user"], null);
        
        // Save any redirectAfterAuth value before clearing
        const redirectAfterAuth = sessionStorage.getItem('redirectAfterAuth');
        
        // Clear localStorage items
        localStorage.clear();
        
        // Selectively clear sessionStorage items except redirectAfterAuth
        const itemsToKeep = ['redirectAfterAuth'];
        const itemsToKeepValues: Record<string, string> = {};
        
        // Save values we want to keep
        itemsToKeep.forEach(key => {
          const value = sessionStorage.getItem(key);
          if (value) {
            itemsToKeepValues[key] = value;
          }
        });
        
        // Clear all sessionStorage
        sessionStorage.clear();
        
        // Restore items we want to keep
        Object.entries(itemsToKeepValues).forEach(([key, value]) => {
          sessionStorage.setItem(key, value as string);
        });
        
        console.log('Preserved redirect path during error handling:', redirectAfterAuth);
        
        // Also force redirect to auth page on error
        window.location.href = "/auth";
        return; // Early return to prevent toast from showing before redirect
      } catch (e) {
        console.error("Failed to clean up state after logout error:", e);
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
      
      return responseData;
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
      
      // Check for redirectAfterAuth to handle automatic redirection after registration
      const redirectPath = sessionStorage.getItem('redirectAfterAuth');
      if (redirectPath) {
        console.log('Registration successful - redirecting to:', redirectPath);
        // We'll let the automatic useEffect in auth-page.tsx handle this redirect
        // So we don't need to do anything here, just log it for debugging
      }
      
      // Show success message
      toast({
        title: "Success",
        description: "Registration successful",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
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