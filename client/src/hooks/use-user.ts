// Deprecated - Use useAuth hook instead 
// This wrapper is for backward compatibility with components using useUser

import { useAuth } from './use-auth';

export function useUser() {
  const { 
    user,
    isLoading,
    error,
    loginMutation,
    logoutMutation,
    registerMutation,
    authState
  } = useAuth();

  // Create a wrapper that provides the same interface as before
  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    // Also expose the authState for components that need it
    authState
  };
}