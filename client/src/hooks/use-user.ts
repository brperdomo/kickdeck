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
    const response = await fetch('/api/user', {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }

      throw new Error(`${response.status}: ${await response.text()}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery<SelectUser | null, Error>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: 60000, // Data considered stale after 1 minute (rather than infinity)
    gcTime: 300000, // Keep unused data for 5 minutes (reduced from 1 hour)
    retry: 1, // Only retry once to avoid infinite loops with bad credentials
    refetchOnWindowFocus: true, // Make sure we refresh on window focus
    refetchOnMount: true // Make sure we refresh when components mount
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