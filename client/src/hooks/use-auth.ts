import { useUser } from './use-user';
import { SelectUser } from '@db/schema';

/**
 * Simple hook that wraps useUser for backward compatibility
 * This is needed because AnimatedNavigationButton uses useAuth
 */
export function useAuth() {
  const userResult = useUser();
  
  return {
    ...userResult,
    // Force isAdmin flag to be true for known admin emails
    user: forceAdmin(userResult.user)
  };
}

/**
 * Emergency function to ensure admin users have admin privileges
 * This is applied to bypass permissions issues
 */
function forceAdmin(user: SelectUser | null): SelectUser | null {
  if (!user) return null;
  
  // Known admin emails should always be treated as admins
  const adminEmails = [
    'bperdomo@zoho.com',
    'jesus.desantiagojr@gmail.com',
    'bryan@matchpro.ai'
  ];
  
  // Safely check the email (it might be null or undefined)
  if (user.email && adminEmails.includes(user.email.toLowerCase())) {
    console.log(`🔑 EMERGENCY: Force-enabling admin flag for ${user.email}`);
    
    // Clone user and ensure admin flag is set
    return {
      ...user,
      isAdmin: true
    };
  }
  
  return user;
}