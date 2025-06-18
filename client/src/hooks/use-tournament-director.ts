import { useQuery } from '@tanstack/react-query';
import { useUser } from './use-user';

export interface TournamentDirectorAccess {
  isTournamentDirector: boolean;
  assignedEvents: string[];
  canAccessEvent: (eventId: string) => boolean;
  hasEventAccess: boolean;
}

export function useTournamentDirector(): TournamentDirectorAccess {
  const { user } = useUser();

  // Query to get Tournament Director's assigned events
  const { data: assignedEvents = [] } = useQuery<string[]>({
    queryKey: ['/api/admin/my-events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/my-events');
      if (!response.ok) {
        throw new Error('Failed to fetch assigned events');
      }
      return response.json();
    },
    enabled: !!user && user.isAdmin,
  });

  // Check if user has Tournament Director role
  const { data: userRoles = [] } = useQuery<string[]>({
    queryKey: ['/api/user/roles'],
    queryFn: async () => {
      const response = await fetch('/api/user/roles');
      if (!response.ok) {
        throw new Error('Failed to fetch user roles');
      }
      return response.json();
    },
    enabled: !!user,
  });

  const isTournamentDirector = userRoles.includes('tournament_director');
  const isSuperAdmin = userRoles.includes('super_admin');

  return {
    isTournamentDirector,
    assignedEvents: isTournamentDirector && !isSuperAdmin ? assignedEvents : [],
    canAccessEvent: (eventId: string) => {
      if (isSuperAdmin) return true;
      if (!isTournamentDirector) return false;
      return assignedEvents.includes(eventId);
    },
    hasEventAccess: isTournamentDirector && assignedEvents.length > 0,
  };
}