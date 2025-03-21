import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [url, params] = Array.isArray(queryKey) 
          ? [queryKey[0], queryKey.slice(1)] 
          : [queryKey, []];
          
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
            throw new Error(`${res.status}: ${res.statusText}`);
          }

          throw new Error(`${res.status}: ${await res.text()}`);
        }

        return res.json();
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - match server cache time
      gcTime: 10 * 60 * 1000, // Keep in garbage collection for 10 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});
