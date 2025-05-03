/**
 * Auth Provider Component
 * This file provides the AuthProvider component and useAuth hook
 */
import { createContext, useContext, ReactNode } from "react";
import { useUser, User } from "@/hooks/use-user";

// Define AuthContext type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  // Use the user hook to get authentication state
  const { user, isLoading, error, loginMutation, logoutMutation, registerMutation } = useUser();
  
  // Create a properly typed context value
  const contextValue: AuthContextType = {
    user: user || null, // Ensure we never pass undefined
    isLoading,
    error,
    loginMutation,
    logoutMutation,
    registerMutation
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}