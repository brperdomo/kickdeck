import { useUser, User } from './use-user';
import { createContext, useContext } from 'react';

// Import the AuthContext from our provider
import { AuthContext } from '@/lib/auth-provider';

/**
 * Simple hook that provides access to the AuthContext
 * This is needed because many components use useAuth
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}