import { QueryClient } from "@tanstack/react-query";

// Global error handler for unhandled Promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled Promise Rejection:', event.reason);
  // Prevent the default browser behavior that would terminate scripts
  event.preventDefault();
});

/**
 * Utility function for making API requests
 * @param method - HTTP method to use
 * @param endpoint - API endpoint to call
 * @param body - Request body for POST/PUT requests
 * @returns Promise with the response
 */
export async function apiRequest(method = 'GET', endpoint: string, body?: any) {
  const options: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(endpoint, options);
    return response;
  } catch (error) {
    console.error(`API request error (${method} ${endpoint}):`, error);
    throw error;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [url, params] = Array.isArray(queryKey) 
          ? [queryKey[0], queryKey.slice(1)] 
          : [queryKey, []];
          
        try {
          // Add caching directives to improve performance
          const options: RequestInit = {
            credentials: "include",
            headers: {
              "Cache-Control": "max-age=300" // Tell browser to cache for 5 minutes
            }
          };

          const res = await fetch(url as string, options);

          if (!res.ok) {
            if (res.status >= 500) {
              console.error(`Server error: ${res.status}: ${res.statusText}`);
              throw new Error(`Server error: ${res.status}: ${res.statusText}`);
            }

            const errorText = await res.text();
            console.warn(`API error: ${res.status}: ${errorText}`);
            throw new Error(`API error: ${res.status}: ${errorText}`);
          }

          return res.json();
        } catch (error) {
          // Improve error handling and logging
          console.error(`Error fetching ${url}:`, error);
          throw error; // Re-throw so React Query can handle it
        }
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - match server cache time
      gcTime: 10 * 60 * 1000, // Keep in garbage collection for 10 minutes
      retry: (failureCount, error) => {
        // Only retry for network errors, not for 4xx client errors
        if (error instanceof Error && error.message.includes('Server error')) {
          return failureCount < 2; // Retry server errors up to 2 times
        }
        return false; // Don't retry other errors
      },
      // Add global error handler
      onError: (error) => {
        console.error('Query error:', error);
      }
    },
    mutations: {
      retry: false,
      // Add global error handler for mutations
      onError: (error) => {
        console.error('Mutation error:', error);
      }
    }
  },
});
