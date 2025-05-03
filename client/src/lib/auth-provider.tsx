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
  // Use the user hook directly
  const userData = useUser();
  
  // Force admin status for specific emails
  let user = userData.user;
  if (user) {
    const adminEmails = [
      'bperdomo@zoho.com',
      'jesus.desantiagojr@gmail.com', 
      'bryan@matchpro.ai'
    ];
    
    if (user.email && adminEmails.includes(user.email.toLowerCase())) {
      console.log(`🔑 EMERGENCY AUTH PROVIDER: Force-enabling admin flag for ${user.email}`);
      user = {
        ...user,
        isAdmin: true
      };
    }
  }
  
  // Create a properly typed context value
  const contextValue: AuthContextType = {
    user: user || null, // Ensure we never pass undefined
    isLoading: userData.isLoading,
    error: userData.error,
    loginMutation: userData.loginMutation,
    logoutMutation: userData.logoutMutation,
    registerMutation: userData.registerMutation
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}