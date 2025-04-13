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
      
      // Prepare headers
      const headers: HeadersInit = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      // Add emulation token if present
      if (emulationToken) {
        console.log('Fetching user with emulation token:', emulationToken);
        headers['x-emulation-token'] = emulationToken;
      } else {
        console.log('Fetching user with emulation token: not present');
      }
      
      const res = await fetch("/api/user", {
        credentials: "include", // Add this to ensure cookies are sent
        headers
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    retry: 1, // Limit retries to prevent excessive requests
    refetchOnWindowFocus: false, // Don't refetch on focus to reduce load
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
        
        // Also clear browser storage to be extra safe
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (storageError) {
          console.error("Error clearing browser storage:", storageError);
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
        localStorage.clear();
        sessionStorage.clear();
        
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