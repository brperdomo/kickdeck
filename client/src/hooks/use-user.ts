import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InsertUser, SelectUser } from "@db/schema";

// Mock admin user was removed to fix logout issues
// Production code should never use mock data

type RequestResult = {
  ok: true;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: InsertUser
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status >= 500) {
        return { ok: false, message: response.statusText };
      }

      const message = await response.text();
      return { ok: false, message };
    }

    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e.toString() };
  }
}

async function fetchUser(): Promise<SelectUser | null> {
  // Removed automatic development mode bypass to fix logout issues
  // The VITE_BYPASS_AUTH check is now handled at the return statement level

  try {
    // Check for emulation token to include in the request
    const emulationToken = typeof window !== 'undefined' ? localStorage.getItem('emulationToken') : null;
    
    // Prepare headers - include emulation token if present
    const headers: HeadersInit = {};
    if (emulationToken) {
      headers['x-emulation-token'] = emulationToken;
      // Add cache busting for emulation requests
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
    }
    
    console.log('Fetching user with emulation token:', emulationToken ? 'present' : 'not present');
    
    const response = await fetch('/api/user', {
      credentials: 'include',
      headers,
      cache: 'no-cache' // Ensure fresh data
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }

      throw new Error(`${response.status}: ${await response.text()}`);
    }

    const userData = await response.json();
    console.log('User data fetched:', userData);
    return userData;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export function useUser(skipAuth: boolean = false) {
  const queryClient = useQueryClient();
  
  // Get emulation token to include in query key for proper cache invalidation
  const emulationToken = typeof window !== 'undefined' ? localStorage.getItem('emulationToken') : null;

  const { data: user, error, isLoading } = useQuery<SelectUser | null, Error>({
    // Include emulation token in query key to ensure proper cache invalidation
    queryKey: ['user', emulationToken],
    queryFn: fetchUser,
    staleTime: 300000, // Increased to 5 minutes to prevent frequent refreshes during demos
    gcTime: 600000, // Keep unused data for 10 minutes
    retry: 1, // Only retry once to avoid infinite loops with bad credentials
    refetchOnWindowFocus: false, // Disabled to prevent refresh when window regains focus
    refetchOnMount: true, // Still refresh when components mount
    // Prevent actual refetches from causing UI refreshes if the data hasn't changed
    structuralSharing: true,
    enabled: !skipAuth // Skip the query entirely for public routes
  });

  const loginMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest('/api/login', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logoutMutation = useMutation<RequestResult, Error>({
    mutationFn: async () => {
      // Use custom fetch to add cache-busting headers
      try {
        const response = await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            // Add a random query parameter to prevent caching
            'X-Timestamp': new Date().getTime().toString()
          }
        });
        
        if (!response.ok) {
          if (response.status >= 500) {
            return { ok: false, message: response.statusText };
          }
          const message = await response.text();
          return { ok: false, message };
        }
        
        return { ok: true };
      } catch (e: any) {
        return { ok: false, message: e.toString() };
      }
    },
    onSuccess: () => {
      // Clear the user data from cache immediately
      queryClient.setQueryData(['user'], null);
      
      // Clear the query completely, not just invalidate
      queryClient.removeQueries({ queryKey: ['user'] });
      
      // Clear all query cache to ensure no stale data remains
      queryClient.clear();
      
      // Clear browser session storage/local storage if used
      try {
        sessionStorage.clear();
        localStorage.clear(); // Clear all localStorage, not just user
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
      
      // Ensure the next requests start fresh for auth checks
      queryClient.resetQueries();
    },
  });

  const registerMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest('/api/register', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // Removed bypass auth for production stability and to fix logout issues
  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}