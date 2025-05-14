import { ReactNode, createContext, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseQueryResult,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Define types for our User
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  roles?: string[];
  phone?: string | null;
}

// Login/Register data types
interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// AuthContext type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  refreshUser: () => Promise<User | null>;
}

// API request helpers
async function apiRequest(
  method: string,
  url: string,
  body?: any
): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
    credentials: "include", // Important for cookie-based auth
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  // Handle errors
  if (!response.ok) {
    // Try to parse error message from response
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    } catch (e) {
      // If we can't parse the error response, throw a generic error
      if (e instanceof Error && e.message) {
        throw e;
      }
      throw new Error(`Request failed with status ${response.status}`);
    }
  }

  return response;
}

// Create the auth context
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch the current user - this is the main auth state
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        console.log("AUTH DEBUG: Fetching user data");
        const response = await fetch("/api/user", {
          credentials: "include", // Important for cookie-based auth
          headers: {
            // Add a cache-busting query parameter
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
          }
        });

        if (!response.ok) {
          console.log("AUTH DEBUG: Failed to fetch user data", response.status);
          if (response.status === 401) {
            // Unauthorized - user is not logged in
            return null;
          }
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const userData = await response.json();
        console.log("AUTH DEBUG: User data fetched successfully", userData);
        return userData;
      } catch (error) {
        console.error("AUTH DEBUG: Error fetching user", error);
        throw error;
      }
    },
    staleTime: 1000, // 1 second - more aggressive refresh
    refetchOnWindowFocus: true, // Refetch when window gains focus
    retry: 1, // Only retry once to avoid excessive retries on auth failures
  });

  // Function to manually refresh user data
  const refreshUser = async () => {
    console.log("AUTH DEBUG: Manually refreshing user data");
    const result = await refetch();
    return result.data ?? null;
  };

  // Login mutation
  const loginMutation = useMutation<User, Error, LoginData>({
    mutationFn: async (credentials) => {
      console.log("AUTH DEBUG: Attempting login");
      const res = await apiRequest("POST", "/api/login", credentials);
      const userData = await res.json();
      console.log("AUTH DEBUG: Login successful", userData);
      return userData;
    },
    onSuccess: (userData) => {
      console.log("AUTH DEBUG: Login mutation successful, updating user data");
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.firstName}!`,
      });
    },
    onError: (error) => {
      console.error("AUTH DEBUG: Login failed", error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation<User, Error, RegisterData>({
    mutationFn: async (userData) => {
      console.log("AUTH DEBUG: Attempting registration");
      const res = await apiRequest("POST", "/api/register", userData);
      const newUser = await res.json();
      console.log("AUTH DEBUG: Registration successful", newUser);
      return newUser;
    },
    onSuccess: (newUser) => {
      console.log("AUTH DEBUG: Registration mutation successful, updating user data");
      queryClient.setQueryData(["/api/user"], newUser);
      toast({
        title: "Registration successful",
        description: `Welcome, ${newUser.firstName}!`,
      });
    },
    onError: (error) => {
      console.error("AUTH DEBUG: Registration failed", error);
      toast({
        title: "Registration failed",
        description: error.message || "Please try again with different credentials",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      console.log("AUTH DEBUG: Attempting logout");
      await apiRequest("POST", "/api/logout");
      console.log("AUTH DEBUG: Logout successful");
    },
    onSuccess: () => {
      console.log("AUTH DEBUG: Logout mutation successful, clearing user data");
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error) => {
      console.error("AUTH DEBUG: Logout failed", error);
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive",
      });
    },
  });

  // Make sure we always pass a valid user (either the actual user or null, never undefined)
  const safeUser = user === undefined ? null : user;
  
  return (
    <AuthContext.Provider
      value={{
        user: safeUser,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        refreshUser,
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