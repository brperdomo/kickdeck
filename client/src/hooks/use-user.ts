import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define user type
export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isParent: boolean;
  isAdmin: boolean;
  createdAt: string;
  householdId: number;
  lastLogin: Date | null;
  lastViewedRegistrations: Date | null;
}

/**
 * Hook to manage user authentication state
 */
export function useUser() {
  const queryClient = useQueryClient();
  
  // Query current user
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const res = await fetch('/api/user');
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error('Failed to fetch user');
      }
      
      const userData = await res.json();
      
      // EMERGENCY FIX: Force admin status for specific emails
      if (userData) {
        const adminEmails = [
          'bperdomo@zoho.com',
          'jesus.desantiagojr@gmail.com', 
          'bryan@matchpro.ai'
        ];
        
        if (adminEmails.includes(userData.email.toLowerCase())) {
          console.log(`🔑 EMERGENCY: Force-enabling admin flag for ${userData.email}`);
          userData.isAdmin = true;
        }
      }
      
      return userData;
    },
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (!res.ok) {
        throw new Error('Login failed');
      }
      
      return res.json();
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(['/api/user'], userData);
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/logout', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Logout failed');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
    },
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: Partial<User> & { password: string }) => {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!res.ok) {
        throw new Error('Registration failed');
      }
      
      return res.json();
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(['/api/user'], userData);
    },
  });
  
  return {
    user,
    isLoading,
    error,
    loginMutation,
    logoutMutation,
    registerMutation,
  };
}