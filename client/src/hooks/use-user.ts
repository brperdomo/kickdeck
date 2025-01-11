import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InsertUser, SelectUser } from "@db/schema";

// Temporary mock admin user for development
const mockAdminUser: SelectUser & { role?: { name: string, permissions: string[] } } = {
  id: 1,
  email: "bperdomo@zoho.com",
  username: "bperdomo@zoho.com",
  password: "",
  firstName: "Admin",
  lastName: "User",
  phone: null,
  isParent: false,
  roleId: 1,
  role: {
    name: 'SUPER_ADMIN',
    permissions: [
      'MANAGE_ADMINS',
      'MANAGE_EVENTS',
      'MANAGE_TEAMS',
      'VIEW_EVENTS',
      'VIEW_TEAMS',
      'VIEW_REPORTS',
    ],
  },
  createdAt: new Date().toISOString(),
};

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

async function fetchUser(): Promise<(SelectUser & { role?: { name: string, permissions: string[] } }) | null> {
  // Always bypass auth in development mode
  const isDev = import.meta.env.DEV;
  if (isDev) {
    console.log('🔓 Development mode - Using mock admin user');
    return mockAdminUser;
  }

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

  const { data: user, error, isLoading } = useQuery<(SelectUser & { role?: { name: string, permissions: string[] } }) | null, Error>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity, // Data never goes stale
    gcTime: 3600000, // Keep unused data for 1 hour
    retry: false
  });

  const loginMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest('/api/login', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logoutMutation = useMutation<RequestResult, Error>({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
    },
  });

  const registerMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest('/api/register', 'POST', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // Helper function to check if user has a specific permission
  const hasPermission = (permission: string) => {
    if (import.meta.env.DEV) {
      return mockAdminUser.role?.permissions.includes(permission) ?? false;
    }
    return user?.role?.permissions.includes(permission) ?? false;
  };

  return {
    user: import.meta.env.DEV ? mockAdminUser : user,
    isLoading: import.meta.env.DEV ? false : isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    hasPermission,
  };
}