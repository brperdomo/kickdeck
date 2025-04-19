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
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Alert variant="default" className="border-blue-200 bg-blue-50 text-blue-800">
            <BellRing className="h-4 w-4 text-blue-500" />
            <div className="flex items-center justify-between w-full">
              <div>
                <AlertTitle className="text-blue-700">
                  {registrationsQuery.data?.count === 1
                    ? '1 new team registration'
                    : `${registrationsQuery.data?.count} new team registrations`}
                </AlertTitle>
                <AlertDescription className="text-blue-600 text-sm">
                  {lastViewedText}
                </AlertDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800"
                  onClick={acknowledgeMarkAsSeen}
                  disabled={acknowledgeMutation.isPending}
                >
                  {acknowledgeMutation.isPending ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-1">⏳</span> Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Check className="h-4 w-4 mr-1" /> Mark as Seen
                    </span>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                  onClick={() => setVisible(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}