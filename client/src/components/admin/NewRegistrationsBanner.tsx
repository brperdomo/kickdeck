import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellRing, Check, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/hooks/use-user';

/**
 * NewRegistrationsBanner component displays a notification banner for new team registrations
 * since an admin's last login or last time they viewed the registrations.
 * The banner can be dismissed by clicking the "Mark as Seen" button.
 */
export function NewRegistrationsBanner() {
  const { user } = useUser();
  const [visible, setVisible] = useState(true);
  const queryClient = useQueryClient();

  // Only fetch registrations for admin users
  const isAdmin = user?.isAdmin === true;

  // Query to get the count of new registrations
  const registrationsQuery = useQuery({
    queryKey: ['/api/admin/registrations/new-count'],
    queryFn: async () => {
      const response = await fetch('/api/admin/registrations/new-count');
      if (!response.ok) {
        throw new Error('Failed to fetch new registrations count');
      }
      return response.json();
    },
    // Only fetch for admin users and when the banner is visible
    enabled: isAdmin && visible,
    // Refetch every minute to keep the count updated
    refetchInterval: 60000,
  });

  // Mutation to acknowledge the new registrations
  const acknowledgeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/registrations/acknowledge', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to acknowledge new registrations');
      }
      return response.json();
    },
    onSuccess: () => {
      // Hide the banner and invalidate the query to update the count
      setVisible(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/registrations/new-count'] });
    },
  });

  // Function to handle marking registrations as seen
  function acknowledgeMarkAsSeen() {
    acknowledgeMutation.mutate();
  }

  // Hide the banner if there are no new registrations
  useEffect(() => {
    if (registrationsQuery.data?.count === 0) {
      setVisible(false);
    } else if (registrationsQuery.data?.count > 0) {
      setVisible(true);
    }
  }, [registrationsQuery.data?.count]);

  // Don't render anything if the user is not an admin or there's no new registrations
  if (!isAdmin || !visible || registrationsQuery.isLoading || registrationsQuery.isError || 
      !registrationsQuery.data || registrationsQuery.data?.count === 0) {
    return null;
  }

  // Format the "last viewed" timestamp
  const lastViewedText = registrationsQuery.data?.lastViewed 
    ? `Last checked ${formatDistanceToNow(new Date(registrationsQuery.data.lastViewed), { addSuffix: true })}`
    : 'New registrations available';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
          className="mb-8"
        >
          <div className="relative rounded-xl overflow-hidden shadow-lg border border-indigo-100">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-indigo-500/10 animate-gradient-x"></div>
            
            {/* Main alert content */}
            <div className="relative p-5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/40">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-2 rounded-full bg-indigo-100 dark:bg-indigo-800/50">
                    <BellRing className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <div>
                    <AlertTitle className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                      {registrationsQuery.data?.count === 1
                        ? '1 New Team Registration'
                        : `${registrationsQuery.data?.count} New Team Registrations`}
                    </AlertTitle>
                    <AlertDescription className="text-indigo-700 dark:text-indigo-300 mt-1">
                      {lastViewedText}
                    </AlertDescription>
                  </div>
                </div>
                
                <div className="flex space-x-3 items-center">
                  <Button 
                    size="sm" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all duration-200 hover:shadow-md"
                    onClick={acknowledgeMarkAsSeen}
                    disabled={acknowledgeMutation.isPending}
                  >
                    {acknowledgeMutation.isPending ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2">⏳</span> Processing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Check className="h-4 w-4 mr-2" /> Mark as Seen
                      </span>
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="rounded-full h-8 w-8 p-0 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 dark:hover:bg-indigo-800/50"
                    onClick={() => setVisible(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Bottom border with gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-blue-500"></div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}