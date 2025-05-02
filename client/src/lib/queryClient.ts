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
          // Get cached ETag value from cache if available
          let etag: string | null = null;
          const cacheKey = `etag:${url}`;
          try {
            etag = localStorage.getItem(cacheKey);
          } catch (e) {
            console.warn('Could not access localStorage for ETag:', e);
          }
          
          // Add caching directives to improve performance
          const headers: Record<string, string> = {
            "Cache-Control": "max-age=3600" // Tell browser to cache for 1 hour
          };
          
          // Add If-None-Match header if we have an ETag
          if (etag) {
            headers["If-None-Match"] = etag;
          }
          
          const options: RequestInit = {
            credentials: "include",
            headers
          };

          const res = await fetch(url as string, options);
          
          // Handle 304 Not Modified responses
          if (res.status === 304) {
            // Return cached data - this should be in stale cache
            // React Query will handle returning the cached data
            throw new Error('Use cached data');
          }
          
          // Store the ETag for future requests if provided
          const newEtag = res.headers.get('ETag');
          if (newEtag) {
            try {
              localStorage.setItem(cacheKey, newEtag);
            } catch (e) {
              console.warn('Could not store ETag in localStorage:', e);
            }
          }

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
          // If error is "Use cached data", let React Query use stale data
          if (error instanceof Error && error.message === 'Use cached data') {
            throw error;
          }
          
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
      // Don't add a global error handler here as it's not supported in the type
    },
    mutations: {
      retry: false,
      // No global onError here either - we'll add specific error handlers to each mutation
    }
  },
});
